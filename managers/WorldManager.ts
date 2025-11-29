import { useWorldStore } from '../stores/worldStore';
import { AppState, VoxelData } from '../types';
import { generateNewHouseShape } from '../services/geminiService';
import { v4 as uuidv4 } from 'uuid';

export class WorldManager {
  
  init = () => {
    const { currentShape, setActiveVoxels } = useWorldStore.getState();
    const initialVoxels = currentShape.blocks.map(b => ({ ...b, id: uuidv4() }));
    setActiveVoxels(initialVoxels);
  }

  setTime = (val: number) => {
    useWorldStore.getState().setTimeOfDay(val);
  }

  smash = () => {
    const { appState, setAppState } = useWorldStore.getState();
    if (appState !== AppState.IDLE) return;
    setAppState(AppState.EXPLODING);
  }

  rebuild = async () => {
    const state = useWorldStore.getState();
    if (state.isGenerating || state.appState === AppState.IDLE) return;
    
    state.setIsGenerating(true);
    
    try {
        const newShape = await generateNewHouseShape(state.currentShape.name);
        state.setCurrentShape(newShape);

        const currentVoxels = [...state.activeVoxels];
        const needed = newShape.blocks.length;
        const available = currentVoxels.length;
        let updatedActive = [...currentVoxels];

        if (needed > available) {
            const diff = needed - available;
            for(let i=0; i<diff; i++) {
                updatedActive.push({
                    x: (Math.random() - 0.5) * 40,
                    y: 30, 
                    z: (Math.random() - 0.5) * 40,
                    color: newShape.blocks[available + i].color,
                    id: uuidv4()
                });
            }
        }
        state.setActiveVoxels(updatedActive);

        const targets = updatedActive.map((voxel, index): VoxelData | null => {
            if (index < newShape.blocks.length) {
                return { ...newShape.blocks[index], id: voxel.id };
            }
            return null; 
        }).filter((t): t is VoxelData => t !== null);

        state.setTargetVoxels(targets);
        state.setIsGenerating(false);
        state.setAppState(AppState.REBUILDING);

        setTimeout(() => { 
            useWorldStore.getState().setAppState(AppState.IDLE); 
        }, 4000); 
    } catch (e) {
        console.error("Rebuild failed", e);
        state.setIsGenerating(false);
    }
  }
}
import { create } from 'zustand';
import { AppState, VoxelData, VoxelShape } from '../types';
import { DEFAULT_VILLAGE_SHAPE } from '../constants';

interface WorldState {
  appState: AppState;
  currentShape: VoxelShape;
  activeVoxels: VoxelData[];
  targetVoxels: VoxelData[] | null;
  isGenerating: boolean;
  timeOfDay: number; // 0 to 24
  
  setAppState: (state: AppState) => void;
  setCurrentShape: (shape: VoxelShape) => void;
  setActiveVoxels: (voxels: VoxelData[]) => void;
  setTargetVoxels: (voxels: VoxelData[] | null) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setTimeOfDay: (time: number) => void;
}

export const useWorldStore = create<WorldState>((set) => ({
  appState: AppState.IDLE,
  currentShape: DEFAULT_VILLAGE_SHAPE,
  activeVoxels: [],
  targetVoxels: null,
  isGenerating: false,
  timeOfDay: 12, // Default to Noon for bright light

  setAppState: (appState) => set({ appState }),
  setCurrentShape: (currentShape) => set({ currentShape }),
  setActiveVoxels: (activeVoxels) => set({ activeVoxels }),
  setTargetVoxels: (targetVoxels) => set({ targetVoxels }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setTimeOfDay: (timeOfDay) => set({ timeOfDay }),
}));
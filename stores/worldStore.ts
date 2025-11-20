import { create } from 'zustand';
import { AppState, VoxelData, VoxelShape } from '../types';
import { DEFAULT_VILLAGE_SHAPE } from '../constants';

interface WorldState {
  appState: AppState;
  currentShape: VoxelShape;
  activeVoxels: VoxelData[];
  targetVoxels: VoxelData[] | null;
  isGenerating: boolean;
  isNight: boolean;
  
  setAppState: (state: AppState) => void;
  setCurrentShape: (shape: VoxelShape) => void;
  setActiveVoxels: (voxels: VoxelData[]) => void;
  setTargetVoxels: (voxels: VoxelData[] | null) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setIsNight: (isNight: boolean) => void;
}

export const useWorldStore = create<WorldState>((set) => ({
  appState: AppState.IDLE,
  currentShape: DEFAULT_VILLAGE_SHAPE,
  activeVoxels: [],
  targetVoxels: null,
  isGenerating: false,
  isNight: false,

  setAppState: (appState) => set({ appState }),
  setCurrentShape: (currentShape) => set({ currentShape }),
  setActiveVoxels: (activeVoxels) => set({ activeVoxels }),
  setTargetVoxels: (targetVoxels) => set({ targetVoxels }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setIsNight: (isNight) => set({ isNight }),
}));

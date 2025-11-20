import { create } from 'zustand';

interface UIState {
  showControls: boolean;
  setShowControls: (show: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  showControls: false,
  setShowControls: (showControls) => set({ showControls }),
}));

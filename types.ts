export interface VoxelData {
  x: number;
  y: number;
  z: number;
  color: string;
  id?: string; // Unique ID for physics tracking
}

export interface VoxelShape {
  name: string;
  blocks: VoxelData[];
}

export enum AppState {
  IDLE = 'IDLE',         // House is standing
  EXPLODING = 'EXPLODING', // Physics active, blocks flying
  REBUILDING = 'REBUILDING' // Blocks flying back to new positions
}


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

// Global augmentation for React Three Fiber elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      meshStandardMaterial: any;
      meshBasicMaterial: any;
      meshPhysicalMaterial: any;
      boxGeometry: any;
      planeGeometry: any;
      sphereGeometry: any;
      cylinderGeometry: any;
      coneGeometry: any;
      circleGeometry: any;
      dodecahedronGeometry: any;
      ambientLight: any;
      directionalLight: any;
      pointLight: any;
      orthographicCamera: any;
      fog: any;
      color: any;
    }
  }
}

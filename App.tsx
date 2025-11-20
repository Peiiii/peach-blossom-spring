
import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, Stars } from '@react-three/drei';
import { Physics } from '@react-three/cannon';
import { v4 as uuidv4 } from 'uuid';

import { AppState, VoxelData, VoxelShape } from './types';
import { DEFAULT_VILLAGE_SHAPE } from './constants';
import { generateNewHouseShape } from './services/geminiService';
import { 
  OrganicEnvironment, 
  PopulationSystem,
  CloudLayer
} from './components/WorldElements';
import { PhysicsVoxel } from './components/PhysicsVoxel';
import { Player } from './components/Player';

const Lighting = () => (
  <>
    <ambientLight intensity={0.6} />
    <directionalLight 
      position={[50, 80, 25]} 
      intensity={1.5} 
      castShadow 
      shadow-mapSize={[1024, 1024]} // Optimization: Reduced shadow resolution
    >
      <orthographicCamera attach="shadow-camera" args={[-80, 80, 80, -80]} />
    </directionalLight>
  </>
);

const App = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [currentShape, setCurrentShape] = useState<VoxelShape>(DEFAULT_VILLAGE_SHAPE);
  const [activeVoxels, setActiveVoxels] = useState<VoxelData[]>([]);
  const [targetVoxels, setTargetVoxels] = useState<VoxelData[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const initialVoxels = DEFAULT_VILLAGE_SHAPE.blocks.map(b => ({ ...b, id: uuidv4() }));
    setActiveVoxels(initialVoxels);
  }, []);

  const handleSmash = () => {
    if (appState !== AppState.IDLE) return;
    setAppState(AppState.EXPLODING);
  };

  const handleRebuild = async () => {
    if (isGenerating || appState === AppState.IDLE) return;
    setIsGenerating(true);
    
    const newShape = await generateNewHouseShape(currentShape.name);
    setCurrentShape(newShape);

    const currentVoxels = [...activeVoxels];
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
    setActiveVoxels(updatedActive);

    const targets = updatedActive.map((voxel, index): VoxelData | null => {
        if (index < newShape.blocks.length) {
            return { ...newShape.blocks[index], id: voxel.id };
        }
        return null; 
    }).filter((t): t is VoxelData => t !== null);

    setTargetVoxels(targets);
    setIsGenerating(false);
    setAppState(AppState.REBUILDING);

    setTimeout(() => { setAppState(AppState.IDLE); }, 4000); 
  };

  return (
    <div className="relative w-full h-screen bg-blue-300 select-none">
      <div className="absolute top-0 left-0 w-full p-6 z-10 flex justify-between items-start pointer-events-none">
        <div>
            <h1 className="text-4xl font-pixel text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] mb-2">
            PEACH BLOSSOM SPRING
            </h1>
            <div className="flex flex-col gap-2">
              <div className="text-white text-sm font-bold drop-shadow-md bg-black/40 p-3 rounded backdrop-blur-sm inline-block">
                <p className="text-yellow-300 mb-1">🎮 CONTROLS</p>
                <p>• WASD: Move</p>
                <p>• SPACE: Jump / Up</p>
                <p>• SHIFT: Descend</p>
                <p>• F: Toggle Fly Mode</p>
                <p>• DRAG: Rotate Camera</p>
              </div>
            </div>
        </div>

        <div className="pointer-events-auto flex flex-col gap-4 items-end">
            {appState === AppState.IDLE && (
                <button onClick={handleSmash} className="bg-red-600 hover:bg-red-500 text-white font-pixel py-4 px-8 rounded-xl shadow-lg">
                DESTROY VILLAGE
                </button>
            )}

            {appState === AppState.EXPLODING && (
                <button onClick={handleRebuild} disabled={isGenerating} className={`bg-green-600 hover:bg-green-500 text-white font-pixel py-4 px-8 rounded-xl shadow-lg ${isGenerating ? 'opacity-70' : ''}`}>
                {isGenerating ? 'CONSULTING SPIRITS...' : 'REBUILD (AI)'}
                </button>
            )}
        </div>
      </div>

      {/* Optimization: dpr limits pixel ratio for better performance on high-res screens */}
      {/* Tighter camera position [0, 5, 5] to match the reduced maxDistance radius */}
      <Canvas shadows camera={{ position: [0, 5, 5], fov: 50 }} dpr={[1, 1.5]}>
        <fog attach="fog" args={['#FFDEE9', 20, 120]} /> 
        
        <Suspense fallback={null}>
            <Sky sunPosition={[100, 20, 100]} />
            <Stars />
            <Lighting />

            {/* Physics enabled for smashing debris */}
            <Physics gravity={[0, -9.81, 0]}>
                <Player />
                <OrganicEnvironment />
                <PopulationSystem />
                <CloudLayer />
                
                {activeVoxels.map((voxel, i) => {
                    const target = targetVoxels?.find(t => t.id === voxel.id);
                    return (
                        <PhysicsVoxel 
                            key={voxel.id || i} 
                            data={voxel} 
                            targetData={target}
                            appState={appState} 
                        />
                    );
                })}
            </Physics>
        </Suspense>
      </Canvas>
    </div>
  );
};

export default App;

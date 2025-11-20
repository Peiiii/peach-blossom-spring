
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
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    const initialVoxels = DEFAULT_VILLAGE_SHAPE.blocks.map(b => ({ ...b, id: uuidv4() }));
    setActiveVoxels(initialVoxels);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyH') {
        setShowControls(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
        <div className="flex flex-col items-start">
            <h1 className="text-2xl md:text-4xl font-pixel text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] mb-2">
            PEACH BLOSSOM SPRING
            </h1>
            
            <div className="pointer-events-auto mt-2">
                {!showControls ? (
                    <button 
                        onClick={() => setShowControls(true)}
                        className="bg-black/40 hover:bg-black/60 text-white font-pixel text-xs py-2 px-3 rounded backdrop-blur-md border border-white/10 transition-all"
                    >
                        [H] CONTROLS
                    </button>
                ) : (
                    <div className="bg-black/80 p-4 rounded-lg backdrop-blur-md border-2 border-white/20 min-w-[200px] shadow-xl">
                         <div className="flex justify-between items-center mb-3 border-b border-white/20 pb-2">
                            <h2 className="text-yellow-400 font-pixel text-xs">CONTROLS</h2>
                            <button onClick={() => setShowControls(false)} className="text-white/60 hover:text-white font-pixel text-xs">[X]</button>
                         </div>
                         <div className="space-y-2 font-pixel text-[10px] text-white/90">
                            <div className="flex justify-between"><span>MOVE</span> <span className="text-white/50">WASD</span></div>
                            <div className="flex justify-between"><span>JUMP</span> <span className="text-white/50">SPACE</span></div>
                            <div className="flex justify-between"><span>DESCEND</span> <span className="text-white/50">SHIFT</span></div>
                            <div className="flex justify-between"><span>FLY MODE</span> <span className="text-white/50">F</span></div>
                            <div className="flex justify-between"><span>CAMERA</span> <span className="text-white/50">DRAG</span></div>
                         </div>
                    </div>
                )}
            </div>
        </div>

        <div className="pointer-events-auto flex flex-col gap-4 items-end">
            {appState === AppState.IDLE && (
                <button onClick={handleSmash} className="bg-red-600 hover:bg-red-500 text-white font-pixel py-4 px-8 rounded-xl shadow-lg border-b-4 border-red-800 active:border-b-0 active:translate-y-1 transition-all">
                DESTROY VILLAGE
                </button>
            )}

            {appState === AppState.EXPLODING && (
                <button onClick={handleRebuild} disabled={isGenerating} className={`bg-green-600 hover:bg-green-500 text-white font-pixel py-4 px-8 rounded-xl shadow-lg border-b-4 border-green-800 active:border-b-0 active:translate-y-1 transition-all ${isGenerating ? 'opacity-70' : ''}`}>
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

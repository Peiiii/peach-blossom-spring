
import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
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

const Sun = () => {
  return (
    <group position={[50, 80, 25]}>
        <mesh>
            <sphereGeometry args={[5, 32, 32]} />
            <meshBasicMaterial color="#FDB813" toneMapped={false} />
        </mesh>
        {/* Halo glow effect */}
        <mesh scale={[1.4, 1.4, 1.4]}>
            <sphereGeometry args={[5, 32, 32]} />
            <meshBasicMaterial color="#FFD54F" transparent opacity={0.4} side={2} />
        </mesh>
    </group>
  )
}

const Lighting = ({ isNight }: { isNight: boolean }) => (
  <>
    <ambientLight intensity={isNight ? 0.05 : 0.5} />
    <directionalLight 
      position={isNight ? [-20, 40, -20] : [50, 80, 25]} 
      intensity={isNight ? 0.2 : 1.5} 
      color={isNight ? "#88aadd" : "#fffacd"}
      castShadow 
      shadow-mapSize={[2048, 2048]}
      shadow-bias={-0.0001}
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
  const [showControls, setShowControls] = useState(false); // Default hidden
  const [isNight, setIsNight] = useState(false); // Default to Day

  useEffect(() => {
    const initialVoxels = DEFAULT_VILLAGE_SHAPE.blocks.map(b => ({ ...b, id: uuidv4() }));
    setActiveVoxels(initialVoxels);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: any) => {
      if (e.code === 'KeyH') {
        setShowControls(prev => !prev);
      }
      if (e.code === 'KeyT') {
        setIsNight(prev => !prev);
      }
    };
    (window as any).addEventListener('keydown', handleKeyDown);
    return () => (window as any).removeEventListener('keydown', handleKeyDown);
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

  // Colors
  const bgDay = '#87CEEB';
  const bgNight = '#0b1026';

  return (
    <div className={`relative w-full h-screen select-none transition-colors duration-1000`} style={{ backgroundColor: isNight ? bgNight : bgDay }}>
      <div className="absolute top-0 left-0 w-full p-6 z-10 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col items-start">
            <h1 className="text-2xl md:text-4xl font-pixel text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] mb-2">
            PEACH BLOSSOM SPRING
            </h1>
            
            <div className="pointer-events-auto mt-2 flex flex-col gap-2 items-start">
                <div className="flex gap-2">
                    <button 
                        onClick={() => setShowControls(!showControls)}
                        className="bg-black/40 hover:bg-black/60 text-white/70 font-pixel text-[10px] py-2 px-3 rounded backdrop-blur-md border border-white/10 transition-all"
                    >
                        {showControls ? '[-] CONTROLS' : '[H] CONTROLS'}
                    </button>
                    <button 
                        onClick={() => setIsNight(!isNight)}
                        className="bg-black/40 hover:bg-black/60 text-white/70 font-pixel text-[10px] py-2 px-3 rounded backdrop-blur-md border border-white/10 transition-all"
                    >
                        {isNight ? '[T] SUN' : '[T] MOON'}
                    </button>
                </div>

                {showControls && (
                    <div className="bg-black/80 p-4 rounded-lg backdrop-blur-md border border-white/20 w-[200px] shadow-xl mt-2">
                         <div className="space-y-3 font-pixel text-[10px] text-white/90">
                            <div className="flex justify-between border-b border-white/10 pb-1"><span>MOVE</span> <span className="text-yellow-400">WASD</span></div>
                            <div className="flex justify-between border-b border-white/10 pb-1"><span>JUMP</span> <span className="text-yellow-400">SPACE</span></div>
                            <div className="flex justify-between border-b border-white/10 pb-1"><span>DESCEND</span> <span className="text-yellow-400">SHIFT</span></div>
                            <div className="flex justify-between border-b border-white/10 pb-1"><span>FLY</span> <span className="text-yellow-400">F</span></div>
                            <div className="flex justify-between border-b border-white/10 pb-1"><span>TIME</span> <span className="text-yellow-400">T</span></div>
                            <div className="flex justify-between"><span>VIEW</span> <span className="text-yellow-400">DRAG</span></div>
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
        {/* Dynamic Fog: Dark Blue at night, Sky Blue at day */}
        <fog attach="fog" args={[isNight ? '#0b1026' : '#87CEEB', 20, 150]} /> 
        <color attach="background" args={[isNight ? '#0b1026' : '#87CEEB']} />
        
        <Suspense fallback={null}>
            {isNight && <Stars radius={120} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />}
            {!isNight && <Sun />}
            
            <Lighting isNight={isNight} />

            {/* Physics enabled for smashing debris */}
            <Physics gravity={[0, -9.81, 0]}>
                <Player />
                <OrganicEnvironment isNight={isNight} />
                <PopulationSystem />
                {!isNight && <CloudLayer />}
                
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
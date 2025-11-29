import React, { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { Physics } from '@react-three/cannon';
import { useWorldStore } from '../stores/worldStore';
import { OrganicEnvironment } from './WorldElements';
import { PopulationSystem } from './world/Villagers';
import { CloudLayer } from './world/Sky';
import { PhysicsVoxel } from './PhysicsVoxel';
import { Player } from './Player';

const Sun = () => {
    return (
      <group position={[50, 80, 25]}>
          <mesh>
              <sphereGeometry args={[5, 32, 32]} />
              <meshBasicMaterial color="#FDB813" toneMapped={false} />
          </mesh>
          <mesh scale={[1.4, 1.4, 1.4]}>
              <sphereGeometry args={[5, 32, 32]} />
              <meshBasicMaterial color="#FFD54F" transparent opacity={0.4} side={2} />
          </mesh>
      </group>
    )
  }
  
  const Lighting = ({ isNight }: { isNight: boolean }) => (
    <>
      <ambientLight intensity={isNight ? 0.3 : 0.5} />
      <directionalLight 
        position={isNight ? [-20, 40, -20] : [50, 80, 25]} 
        intensity={isNight ? 0.6 : 1.5} 
        color={isNight ? "#88aadd" : "#fffacd"}
        castShadow 
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
      >
        <orthographicCamera attach="shadow-camera" args={[-80, 80, 80, -80]} />
      </directionalLight>
    </>
  );

export const GameCanvas = () => {
    const activeVoxels = useWorldStore(state => state.activeVoxels);
    const targetVoxels = useWorldStore(state => state.targetVoxels);
    const appState = useWorldStore(state => state.appState);
    const isNight = useWorldStore(state => state.isNight);

    // Optimize lookup for rebuild targets
    const targetMap = useMemo(() => {
        if (!targetVoxels) return new Map();
        return new Map(targetVoxels.map(t => [t.id!, t]));
    }, [targetVoxels]);

    return (
        <Canvas shadows camera={{ position: [0, 5, 5], fov: 50 }} dpr={[1, 1.5]}>
            <fog attach="fog" args={[isNight ? '#0b1026' : '#87CEEB', 20, 150]} /> 
            <color attach="background" args={[isNight ? '#0b1026' : '#87CEEB']} />
            
            <Suspense fallback={null}>
                {isNight && <Stars radius={120} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />}
                {!isNight && <Sun />}
                
                <Lighting isNight={isNight} />

                <Physics gravity={[0, -9.81, 0]}>
                    <Player />
                    <OrganicEnvironment isNight={isNight} />
                    <PopulationSystem />
                    {!isNight && <CloudLayer />}
                    
                    {activeVoxels.map((voxel) => {
                        const target = targetMap.get(voxel.id!);
                        return (
                            <PhysicsVoxel 
                                key={voxel.id} 
                                data={voxel} 
                                targetData={target}
                                appState={appState} 
                            />
                        );
                    })}
                </Physics>
            </Suspense>
        </Canvas>
    );
};
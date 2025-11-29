import React, { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { Physics } from '@react-three/cannon';
import * as THREE from 'three';
import { useWorldStore } from '../stores/worldStore';
import { OrganicEnvironment } from './WorldElements';
import { PopulationSystem } from './world/Villagers';
import { CloudLayer } from './world/Sky';
import { PhysicsVoxel } from './PhysicsVoxel';
import { Player } from './Player';

// --- Sky System Helpers ---

const interpolateColor = (c1: string, c2: string, alpha: number) => {
    return new THREE.Color(c1).lerp(new THREE.Color(c2), alpha);
};

const getSkyConfig = (time: number) => {
    // Colors
    const NIGHT = '#0b1026';
    const DAWN = '#FF9A9E';
    const DAY = '#87CEEB';
    const DUSK = '#FF7E5F';

    let skyColor = new THREE.Color(NIGHT);
    let fogColor = new THREE.Color(NIGHT);
    let sunIntensity = 0;
    let moonIntensity = 0;
    let ambientIntensity = 0.2;
    let starOpacity = 1;

    // Time Phases
    if (time >= 0 && time < 5) {
        // Deep Night
        skyColor.set(NIGHT);
        fogColor.set(NIGHT);
        moonIntensity = 1.0;
        ambientIntensity = 0.2;
        starOpacity = 1;
    } else if (time >= 5 && time < 7) {
        // Dawn (5-7)
        const t = (time - 5) / 2;
        skyColor = interpolateColor(NIGHT, DAWN, t);
        fogColor = interpolateColor(NIGHT, DAWN, t);
        sunIntensity = t * 0.5;
        moonIntensity = 1.0 - t;
        ambientIntensity = 0.2 + t * 0.3;
        starOpacity = 1 - t;
    } else if (time >= 7 && time < 10) {
        // Morning (7-10) - Transition to Blue
        const t = (time - 7) / 3;
        skyColor = interpolateColor(DAWN, DAY, t);
        fogColor = interpolateColor(DAWN, DAY, t);
        sunIntensity = 0.5 + t * 0.5;
        ambientIntensity = 0.5 + t * 0.2;
        starOpacity = 0;
    } else if (time >= 10 && time < 16) {
        // Full Day (10-16)
        skyColor.set(DAY);
        fogColor.set(DAY);
        sunIntensity = 1.2;
        ambientIntensity = 0.7; // Brightest
        starOpacity = 0;
    } else if (time >= 16 && time < 19) {
        // Dusk (16-19)
        const t = (time - 16) / 3;
        skyColor = interpolateColor(DAY, DUSK, t);
        fogColor = interpolateColor(DAY, DUSK, t);
        sunIntensity = 1.2 - t * 0.7;
        ambientIntensity = 0.7 - t * 0.3;
        starOpacity = t * 0.3;
    } else if (time >= 19 && time < 21) {
        // Twilight (19-21)
        const t = (time - 19) / 2;
        skyColor = interpolateColor(DUSK, NIGHT, t);
        fogColor = interpolateColor(DUSK, NIGHT, t);
        sunIntensity = 0.5 - t * 0.5;
        moonIntensity = t * 1.0;
        ambientIntensity = 0.4 - t * 0.2;
        starOpacity = 0.3 + t * 0.7;
    } else {
        // Night (21-24)
        skyColor.set(NIGHT);
        fogColor.set(NIGHT);
        moonIntensity = 1.0;
        ambientIntensity = 0.2;
        starOpacity = 1;
    }

    return { skyColor, fogColor, sunIntensity, moonIntensity, ambientIntensity, starOpacity };
};

const CelestialBodies = ({ time }: { time: number }) => {
    const sunRef = useRef<THREE.Group>(null);
    const moonRef = useRef<THREE.Group>(null);
    const lightRef = useRef<THREE.DirectionalLight>(null);
    const { skyColor, fogColor, sunIntensity, moonIntensity, ambientIntensity, starOpacity } = getSkyConfig(time);

    // Calculate Position based on 24h cycle
    // 6:00 = 0 deg (Rise), 12:00 = 90 deg (Top), 18:00 = 180 deg (Set)
    // Map time to angle in radians. 
    // Shift so 6am is roughly horizon.
    // 0 = Midnight (Bottom), 12 = Noon (Top)
    const angle = ((time - 6) / 24) * Math.PI * 2;
    const radius = 100;
    const sunX = Math.cos(angle) * radius;
    const sunY = Math.sin(angle) * radius; // Up/Down
    const sunZ = Math.sin(angle * 0.5) * 20; // Slight slight tilt for interest

    useFrame((state) => {
        // Sync background/fog
        state.scene.background = skyColor;
        if(state.scene.fog) (state.scene.fog as THREE.Fog).color = fogColor;
    });

    return (
        <>
            <ambientLight intensity={ambientIntensity} />
            
            {/* SUN */}
            <group ref={sunRef} position={[sunX, sunY, sunZ]}>
                 <mesh visible={sunY > -10}>
                    <sphereGeometry args={[8, 32, 32]} />
                    <meshBasicMaterial color="#FDB813" toneMapped={false} />
                 </mesh>
                 <mesh visible={sunY > -10} scale={[1.6, 1.6, 1.6]}>
                    <sphereGeometry args={[8, 32, 32]} />
                    <meshBasicMaterial color="#FFD54F" transparent opacity={0.3} side={THREE.BackSide} />
                 </mesh>
                 <directionalLight 
                    ref={lightRef}
                    intensity={sunIntensity}
                    color="#fffacd"
                    castShadow
                    shadow-mapSize={[2048, 2048]}
                    shadow-bias={-0.0005}
                    shadow-camera-left={-80}
                    shadow-camera-right={80}
                    shadow-camera-top={80}
                    shadow-camera-bottom={-80}
                 />
            </group>

            {/* MOON (Opposite to Sun) */}
            <group ref={moonRef} position={[-sunX, -sunY, -sunZ]}>
                 <mesh visible={-sunY > -10}>
                    <sphereGeometry args={[5, 32, 32]} />
                    <meshBasicMaterial color="#FEFCD7" toneMapped={false} />
                 </mesh>
                 <directionalLight 
                    intensity={moonIntensity * 0.5} // Faint moon light shadow
                    color="#88aadd"
                    castShadow={false}
                 />
            </group>
            
            <Stars radius={150} depth={50} count={3000} factor={4} saturation={0} fade speed={1} opacity={starOpacity} />
        </>
    );
};

export const GameCanvas = () => {
    const activeVoxels = useWorldStore(state => state.activeVoxels);
    const targetVoxels = useWorldStore(state => state.targetVoxels);
    const appState = useWorldStore(state => state.appState);
    const timeOfDay = useWorldStore(state => state.timeOfDay);

    // Optimize lookup for rebuild targets
    const targetMap = useMemo(() => {
        if (!targetVoxels) return new Map();
        return new Map(targetVoxels.map(t => [t.id!, t]));
    }, [targetVoxels]);

    return (
        <Canvas shadows camera={{ position: [0, 5, 5], fov: 50 }} dpr={[1, 1.5]}>
            <fog attach="fog" args={['#87CEEB', 20, 150]} /> 
            
            <Suspense fallback={null}>
                <CelestialBodies time={timeOfDay} />

                <Physics gravity={[0, -9.81, 0]}>
                    <Player />
                    <OrganicEnvironment timeOfDay={timeOfDay} />
                    <PopulationSystem />
                    <CloudLayer />
                    
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

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { COLORS, getRiverPath, BRIDGE_Z_OFFSET } from '../constants';

import { PhysicsGround, DistantMountains } from './world/Terrain';
import { GalaxyWaterfall } from './world/Water';
import { LanternSystem } from './world/LightingAssets';
import { VegetationLayer, FarmFields } from './world/Vegetation';
import { PopulationSystem } from './world/Villagers';
import { CloudLayer } from './world/Sky';

export const OrganicEnvironment = React.memo(({ timeOfDay }: { timeOfDay: number }) => {
    
    // Generate River visual mesh matching the Physics function
    const riverCurve = useMemo(() => {
        const points = [];
        for (let x = -60; x <= 60; x += 1) {
            points.push(new THREE.Vector3(x, 0, getRiverPath(x)));
        }
        return new THREE.CatmullRomCurve3(points);
    }, []);

    // Road that crosses the bridge at x=0
    const roadCurve = useMemo(() => {
        const points = [];
        // Start far left
        points.push(new THREE.Vector3(-40, 0, BRIDGE_Z_OFFSET + 10));
        points.push(new THREE.Vector3(-10, 0, BRIDGE_Z_OFFSET + 2));
        // Cross Bridge
        points.push(new THREE.Vector3(0, 0, BRIDGE_Z_OFFSET)); 
        // Go right
        points.push(new THREE.Vector3(10, 0, BRIDGE_Z_OFFSET - 2));
        points.push(new THREE.Vector3(40, 0, BRIDGE_Z_OFFSET - 10));
        return new THREE.CatmullRomCurve3(points);
    }, []);

    const riverGeo = useMemo(() => new THREE.TubeGeometry(riverCurve, 128, 3.5, 8, false), [riverCurve]);
    const roadGeo = useMemo(() => new THREE.TubeGeometry(roadCurve, 64, 1.2, 3, false), [roadCurve]);

    return (
        <group>
            {/* The ground terrain + bridge physics/visuals */}
            <PhysicsGround />
            
            {/* Visual waterfall at the end of the river */}
            <GalaxyWaterfall position={[60, -2, getRiverPath(60)]} />

            {/* River Water - Sits inside the trench (y = -1.2) */}
            <mesh geometry={riverGeo} position={[0, -1.2, 0]} scale={[1, 0.1, 1]} receiveShadow>
                <meshStandardMaterial color={COLORS.WATER} roughness={0.1} metalness={0.1} opacity={0.8} transparent />
            </mesh>
            
            {/* Road - Sits on top of ground (y=0.05), but we need to elevate it slightly over the bridge part visually? 
                Actually the physics bridge is at 0.1, so road at 0.15 is fine. 
                But the road curve is flat y=0.
            */}
            <mesh geometry={roadGeo} position={[0, 0.05, 0]} scale={[1, 0.05, 1]} receiveShadow>
                <meshStandardMaterial color={COLORS.DIRT} roughness={1} />
            </mesh>

            {/* Bridge Rails Visuals */}
            <group position={[0, 0.2, BRIDGE_Z_OFFSET]}>
                 <mesh position={[0, 0.5, 2]}>
                    <boxGeometry args={[4, 0.1, 0.2]} />
                    <meshStandardMaterial color={COLORS.WOOD_LIGHT} />
                 </mesh>
                 <mesh position={[0, 0.5, -2]}>
                    <boxGeometry args={[4, 0.1, 0.2]} />
                    <meshStandardMaterial color={COLORS.WOOD_LIGHT} />
                 </mesh>
                 {/* Posts */}
                 <mesh position={[-1.8, 0.25, 2]}><boxGeometry args={[0.2, 0.5, 0.2]} /><meshStandardMaterial color={COLORS.WOOD_DARK} /></mesh>
                 <mesh position={[1.8, 0.25, 2]}><boxGeometry args={[0.2, 0.5, 0.2]} /><meshStandardMaterial color={COLORS.WOOD_DARK} /></mesh>
                 <mesh position={[-1.8, 0.25, -2]}><boxGeometry args={[0.2, 0.5, 0.2]} /><meshStandardMaterial color={COLORS.WOOD_DARK} /></mesh>
                 <mesh position={[1.8, 0.25, -2]}><boxGeometry args={[0.2, 0.5, 0.2]} /><meshStandardMaterial color={COLORS.WOOD_DARK} /></mesh>
            </group>

            <LanternSystem curve={roadCurve} time={timeOfDay} />
            <DistantMountains />
            {/* Reduced count for performance */}
            <VegetationLayer count={60} minRange={20} maxRange={90} />
            <FarmFields />
        </group>
    );
});

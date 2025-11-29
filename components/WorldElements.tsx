import React, { useMemo } from 'react';
import * as THREE from 'three';
import { COLORS } from '../constants';

import { PhysicsGround, DistantMountains } from './world/Terrain';
import { GalaxyWaterfall } from './world/Water';
import { LanternSystem } from './world/LightingAssets';
import { VegetationLayer, FarmFields } from './world/Vegetation';
import { PopulationSystem } from './world/Villagers';
import { CloudLayer } from './world/Sky';

// --- Helper Constants ---
const generateCurve = (scale: number, seed: number) => {
    const points = [];
    for (let i = 0; i <= 10; i++) {
        const x = (i - 5) * 20;
        const z = Math.sin(i * 0.8 + seed) * 20 + Math.cos(i * 0.3) * 10;
        points.push(new THREE.Vector3(x, 0, z));
    }
    return new THREE.CatmullRomCurve3(points);
};

export const OrganicEnvironment = React.memo(({ isNight }: { isNight: boolean }) => {
    const riverCurve = useMemo(() => generateCurve(1, 0), []);
    const roadCurve = useMemo(() => generateCurve(1, 2), []);

    const riverGeo = useMemo(() => new THREE.TubeGeometry(riverCurve, 64, 4, 8, false), [riverCurve]);
    const roadGeo = useMemo(() => {
        const points = roadCurve.getPoints(64).map(p => new THREE.Vector3(p.x + 5, 0.05, p.z + 5));
        const curve = new THREE.CatmullRomCurve3(points);
        return new THREE.TubeGeometry(curve, 64, 1.5, 3, false);
    }, [roadCurve]);

    return (
        <group>
            <PhysicsGround />
            <GalaxyWaterfall />
            {/* Flattened River: Scale Y to near-zero to make it a flat ribbon on the surface */}
            <mesh geometry={riverGeo} position={[0, 0.02, 0]} scale={[1, 0.02, 1]} receiveShadow>
                <meshStandardMaterial color={COLORS.WATER} roughness={0.1} metalness={0.1} opacity={0.9} transparent />
            </mesh>
            <mesh geometry={roadGeo} position={[0, 0.05, 0]} scale={[1, 0.05, 1]} receiveShadow>
                <meshStandardMaterial color={COLORS.DIRT} roughness={1} />
            </mesh>
            <LanternSystem curve={roadCurve} isNight={isNight} />
            <DistantMountains />
            {/* Reduced count for performance */}
            <VegetationLayer count={60} minRange={20} maxRange={90} />
            <FarmFields />
        </group>
    );
});
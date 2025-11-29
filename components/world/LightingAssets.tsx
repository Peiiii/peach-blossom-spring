import React, { useMemo } from 'react';
import * as THREE from 'three';

export const LanternSystem = ({ curve, time }: { curve: THREE.CatmullRomCurve3, time: number }) => {
    const points = useMemo(() => {
        // Shift points to match road offset (x+5, z+5)
        return curve.getPoints(20).map(p => new THREE.Vector3(p.x + 5, 0, p.z + 5));
    }, [curve]);

    // Lights on between 19:00 (7PM) and 6:00 (6AM)
    const isLightsOn = time > 18.5 || time < 6;

    return (
        <group>
            {points.map((pt, i) => {
                if (i % 3 !== 0) return null; // Space them out
                // Alternate sides
                const offset = i % 2 === 0 ? 2.5 : -2.5;
                return <StreetLamp key={i} position={[pt.x + offset, 0, pt.z + offset]} isLit={isLightsOn} />
            })}
        </group>
    )
}

export const StreetLamp: React.FC<{ position: [number, number, number], isLit: boolean }> = ({ position, isLit }) => {
    return (
        <group position={position}>
             {/* Pole */}
             <mesh position={[0, 1.5, 0]} castShadow>
                <cylinderGeometry args={[0.1, 0.15, 3]} />
                <meshStandardMaterial color="#4E342E" />
             </mesh>
             {/* Crossbar */}
             <mesh position={[0, 2.8, 0]} rotation={[0, 0, 0]}>
                <boxGeometry args={[0.8, 0.1, 0.1]} />
                <meshStandardMaterial color="#4E342E" />
             </mesh>
             {/* Lantern */}
             <mesh position={[0.3, 2.4, 0]}>
                <boxGeometry args={[0.3, 0.5, 0.3]} />
                <meshStandardMaterial 
                    color={isLit ? "#FFF9C4" : "#F5F5F5"} 
                    emissive={isLit ? "#FFD54F" : "#000000"}
                    emissiveIntensity={isLit ? 4.0 : 0}
                />
                {isLit && <pointLight distance={25} decay={2} intensity={10} color="#FFD54F" castShadow />}
             </mesh>
        </group>
    )
}
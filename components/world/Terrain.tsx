import React from 'react';
import { usePlane } from '@react-three/cannon';
import { COLORS } from '../../constants';

export const PhysicsGround = () => {
    const [ref] = usePlane(() => ({ 
        rotation: [-Math.PI / 2, 0, 0], 
        position: [0, 0, 0], 
        material: { friction: 0.5 } 
    }));
    return (
        <mesh ref={ref as any} receiveShadow>
            <planeGeometry args={[200, 200, 64, 64]} />
            <meshStandardMaterial color={COLORS.GRASS} roughness={1} />
        </mesh>
    );
}

export const DistantMountains = React.memo(() => {
    return (
        <group>
            {[...Array(8)].map((_, i) => {
                const angle = (i / 8) * Math.PI * 2;
                const dist = 80 + Math.random() * 20;
                const x = Math.cos(angle) * dist;
                const z = Math.sin(angle) * dist;
                const scale = 10 + Math.random() * 20;
                return (
                    <mesh key={i} position={[x, scale/2 - 5, z]}>
                        <coneGeometry args={[scale, scale * 1.5, 5]} />
                        <meshStandardMaterial color="#455A64" />
                    </mesh>
                )
            })}
        </group>
    )
});
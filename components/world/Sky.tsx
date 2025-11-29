import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const CloudLayer = React.memo(() => {
    return (
        <group position={[0, 25, 0]}>
            {[...Array(8)].map((_, i) => ( // Reduced clouds
                <Cloud key={i} position={[(Math.random()-0.5)*100, (Math.random()-0.5)*5, (Math.random()-0.5)*100]} speed={0.05 + Math.random()*0.1} />
            ))}
        </group>
    )
});

export const Cloud: React.FC<{ position: [number, number, number], speed: number }> = ({ position, speed }) => {
    const ref = useRef<THREE.Group>(null);
    useFrame(({ clock }) => {
        if(ref.current) {
            ref.current.position.x += speed;
            if(ref.current.position.x > 100) ref.current.position.x = -100;
        }
    });
    return (
        <group ref={ref} position={position}>
             <mesh>
                 <sphereGeometry args={[3, 16, 16]} />
                 <meshStandardMaterial color="white" opacity={0.8} transparent />
             </mesh>
             <mesh position={[2, -0.5, 1]}>
                 <sphereGeometry args={[2, 16, 16]} />
                 <meshStandardMaterial color="white" opacity={0.8} transparent />
             </mesh>
             <mesh position={[-2, -0.5, 1]}>
                 <sphereGeometry args={[2.5, 16, 16]} />
                 <meshStandardMaterial color="white" opacity={0.8} transparent />
             </mesh>
        </group>
    )
}
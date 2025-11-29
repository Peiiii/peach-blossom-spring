import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Instance, Instances } from '@react-three/drei';

export const GalaxyWaterfall = () => {
    const textureRef = useRef<THREE.Texture>(null);
    
    const waterfallCurve = useMemo(() => {
        const points = [];
        points.push(new THREE.Vector3(-40, 120, -40));
        points.push(new THREE.Vector3(-35, 100, -35));
        points.push(new THREE.Vector3(-30, 60, -30));
        points.push(new THREE.Vector3(-25, 20, -25));
        points.push(new THREE.Vector3(-20, 0, -20)); 
        return new THREE.CatmullRomCurve3(points);
    }, []);

    const geometry = useMemo(() => new THREE.TubeGeometry(waterfallCurve, 64, 3, 8, false), [waterfallCurve]);
    
    useFrame(({ clock }) => {
        if (textureRef.current) {
            textureRef.current.offset.y -= 0.02;
        }
    });

    const flowTexture = useMemo(() => {
        const canvas = (window as any).document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, 64, 64);
            ctx.fillStyle = '#FFFFFF';
            for(let i=0; i<100; i++) {
                ctx.fillRect(Math.random()*64, Math.random()*64, 2, 2);
            }
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(5, 20);
        return tex;
    }, []);

    return (
        <group>
            <mesh geometry={geometry} position={[0, 0, 0]}>
                 <meshPhysicalMaterial 
                    map={flowTexture}
                    color="#4FC3F7"
                    emissive="#29B6F6"
                    emissiveIntensity={2}
                    transmission={0.6}
                    opacity={0.9}
                    transparent
                    roughness={0}
                    metalness={0.1}
                    side={THREE.DoubleSide}
                 />
            </mesh>

            <mesh position={[-20, 0.1, -20]} rotation={[-Math.PI/2, 0, 0]}>
                <circleGeometry args={[10, 32]} />
                <meshStandardMaterial 
                    color="#81D4FA" 
                    emissive="#4FC3F7" 
                    emissiveIntensity={0.5}
                    transparent 
                    opacity={0.8} 
                />
            </mesh>

            {/* Optimized: Use Instances correctly with Instance component */}
            <Instances range={30}>
                <boxGeometry args={[0.4, 0.4, 0.4]} />
                <meshStandardMaterial color="white" emissive="white" emissiveIntensity={3} />
                {[...Array(30)].map((_, i) => (
                    <FallingStarInstance key={i} curve={waterfallCurve} offset={i * 0.03} />
                ))}
            </Instances>
        </group>
    );
};

const FallingStarInstance: React.FC<{ curve: THREE.CatmullRomCurve3, offset: number }> = ({ curve, offset }) => {
    const ref = useRef<any>(null);
    const speed = 0.1 + Math.random() * 0.1;
    const posRef = useRef(Math.random());
    const spread = 3; 

    useFrame((state, delta) => {
        if (!ref.current) return;
        
        posRef.current += speed * delta;
        if (posRef.current > 1) posRef.current = 0;

        const point = curve.getPointAt(posRef.current);
        const jitterX = Math.sin(state.clock.elapsedTime * 5 + offset * 100) * spread * 0.5;
        const jitterZ = Math.cos(state.clock.elapsedTime * 3 + offset * 100) * spread * 0.5;
        
        ref.current.position.set(point.x + jitterX, point.y, point.z + jitterZ);
        
        // Visual rotation
        ref.current.rotation.x += delta * 2;
        ref.current.rotation.y += delta * 2;
        
        const s = 1 - Math.pow(posRef.current, 4); 
        ref.current.scale.setScalar(s);
    });

    return <Instance ref={ref} />;
}
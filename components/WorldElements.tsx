import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlane } from '@react-three/cannon';
import { COLORS, BLOCK_SCALE } from '../constants';
import { Instance, Instances } from '@react-three/drei';

const generateCurve = (scale: number, seed: number) => {
    const points = [];
    for (let i = 0; i <= 10; i++) {
        const x = (i - 5) * 20;
        const z = Math.sin(i * 0.8 + seed) * 20 + Math.cos(i * 0.3) * 10;
        points.push(new THREE.Vector3(x, 0, z));
    }
    return new THREE.CatmullRomCurve3(points);
};

export const OrganicEnvironment = () => {
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
            <mesh geometry={riverGeo} position={[0, -0.5, 0]} receiveShadow>
                <meshStandardMaterial color={COLORS.WATER} roughness={0.1} metalness={0.1} opacity={0.9} transparent />
            </mesh>
            <mesh geometry={roadGeo} position={[0, 0.02, 0]} receiveShadow>
                <meshStandardMaterial color={COLORS.DIRT} roughness={1} />
            </mesh>
            <DistantMountains />
            <VegetationLayer count={150} minRange={20} maxRange={90} />
            <FarmFields />
        </group>
    );
};

const GalaxyWaterfall = () => {
    const textureRef = useRef<THREE.Texture>(null);
    
    // Generate a tall curve from sky to ground
    const waterfallCurve = useMemo(() => {
        const points = [];
        // Start high in the sky (The Nine Heavens)
        points.push(new THREE.Vector3(-40, 120, -40));
        points.push(new THREE.Vector3(-35, 100, -35));
        points.push(new THREE.Vector3(-30, 60, -30));
        points.push(new THREE.Vector3(-25, 20, -25));
        points.push(new THREE.Vector3(-20, 0, -20)); // Crash into ground
        return new THREE.CatmullRomCurve3(points);
    }, []);

    const geometry = useMemo(() => new THREE.TubeGeometry(waterfallCurve, 64, 3, 8, false), [waterfallCurve]);
    
    useFrame(({ clock }) => {
        // Animate texture to look like flowing water
        if (textureRef.current) {
            textureRef.current.offset.y -= 0.02;
        }
    });

    // Create a simple noise texture for the flow
    const flowTexture = useMemo(() => {
        const canvas = document.createElement('canvas');
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
            {/* The Waterfall Tube */}
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

            {/* Splash Pool at the bottom */}
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

            {/* Falling Stars / Mist Particles */}
            <Instances range={100}>
                <boxGeometry args={[0.4, 0.4, 0.4]} />
                <meshStandardMaterial color="white" emissive="white" emissiveIntensity={3} />
                {[...Array(100)].map((_, i) => (
                    <FallingStar key={i} curve={waterfallCurve} offset={i * 0.01} />
                ))}
            </Instances>
        </group>
    );
};

const FallingStar: React.FC<{ curve: THREE.CatmullRomCurve3, offset: number }> = ({ curve, offset }) => {
    const ref = useRef<THREE.Group>(null);
    const speed = 0.1 + Math.random() * 0.1;
    const posRef = useRef(Math.random()); // position along curve (0-1)
    const spread = 4; // How wide the river is

    useFrame((state, delta) => {
        if (!ref.current) return;
        
        posRef.current += speed * delta;
        if (posRef.current > 1) posRef.current = 0;

        const point = curve.getPointAt(posRef.current);
        // Add some random jitter perpendicular to flow could be complex, so simplified random offset in world space relative to point
        // For a tube, this simple jitter works visually enough
        const jitterX = Math.sin(state.clock.elapsedTime * 5 + offset * 100) * spread * 0.5;
        const jitterZ = Math.cos(state.clock.elapsedTime * 3 + offset * 100) * spread * 0.5;
        
        ref.current.position.set(point.x + jitterX, point.y, point.z + jitterZ);
        ref.current.rotation.x += delta * 2;
        ref.current.rotation.y += delta * 2;
        
        // Scale based on height (dissolve at bottom)
        const s = 1 - Math.pow(posRef.current, 4); 
        ref.current.scale.setScalar(s);
    });

    return <group ref={ref} />;
}

const PhysicsGround = () => {
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

const DistantMountains = () => {
    return (
        <group>
            {[...Array(12)].map((_, i) => {
                const angle = (i / 12) * Math.PI * 2;
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
}

const FarmFields = () => {
    return (
        <group position={[30, 0.1, -20]}>
            <mesh rotation={[-Math.PI/2, 0, 0]} receiveShadow>
                <planeGeometry args={[25, 25]} />
                <meshStandardMaterial color={COLORS.DIRT} />
            </mesh>
            <Instances range={200}>
                <boxGeometry args={[0.2, 0.8, 0.2]} />
                <meshStandardMaterial color={COLORS.CROP_WHEAT} />
                {[...Array(200)].map((_, i) => (
                    <Instance 
                        key={i} 
                        position={[
                            (Math.random() - 0.5) * 24, 
                            0.4, 
                            (Math.random() - 0.5) * 24
                        ]} 
                    />
                ))}
            </Instances>
        </group>
    )
}

const VegetationLayer = ({ count, minRange, maxRange }: { count: number, minRange: number, maxRange: number }) => {
    const trees = useMemo(() => {
        const t = [];
        for(let i=0; i<count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = minRange + Math.random() * (maxRange - minRange);
            t.push({
                pos: [Math.cos(angle) * dist, 0, Math.sin(angle) * dist] as [number, number, number],
                scale: 0.8 + Math.random() * 0.6,
                type: Math.random() > 0.3 ? 'bamboo' : 'peach'
            });
        }
        return t;
    }, [count, minRange, maxRange]);

    return (
        <group>
            {trees.map((tree, i) => (
                tree.type === 'peach' 
                ? <PeachTree key={i} position={tree.pos} scale={tree.scale} />
                : <Bamboo key={i} position={tree.pos} scale={tree.scale} />
            ))}
        </group>
    )
}

const PeachTree: React.FC<{ position: [number, number, number], scale?: number }> = ({ position, scale = 1 }) => {
    return (
        <group position={position} scale={[scale, scale, scale]}>
            <mesh position={[0, 1.5, 0]} castShadow>
                <cylinderGeometry args={[0.2, 0.4, 3, 6]} />
                <meshStandardMaterial color={COLORS.WOOD_DARK} />
            </mesh>
            <mesh position={[0, 3, 0]} castShadow>
                <dodecahedronGeometry args={[1.8]} />
                <meshStandardMaterial color={COLORS.PEACH_LIGHT} />
            </mesh>
            <mesh position={[1, 2.5, 0]} castShadow>
                <dodecahedronGeometry args={[1.2]} />
                <meshStandardMaterial color={COLORS.PEACH_DARK} />
            </mesh>
             <mesh position={[-0.8, 3.5, 0.5]} castShadow>
                <dodecahedronGeometry args={[1]} />
                <meshStandardMaterial color={COLORS.PEACH_LIGHT} />
            </mesh>
        </group>
    )
}

const Bamboo: React.FC<{ position: [number, number, number], scale?: number }> = ({ position, scale = 1 }) => {
    return (
        <group position={position} scale={[scale, scale * 1.5, scale]}>
             {[...Array(3)].map((_, i) => (
                 <group key={i} position={[(i-1)*0.5, 0, (Math.random()-0.5)*0.5]}>
                    <mesh position={[0, 2, 0]} castShadow>
                        <cylinderGeometry args={[0.1, 0.15, 4, 5]} />
                        <meshStandardMaterial color={COLORS.LEAVES_DARK} />
                    </mesh>
                 </group>
             ))}
        </group>
    )
}

export const PopulationSystem = () => {
    const villagers = useMemo(() => {
        return [...Array(50)].map((_, i) => ({
            id: i,
            startPos: [
                (Math.random() - 0.5) * 60,
                0,
                (Math.random() - 0.5) * 60
            ] as [number, number, number],
            role: i < 10 ? 'mahjong' : i < 25 ? 'farmer' : 'walker',
            skin: Math.random() > 0.5 ? COLORS.CLOTH_BLUE : COLORS.CLOTH_GREY
        }));
    }, []);

    return (
        <group>
            <MahjongTable position={[5, 0, 8]} />
            <MahjongTable position={[8, 0, 12]} />
            
            {villagers.map(v => {
                if (v.role === 'mahjong') return null; 
                return (
                    <Villager 
                        key={v.id} 
                        position={v.startPos} 
                        color={v.skin}
                        role={v.role as any}
                    />
                );
            })}
        </group>
    );
};

export const Villager: React.FC<{ position: [number, number, number], color: string, role: 'walker'|'farmer' }> = ({ position, color, role }) => {
    const ref = useRef<THREE.Group>(null);
    const [seed] = useState(Math.random() * 1000);
    
    useFrame(({ clock }) => {
        if (!ref.current) return;
        const t = clock.getElapsedTime() + seed;
        
        if (role === 'walker') {
            const x = position[0] + Math.sin(t * 0.2) * 15;
            const z = position[2] + Math.cos(t * 0.15) * 15;
            const nextX = position[0] + Math.sin((t + 0.1) * 0.2) * 15;
            const nextZ = position[2] + Math.cos((t + 0.1) * 0.15) * 15;
            ref.current.lookAt(nextX, 0, nextZ);
            ref.current.position.x = x;
            ref.current.position.z = z;
            ref.current.position.y = Math.abs(Math.sin(t * 5)) * 0.1; 
        } else if (role === 'farmer') {
            ref.current.position.x = position[0];
            ref.current.position.z = position[2];
            ref.current.rotation.z = Math.abs(Math.sin(t * 2)) * 0.5; 
        }
    });

    return (
        <group ref={ref}>
             <mesh position={[0, 1.5, 0]} castShadow>
                <boxGeometry args={[0.25, 0.25, 0.25]} />
                <meshStandardMaterial color={COLORS.SKIN} />
            </mesh>
            <mesh position={[0, 0.9, 0]} castShadow>
                <boxGeometry args={[0.35, 0.9, 0.2]} />
                <meshStandardMaterial color={color} />
            </mesh>
            <mesh position={[-0.1, 0.3, 0]} castShadow><boxGeometry args={[0.12, 0.6, 0.12]} /><meshStandardMaterial color="#333" /></mesh>
            <mesh position={[0.1, 0.3, 0]} castShadow><boxGeometry args={[0.12, 0.6, 0.12]} /><meshStandardMaterial color="#333" /></mesh>
        </group>
    );
}

export const MahjongTable = ({ position }: { position: [number, number, number] }) => {
    return (
        <group position={position}>
            <mesh position={[0, 0.4, 0]} castShadow>
                <boxGeometry args={[1.5, 0.8, 1.5]} />
                <meshStandardMaterial color="#4CAF50" />
            </mesh>
            {[0, 1, 2, 3].map(i => {
                const angle = (i / 4) * Math.PI * 2;
                return (
                    <group key={i} position={[Math.cos(angle)*1.2, 0, Math.sin(angle)*1.2]} rotation={[0, -angle + Math.PI/2, 0]}>
                        <mesh position={[0, 0.2, 0]}>
                            <cylinderGeometry args={[0.3, 0.3, 0.4]} />
                            <meshStandardMaterial color={COLORS.WOOD_DARK} />
                        </mesh>
                        <Villager position={[0,0.2,0]} color={i % 2 === 0 ? COLORS.CLOTH_RED : COLORS.CLOTH_BLUE} role="farmer" /> 
                    </group>
                )
            })}
        </group>
    )
}

export const CloudLayer = () => {
    return (
        <group position={[0, 25, 0]}>
            {[...Array(15)].map((_, i) => (
                <Cloud key={i} position={[(Math.random()-0.5)*100, (Math.random()-0.5)*5, (Math.random()-0.5)*100]} speed={0.05 + Math.random()*0.1} />
            ))}
        </group>
    )
}

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
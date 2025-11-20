
import React, { useRef, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlane } from '@react-three/cannon';
import { COLORS } from '../constants';
import { Instance, Instances } from '@react-three/drei';

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

export const OrganicEnvironment = React.memo(() => {
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
            {/* Reduced count for performance */}
            <VegetationLayer count={60} minRange={20} maxRange={90} />
            <FarmFields />
        </group>
    );
});

const GalaxyWaterfall = () => {
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

// Optimized to use Instance instead of separate meshes
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

const DistantMountains = React.memo(() => {
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

const FarmFields = React.memo(() => {
    return (
        <group position={[30, 0.1, -20]}>
            <mesh rotation={[-Math.PI/2, 0, 0]} receiveShadow>
                <planeGeometry args={[25, 25]} />
                <meshStandardMaterial color={COLORS.DIRT} />
            </mesh>
            <Instances range={100}>
                <boxGeometry args={[0.2, 0.8, 0.2]} />
                <meshStandardMaterial color={COLORS.CROP_WHEAT} />
                {[...Array(100)].map((_, i) => (
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
});

const VegetationLayer = React.memo(({ count, minRange, maxRange }: { count: number, minRange: number, maxRange: number }) => {
    const trees = useMemo(() => {
        const t = [];
        for(let i=0; i<count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = minRange + Math.random() * (maxRange - minRange);
            
            const rand = Math.random();
            let type = 'peach';
            if (rand > 0.90) type = 'bamboo'; 
            else if (rand > 0.75) type = 'pine';
            else if (rand > 0.60) type = 'willow';
            
            t.push({
                pos: [Math.cos(angle) * dist, 0, Math.sin(angle) * dist] as [number, number, number],
                scale: 0.8 + Math.random() * 0.6,
                type: type
            });
        }
        return t;
    }, [count, minRange, maxRange]);

    return (
        <group>
            {trees.map((tree, i) => {
                if (tree.type === 'peach') return <PeachTree key={i} position={tree.pos} scale={tree.scale} />;
                if (tree.type === 'bamboo') return <Bamboo key={i} position={tree.pos} scale={tree.scale} />;
                if (tree.type === 'pine') return <PineTree key={i} position={tree.pos} scale={tree.scale} />;
                if (tree.type === 'willow') return <WillowTree key={i} position={tree.pos} scale={tree.scale} />;
                return null;
            })}
        </group>
    )
});

// ... (Tree components unchanged, assume they are good) ...
const PeachTree: React.FC<{ position: [number, number, number], scale?: number }> = ({ position, scale = 1 }) => {
    const leaves = useMemo(() => {
        const count = 15;  // Reduced count
        return [...Array(count)].map((_, i) => {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            const r = Math.random() * 1.8; 
            
            return {
                pos: [
                    r * Math.sin(phi) * Math.cos(theta), 
                    2.5 + Math.abs(r * Math.cos(phi)) * 0.8, 
                    r * Math.sin(phi) * Math.sin(theta)
                ] as [number, number, number],
                scale: 0.5 + Math.random() * 0.8, 
                rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI] as [number, number, number],
                color: Math.random() > 0.3 ? COLORS.PEACH_LIGHT : (Math.random() > 0.6 ? COLORS.PEACH_DARK : '#FFEBEE')
            };
        });
    }, []);

    return (
        <group position={position} scale={[scale, scale, scale]}>
            <mesh position={[0, 0.8, 0]} rotation={[0.1, 0, 0.1]} castShadow>
                <cylinderGeometry args={[0.25, 0.4, 1.6, 6]} />
                <meshStandardMaterial color={COLORS.WOOD_DARK} />
            </mesh>
            <mesh position={[0.2, 2.0, 0]} rotation={[0, 0, -0.4]} castShadow>
                <cylinderGeometry args={[0.15, 0.25, 1.5, 6]} />
                <meshStandardMaterial color={COLORS.WOOD_DARK} />
            </mesh>
            <mesh position={[-0.2, 1.8, 0.2]} rotation={[0.3, 0, 0.4]} castShadow>
                <cylinderGeometry args={[0.15, 0.22, 1.4, 6]} />
                <meshStandardMaterial color={COLORS.WOOD_DARK} />
            </mesh>
            {leaves.map((leaf, i) => (
                <mesh key={i} position={leaf.pos} rotation={leaf.rotation} scale={[leaf.scale, leaf.scale, leaf.scale]} castShadow>
                    <dodecahedronGeometry args={[0.6]} /> 
                    <meshStandardMaterial color={leaf.color} roughness={0.8} />
                </mesh>
            ))}
        </group>
    )
}

const PineTree: React.FC<{ position: [number, number, number], scale?: number }> = ({ position, scale = 1 }) => {
    return (
        <group position={position} scale={[scale * 1.2, scale * 1.2, scale * 1.2]}>
            <mesh position={[0, 1, 0]} castShadow>
                <cylinderGeometry args={[0.2, 0.3, 2, 6]} />
                <meshStandardMaterial color="#3E2723" />
            </mesh>
            <mesh position={[0, 1.5, 0]} castShadow>
                <coneGeometry args={[2.2, 1.5, 8]} />
                <meshStandardMaterial color={COLORS.LEAVES_DARK} roughness={0.9} />
            </mesh>
            <mesh position={[0, 2.5, 0]} castShadow>
                <coneGeometry args={[1.8, 1.5, 8]} />
                <meshStandardMaterial color={COLORS.LEAVES_DARK} roughness={0.9} />
            </mesh>
            <mesh position={[0, 3.5, 0]} castShadow>
                <coneGeometry args={[1.2, 1.5, 8]} />
                <meshStandardMaterial color={COLORS.LEAVES_DARK} roughness={0.9} />
            </mesh>
        </group>
    )
}

const WillowTree: React.FC<{ position: [number, number, number], scale?: number }> = ({ position, scale = 1 }) => {
    const branches = useMemo(() => {
        return [...Array(8)].map((_, i) => { // Reduced branches
            const angle = (i / 8) * Math.PI * 2 + Math.random();
            const r = 0.8 + Math.random() * 0.5;
            return {
                x: Math.cos(angle) * r,
                z: Math.sin(angle) * r,
                length: 1.5 + Math.random() * 1.5
            }
        });
    }, []);

    return (
        <group position={position} scale={[scale, scale, scale]}>
            <mesh position={[0, 1.5, 0]} castShadow>
                <cylinderGeometry args={[0.3, 0.4, 3, 7]} />
                <meshStandardMaterial color="#5D4037" />
            </mesh>
            <mesh position={[0, 3, 0]} castShadow>
                <sphereGeometry args={[0.9, 8, 8]} />
                <meshStandardMaterial color={COLORS.LEAVES_LIGHT} />
            </mesh>
            {branches.map((b, i) => (
                <group key={i} position={[b.x, 3, b.z]}>
                    <mesh position={[0, -b.length / 2, 0]} rotation={[0, Math.random(), 0]}>
                        <boxGeometry args={[0.1, b.length, 0.1]} />
                        <meshStandardMaterial color={COLORS.LEAVES_LIGHT} />
                    </mesh>
                </group>
            ))}
        </group>
    )
}

const Bamboo: React.FC<{ position: [number, number, number], scale?: number }> = ({ position, scale = 1 }) => {
    const stalks = useMemo(() => {
        const count = 3 + Math.floor(Math.random() * 3); // Reduced stalks
        return [...Array(count)].map((_, i) => {
             const angle = Math.random() * Math.PI * 2;
             const dist = 0.2 + Math.random() * 0.5;
             return {
                 x: Math.cos(angle) * dist,
                 z: Math.sin(angle) * dist,
                 height: 4 + Math.random() * 3,
                 tiltX: (Math.random() - 0.5) * 0.1,
                 tiltZ: (Math.random() - 0.5) * 0.1,
                 color: Math.random() > 0.5 ? COLORS.LEAVES_DARK : '#33691E'
             }
        });
    }, []);

    return (
        <group position={position} scale={[scale, scale, scale]}>
            {stalks.map((stalk, i) => (
                <group key={i} position={[stalk.x, 0, stalk.z]} rotation={[stalk.tiltX, 0, stalk.tiltZ]}>
                    <mesh position={[0, stalk.height/2, 0]} castShadow>
                        <cylinderGeometry args={[0.05, 0.08, stalk.height, 5]} />
                        <meshStandardMaterial color={stalk.color} />
                    </mesh>
                    {[1, 2].map(k => ( // Reduced leaves per stalk
                         <group key={k} position={[0, stalk.height - k * 0.5, 0]} rotation={[0, Math.random() * Math.PI, 0]}>
                            <mesh position={[0.3, 0, 0]} rotation={[0, 0, -0.3]}>
                                <boxGeometry args={[0.6, 0.02, 0.1]} />
                                <meshStandardMaterial color={COLORS.LEAVES_LIGHT} />
                            </mesh>
                        </group>
                    ))}
                </group>
            ))}
        </group>
    )
}

// --- Villager System Redesign ---

interface VillagerConfig {
    robeColor: string;
    pantsColor: string;
    hairStyle: 'bun' | 'long' | 'short' | 'none';
    hatType: 'straw' | 'official' | 'none';
    skinTone: string;
}

const VILLAGER_PALETTES = [
    { robe: COLORS.CLOTH_BLUE, pants: '#1565C0' },
    { robe: COLORS.CLOTH_GREY, pants: '#455A64' },
    { robe: COLORS.CLOTH_RED, pants: '#C62828' },
    { robe: '#5D4037', pants: '#3E2723' }, // Brown peasant
    { robe: '#7B1FA2', pants: '#4A148C' }, // Purple rich
    { robe: '#FBC02D', pants: '#F57F17' }, // Yellow monk-ish
];

export const PopulationSystem = React.memo(() => {
    const villagers = useMemo(() => {
        return [...Array(24)].map((_, i) => { // Reduced count from 60 to 24
            const palette = VILLAGER_PALETTES[Math.floor(Math.random() * VILLAGER_PALETTES.length)];
            
            const config: VillagerConfig = {
                robeColor: palette.robe,
                pantsColor: palette.pants,
                skinTone: COLORS.SKIN,
                hairStyle: Math.random() > 0.8 ? 'none' : (Math.random() > 0.5 ? 'bun' : 'long'),
                hatType: Math.random() > 0.7 ? 'straw' : (Math.random() > 0.95 ? 'official' : 'none'),
            };

            // Override for monks/bald
            if (Math.random() > 0.95) {
                config.hairStyle = 'none';
                config.hatType = 'none';
                config.robeColor = '#EF6C00'; // Orange robe
            }

            return {
                id: i,
                startPos: [
                    (Math.random() - 0.5) * 60,
                    0,
                    (Math.random() - 0.5) * 60
                ] as [number, number, number],
                role: i < 4 ? 'mahjong' : i < 12 ? 'farmer' : 'walker',
                config
            };
        });
    }, []);

    return (
        <group>
            <MahjongTable position={[5, 0, 8]} />
            
            {villagers.map(v => {
                if (v.role === 'mahjong') return null; 
                return (
                    <Villager 
                        key={v.id} 
                        position={v.startPos} 
                        role={v.role as any}
                        config={v.config}
                    />
                );
            })}
        </group>
    );
});

interface VillagerProps {
    position: [number, number, number];
    role: 'walker' | 'farmer' | 'sitting';
    config: VillagerConfig;
    rotation?: number;
}

// New Villager Component with enhanced articulation
export const Villager: React.FC<VillagerProps> = ({ position, role, config, rotation = 0 }) => {
    const groupRef = useRef<THREE.Group>(null);
    const { camera } = useThree(); // To check distance for LOD
    
    // Body parts refs
    const hipsRef = useRef<THREE.Group>(null);
    const torsoRef = useRef<THREE.Group>(null); // Pivots at hips
    const headRef = useRef<THREE.Group>(null); // Pivots at neck
    const leftArmRef = useRef<THREE.Group>(null);
    const rightArmRef = useRef<THREE.Group>(null);
    const leftLegRef = useRef<THREE.Group>(null);
    const rightLegRef = useRef<THREE.Group>(null);
    
    const [seed] = useState(Math.random() * 1000);
    const [scale] = useState(0.9 + Math.random() * 0.2); 

    // Seat height for sitting (stool is 0.4 high)
    const SEAT_HEIGHT = 0.4;
    
    useFrame(({ clock }) => {
        if (!groupRef.current) return;

        // LOD Check: If far away, don't animate limbs
        if (camera.position.distanceTo(groupRef.current.position) > 35) {
             return; 
        }

        const t = clock.getElapsedTime() + seed;
        const delta = clock.getDelta();
        
        // --- Global Position / Role Logic ---
        if (role === 'walker') {
            // Simple patrol
            const r = 15;
            const x = position[0] + Math.sin(t * 0.15) * r;
            const z = position[2] + Math.cos(t * 0.1) * r;
            const nextX = position[0] + Math.sin((t + 0.1) * 0.15) * r;
            const nextZ = position[2] + Math.cos((t + 0.1) * 0.1) * r;
            
            groupRef.current.position.set(x, 0, z);
            groupRef.current.lookAt(nextX, 0, nextZ);
            
        } else if (role === 'farmer') {
            // Static position, but animated body
            groupRef.current.position.set(position[0], 0, position[2]);
            groupRef.current.rotation.y = rotation;

        } else if (role === 'sitting') {
            groupRef.current.position.set(position[0], 0, position[2]); 
            groupRef.current.rotation.y = rotation;
        }

        // --- Articulation Logic ---
        
        // Default Pose Reset
        if (torsoRef.current) torsoRef.current.rotation.set(0, 0, 0);
        if (leftArmRef.current) leftArmRef.current.rotation.set(0, 0, 0);
        if (rightArmRef.current) rightArmRef.current.rotation.set(0, 0, 0);
        if (leftLegRef.current) leftLegRef.current.rotation.set(0, 0, 0);
        if (rightLegRef.current) rightLegRef.current.rotation.set(0, 0, 0);
        if (hipsRef.current) hipsRef.current.position.y = 0.6; // Standard hip height

        if (role === 'walker') {
            const speed = 8;
            const limbT = t * speed;
            
            if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(limbT) * 0.6;
            if (rightLegRef.current) rightLegRef.current.rotation.x = Math.sin(limbT + Math.PI) * 0.6;
            
            if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(limbT + Math.PI) * 0.6;
            if (rightArmRef.current) rightArmRef.current.rotation.x = Math.sin(limbT) * 0.6;
            
            // Bobbing
            if (hipsRef.current) hipsRef.current.position.y = 0.6 + Math.abs(Math.sin(limbT)) * 0.05;

        } else if (role === 'farmer') {
            const workSpeed = t * 2.5;
            const bend = 0.6 + Math.sin(workSpeed) * 0.1; // Bend forward 30-40 degrees
            
            // 1. Bend Torso Forward
            if (torsoRef.current) torsoRef.current.rotation.x = bend;
            
            // 2. Arms reach down to ground
            if (rightArmRef.current) {
                // Reach down
                rightArmRef.current.rotation.x = -2.0 + Math.sin(workSpeed) * 0.3; 
                // Hoeing motion
                rightArmRef.current.rotation.z = -0.2;
            }
            if (leftArmRef.current) {
                 leftArmRef.current.rotation.x = -1.8 + Math.sin(workSpeed + 0.5) * 0.3;
            }
            
            // 3. Legs stay planted
            if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
            if (rightLegRef.current) rightLegRef.current.rotation.x = 0;

            // 4. Look at crop
            if (headRef.current) headRef.current.rotation.x = -0.5;

        } else if (role === 'sitting') {
            // Sit Down
            if (hipsRef.current) hipsRef.current.position.y = SEAT_HEIGHT;
            
            // Thighs horizontal
            if (leftLegRef.current) {
                leftLegRef.current.rotation.x = -Math.PI / 2; 
                leftLegRef.current.position.z = 0.1; // slight adjustment forward
            }
            if (rightLegRef.current) {
                rightLegRef.current.rotation.x = -Math.PI / 2;
                rightLegRef.current.position.z = 0.1;
            }
            
            // Arms resting on table (Table height ~0.8, Shoulders at ~0.9)
            // Reach forward and slightly down
            if (rightArmRef.current) {
                 // Shuffle motion
                 const shuffle = Math.sin(t * 10) * 0.1;
                 rightArmRef.current.rotation.x = -1.2 + shuffle; 
                 rightArmRef.current.rotation.z = -0.3;
            }
            if (leftArmRef.current) {
                 const shuffle = Math.cos(t * 8) * 0.1;
                 leftArmRef.current.rotation.x = -1.2 + shuffle;
                 leftArmRef.current.rotation.z = 0.3;
            }
            
            // Look at tiles
            if (headRef.current) {
                headRef.current.rotation.x = 0.4;
                headRef.current.rotation.y = Math.sin(t * 0.5) * 0.2; // Scanning
            }
        }
    });

    return (
        <group ref={groupRef} scale={[scale, scale, scale]}>
            {/* HIPS (ROOT OF ARTICULATION) */}
            <group ref={hipsRef} position={[0, 0.6, 0]}> 
                
                {/* LEGS - Pivot at Hips (0,0,0 relative to hips) */}
                <group ref={leftLegRef} position={[-0.12, 0, 0]}>
                    {/* Leg geometry extends DOWN from pivot */}
                    <mesh position={[0, -0.3, 0]} castShadow> 
                        <boxGeometry args={[0.15, 0.6, 0.15]} />
                        <meshStandardMaterial color={config.pantsColor} />
                    </mesh>
                </group>
                <group ref={rightLegRef} position={[0.12, 0, 0]}>
                    <mesh position={[0, -0.3, 0]} castShadow>
                        <boxGeometry args={[0.15, 0.6, 0.15]} />
                        <meshStandardMaterial color={config.pantsColor} />
                    </mesh>
                </group>

                {/* TORSO - Pivot at Hips */}
                <group ref={torsoRef} position={[0, 0, 0]}>
                    {/* Torso Geometry extends UP from pivot */}
                    <mesh position={[0, 0.3, 0]} castShadow>
                        <boxGeometry args={[0.35, 0.6, 0.2]} />
                        <meshStandardMaterial color={config.robeColor} />
                    </mesh>
                    
                    {/* Skirt Flap (Lower Robe) */}
                    <mesh position={[0, -0.1, 0]} castShadow>
                         <boxGeometry args={[0.38, 0.3, 0.22]} />
                         <meshStandardMaterial color={config.robeColor} />
                    </mesh>

                    {/* ARMS - Pivot at Shoulders (Approx y=0.5 relative to hips) */}
                    <group ref={leftArmRef} position={[-0.25, 0.5, 0]}>
                        <mesh position={[0, -0.25, 0]} castShadow>
                            <boxGeometry args={[0.1, 0.5, 0.1]} />
                            <meshStandardMaterial color={config.robeColor} />
                        </mesh>
                        <mesh position={[0, -0.5, 0]}>
                            <boxGeometry args={[0.08, 0.08, 0.08]} />
                            <meshStandardMaterial color={config.skinTone} />
                        </mesh>
                    </group>

                    <group ref={rightArmRef} position={[0.25, 0.5, 0]}>
                        <mesh position={[0, -0.25, 0]} castShadow>
                            <boxGeometry args={[0.1, 0.5, 0.1]} />
                            <meshStandardMaterial color={config.robeColor} />
                        </mesh>
                        <mesh position={[0, -0.5, 0]}>
                            <boxGeometry args={[0.08, 0.08, 0.08]} />
                            <meshStandardMaterial color={config.skinTone} />
                        </mesh>
                        {/* Tool for farmers */}
                        {role === 'farmer' && (
                             <group position={[0, -0.5, 0.1]} rotation={[0,0,-0.5]}>
                                 <mesh position={[0, -0.3, 0]}>
                                     <cylinderGeometry args={[0.02, 0.02, 0.8]} />
                                     <meshStandardMaterial color={COLORS.WOOD_LIGHT} />
                                 </mesh>
                                 <mesh position={[0, -0.7, 0.05]} rotation={[Math.PI/4, 0, 0]}>
                                      <boxGeometry args={[0.1, 0.02, 0.2]} />
                                      <meshStandardMaterial color="#555" />
                                 </mesh>
                             </group>
                        )}
                    </group>

                    {/* HEAD - Pivot at Neck (Approx y=0.6 relative to hips) */}
                    <group ref={headRef} position={[0, 0.6, 0]}>
                        {/* Neck */}
                        <mesh position={[0, 0.05, 0]}>
                            <cylinderGeometry args={[0.08, 0.08, 0.1]} />
                            <meshStandardMaterial color={config.skinTone} />
                        </mesh>
                        
                        {/* Face/Head Box */}
                        <mesh position={[0, 0.2, 0]} castShadow>
                            <boxGeometry args={[0.25, 0.25, 0.25]} />
                            <meshStandardMaterial color={config.skinTone} />
                        </mesh>

                        {/* EYES - The Face Fix! */}
                        <group position={[0, 0.2, 0.13]}>
                            {/* Left Eye */}
                            <mesh position={[-0.06, 0.02, 0]}>
                                <planeGeometry args={[0.03, 0.03]} />
                                <meshBasicMaterial color="black" />
                            </mesh>
                            {/* Right Eye */}
                            <mesh position={[0.06, 0.02, 0]}>
                                <planeGeometry args={[0.03, 0.03]} />
                                <meshBasicMaterial color="black" />
                            </mesh>
                        </group>

                        {/* Hair */}
                        {config.hairStyle === 'bun' && (
                            <mesh position={[0, 0.35, -0.05]}>
                                <boxGeometry args={[0.12, 0.12, 0.1]} />
                                <meshStandardMaterial color="#111" />
                            </mesh>
                        )}
                        {(config.hairStyle === 'bun' || config.hairStyle === 'long' || config.hairStyle === 'short') && (
                            <mesh position={[0, 0.22, -0.05]}>
                                <boxGeometry args={[0.27, 0.27, 0.2]} />
                                <meshStandardMaterial color="#111" />
                            </mesh>
                        )}

                        {/* Hat */}
                        {config.hatType === 'straw' && (
                            <mesh position={[0, 0.35, 0]} rotation={[0,0,0]}>
                                <coneGeometry args={[0.4, 0.15, 16]} />
                                <meshStandardMaterial color="#E6C680" />
                            </mesh>
                        )}
                        {config.hatType === 'official' && (
                            <group position={[0, 0.35, 0]}>
                                <mesh>
                                    <boxGeometry args={[0.3, 0.1, 0.3]} />
                                    <meshStandardMaterial color="#111" />
                                </mesh>
                                <mesh position={[0,0.1,0]}>
                                    <boxGeometry args={[0.15, 0.1, 0.15]} />
                                    <meshStandardMaterial color="#111" />
                                </mesh>
                            </group>
                        )}
                    </group>

                </group>
            </group>
        </group>
    );
}

export const MahjongTable = ({ position }: { position: [number, number, number] }) => {
    return (
        <group position={position}>
            {/* Table Top - Surface at y=0.8 */}
            <mesh position={[0, 0.4, 0]} castShadow>
                <boxGeometry args={[1.5, 0.8, 1.5]} />
                <meshStandardMaterial color="#4CAF50" />
            </mesh>
            
            {/* Legs */}
            <mesh position={[0.6, 0.2, 0.6]}><boxGeometry args={[0.1, 0.4, 0.1]} /><meshStandardMaterial color={COLORS.WOOD_DARK} /></mesh>
            <mesh position={[-0.6, 0.2, 0.6]}><boxGeometry args={[0.1, 0.4, 0.1]} /><meshStandardMaterial color={COLORS.WOOD_DARK} /></mesh>
            <mesh position={[0.6, 0.2, -0.6]}><boxGeometry args={[0.1, 0.4, 0.1]} /><meshStandardMaterial color={COLORS.WOOD_DARK} /></mesh>
            <mesh position={[-0.6, 0.2, -0.6]}><boxGeometry args={[0.1, 0.4, 0.1]} /><meshStandardMaterial color={COLORS.WOOD_DARK} /></mesh>

            {/* Tiles Scatter */}
            {[...Array(10)].map((_, i) => (
                 <mesh key={i} position={[(Math.random()-0.5)*1.0, 0.82, (Math.random()-0.5)*1.0]} rotation={[0, Math.random(), 0]}>
                    <boxGeometry args={[0.08, 0.04, 0.1]} />
                    <meshStandardMaterial color="#EEE" />
                 </mesh>
            ))}

            {[0, 1, 2, 3].map(i => {
                const angle = (i / 4) * Math.PI * 2;
                const x = Math.cos(angle) * 1.1;
                const z = Math.sin(angle) * 1.1;

                // Explicit rotations for 4-way seating to ensure inward facing
                // 0: Right (East) -> Faces Left (-X) -> -PI/2
                // 1: Bottom (South) -> Faces Up (-Z) -> PI
                // 2: Left (West) -> Faces Right (+X) -> PI/2
                // 3: Top (North) -> Faces Down (+Z) -> 0
                const rotations = [-Math.PI/2, Math.PI, Math.PI/2, 0];

                // Generate deterministic config
                const config: VillagerConfig = {
                     robeColor: i % 2 === 0 ? COLORS.CLOTH_BLUE : '#5D4037',
                     pantsColor: '#333',
                     skinTone: COLORS.SKIN,
                     hairStyle: i === 0 ? 'bun' : 'short',
                     hatType: i === 2 ? 'straw' : 'none'
                };

                return (
                    <group key={i} position={[x, 0, z]} rotation={[0, rotations[i], 0]}>
                        {/* Stool - Top at 0.4 */}
                        <mesh position={[0, 0.2, 0]}>
                            <cylinderGeometry args={[0.25, 0.25, 0.4]} />
                            <meshStandardMaterial color={COLORS.WOOD_DARK} />
                        </mesh>
                        
                        <Villager 
                            position={[0,0,0]} 
                            role="sitting"
                            config={config}
                            rotation={0}
                        /> 
                    </group>
                )
            })}
        </group>
    )
}

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

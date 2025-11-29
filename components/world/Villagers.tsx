

import React, { useRef, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS, getRiverPath, RIVER_WIDTH, BRIDGE_Z_OFFSET, BRIDGE_WIDTH, BRIDGE_LENGTH } from '../../constants';

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
        return [...Array(24)].map((_, i) => { 
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

            // Ensure spawn is safe
            let spawnX = (Math.random() - 0.5) * 60;
            let spawnZ = (Math.random() - 0.5) * 60;
            // Simple spawn safety check - if in river, push to bank
            const rZ = getRiverPath(spawnX);
            if (Math.abs(spawnZ - rZ) < RIVER_WIDTH + 2) {
                spawnZ = rZ + RIVER_WIDTH + 3;
            }

            return {
                id: i,
                startPos: [spawnX, 0, spawnZ] as [number, number, number],
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
export const Villager: React.FC<VillagerProps> = ({ position: initialPos, role, config, rotation = 0 }) => {
    const groupRef = useRef<THREE.Group>(null);
    const { camera } = useThree(); // To check distance for LOD
    
    // State for autonomous movement
    const pos = useRef(new THREE.Vector3(initialPos[0], initialPos[1], initialPos[2]));
    const dir = useRef(new THREE.Vector3(Math.random()-0.5, 0, Math.random()-0.5).normalize());
    const velocityY = useRef(0);
    
    // Body parts refs
    const hipsRef = useRef<THREE.Group>(null);
    const torsoRef = useRef<THREE.Group>(null); 
    const headRef = useRef<THREE.Group>(null); 
    const leftArmRef = useRef<THREE.Group>(null);
    const rightArmRef = useRef<THREE.Group>(null);
    const leftLegRef = useRef<THREE.Group>(null);
    const rightLegRef = useRef<THREE.Group>(null);
    
    const [seed] = useState(Math.random() * 1000);
    const [scale] = useState(0.9 + Math.random() * 0.2); 

    // Seat height for sitting (stool is 0.4 high)
    const SEAT_HEIGHT = 0.4;
    
    useFrame(({ clock }, delta) => {
        if (!groupRef.current) return;

        // LOD Check
        if (camera.position.distanceTo(groupRef.current.position) > 40) return;

        const t = clock.getElapsedTime() + seed;
        
        // --- Physics & AI Logic ---
        let groundHeight = 0;
        const currentPos = pos.current;
        const riverZ = getRiverPath(currentPos.x);
        
        // 1. Calculate Ground Height
        const inRiver = Math.abs(currentPos.z - riverZ) < RIVER_WIDTH / 2;
        const onBridge = Math.abs(currentPos.x) < BRIDGE_WIDTH/2 && Math.abs(currentPos.z - BRIDGE_Z_OFFSET) < BRIDGE_LENGTH/2;

        if (inRiver && !onBridge) {
            groundHeight = -1.8; // Fall into water
        } else if (onBridge) {
            groundHeight = 0.2;
        } else {
            groundHeight = 0;
        }

        // 2. Walker Movement
        if (role === 'walker') {
            const speed = 2.0;
            const nextPos = currentPos.clone().add(dir.current.clone().multiplyScalar(speed * delta));
            
            // Check boundary for next step
            const nextRiverZ = getRiverPath(nextPos.x);
            const willBeInRiver = Math.abs(nextPos.z - nextRiverZ) < RIVER_WIDTH / 2;
            const willBeOnBridge = Math.abs(nextPos.x) < BRIDGE_WIDTH/2 && Math.abs(nextPos.z - BRIDGE_Z_OFFSET) < BRIDGE_LENGTH/2;

            // Simple avoidance: If next step is water, turn around
            if (willBeInRiver && !willBeOnBridge && groundHeight >= 0) {
                 // Reflect
                 dir.current.negate();
                 // Add some randomness so they don't get stuck in loops
                 dir.current.x += (Math.random() - 0.5); 
                 dir.current.normalize();
            } else {
                 currentPos.x = nextPos.x;
                 currentPos.z = nextPos.z;
            }

            // Also keep within world bounds
            if (Math.abs(currentPos.x) > 55 || Math.abs(currentPos.z) > 55) dir.current.negate();

            // Look direction
            const lookTarget = currentPos.clone().add(dir.current);
            groupRef.current.lookAt(lookTarget.x, groupRef.current.position.y, lookTarget.z);
        } else {
            // Static rotation for others
             groupRef.current.rotation.y = rotation;
        }

        // 3. Gravity Application
        if (currentPos.y > groundHeight) {
             velocityY.current -= 9.8 * delta;
             currentPos.y += velocityY.current * delta;
             // Floor Snap
             if (currentPos.y < groundHeight) {
                 currentPos.y = groundHeight;
                 velocityY.current = 0;
             }
        } else if (currentPos.y < groundHeight) {
            // Snap up if we walked onto a higher platform (like bridge ramp)
             currentPos.y = groundHeight;
             velocityY.current = 0;
        }
        
        // Apply position
        groupRef.current.position.set(currentPos.x, currentPos.y, currentPos.z);


        // --- Visual Articulation Logic ---
        
        // Default Pose Reset
        if (torsoRef.current) torsoRef.current.rotation.set(0, 0, 0);
        if (leftArmRef.current) leftArmRef.current.rotation.set(0, 0, 0);
        if (rightArmRef.current) rightArmRef.current.rotation.set(0, 0, 0);
        if (leftLegRef.current) leftLegRef.current.rotation.set(0, 0, 0);
        if (rightLegRef.current) rightLegRef.current.rotation.set(0, 0, 0);
        if (hipsRef.current) hipsRef.current.position.y = 0.6; // Standard hip height

        // If falling/in water, flail arms
        const isFalling = currentPos.y < -0.5;
        if (isFalling) {
            if (leftArmRef.current) leftArmRef.current.rotation.z = Math.PI - 0.5 + Math.sin(t*20)*0.5;
            if (rightArmRef.current) rightArmRef.current.rotation.z = -Math.PI + 0.5 - Math.sin(t*20)*0.5;
        }

        if (role === 'walker' && !isFalling) {
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
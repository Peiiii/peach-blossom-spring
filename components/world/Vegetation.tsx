import React, { useMemo } from 'react';
import { Instance, Instances } from '@react-three/drei';
import { COLORS } from '../../constants';

export const FarmFields = React.memo(() => {
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

export const VegetationLayer = React.memo(({ count, minRange, maxRange }: { count: number, minRange: number, maxRange: number }) => {
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
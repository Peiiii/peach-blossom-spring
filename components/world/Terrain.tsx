
import React, { useMemo } from 'react';
import { usePlane, useBox } from '@react-three/cannon';
import { COLORS, getRiverPath, RIVER_WIDTH, BRIDGE_Z_OFFSET } from '../../constants';

// Generates physics boxes for the ground, leaving a gap for the river
export const PhysicsGround = () => {
    // We create "strips" of ground along the X axis.
    // For each segment of X, we calculate the river's Z position.
    // We place a box from -Infinity to (RiverZ - Width/2)
    // And another from (RiverZ + Width/2) to +Infinity
    
    const STRIP_WIDTH = 2; // Size of each physics slice along X
    const WORLD_SIZE = 120; // How far out we generate

    const strips = useMemo(() => {
        const items = [];
        for (let x = -WORLD_SIZE/2; x < WORLD_SIZE/2; x += STRIP_WIDTH) {
            const riverZ = getRiverPath(x + STRIP_WIDTH/2); // Sample center of strip
            
            const bankLeftZ = -WORLD_SIZE; // Far left edge
            const bankRightZ = WORLD_SIZE; // Far right edge

            // Left Bank Box
            // Center Z is halfway between far edge and river edge
            // Width is distance between them
            const riverLeftEdge = riverZ - RIVER_WIDTH / 2;
            const riverRightEdge = riverZ + RIVER_WIDTH / 2;

            const leftBoxWidth = Math.abs(riverLeftEdge - (-WORLD_SIZE));
            const leftBoxZ = (-WORLD_SIZE + riverLeftEdge) / 2;

            const rightBoxWidth = Math.abs(WORLD_SIZE - riverRightEdge);
            const rightBoxZ = (riverRightEdge + WORLD_SIZE) / 2;

            items.push({
                x: x + STRIP_WIDTH/2,
                left: { z: leftBoxZ, width: leftBoxWidth },
                right: { z: rightBoxZ, width: rightBoxWidth }
            });
        }
        return items;
    }, []);

    return (
        <group>
            {/* The actual river bed (sand/mud at bottom) - Physical floor so you don't fall forever */}
            <RiverBed />
            
            {/* The Banks */}
            {strips.map((strip, i) => (
                <React.Fragment key={i}>
                    <GroundStrip position={[strip.x, -0.5, strip.left.z]} args={[STRIP_WIDTH, 1, strip.left.width]} />
                    <GroundStrip position={[strip.x, -0.5, strip.right.z]} args={[STRIP_WIDTH, 1, strip.right.width]} />
                </React.Fragment>
            ))}

            {/* The Bridge */}
            <BridgePhysical />
        </group>
    );
}

const GroundStrip: React.FC<{position: [number, number, number], args: [number, number, number]}> = ({position, args}) => {
    const [ref] = useBox(() => ({
        type: 'Static',
        position,
        args
    }));
    return (
        <mesh ref={ref as any} receiveShadow>
            <boxGeometry args={args} />
            <meshStandardMaterial color={COLORS.GRASS} roughness={1} />
        </mesh>
    );
}

const RiverBed = () => {
    // A plane at y = -2.0
    const [ref] = usePlane(() => ({ 
        rotation: [-Math.PI / 2, 0, 0], 
        position: [0, -2.0, 0], 
        material: { friction: 0.8 } 
    }));
    return (
        <mesh ref={ref as any} receiveShadow>
            <planeGeometry args={[200, 200]} />
            <meshStandardMaterial color="#3E2723" roughness={1} />
        </mesh>
    );
}

const BridgePhysical = () => {
    // Bridge at x=0
    // Visuals are in OrganicEnvironment, this is just the collider
    // Arch height approx 0 at ends, 1 at peak.
    // For simplicity, a flat box collider slightly raised
    const [ref] = useBox(() => ({
        type: 'Static',
        position: [0, 0.1, BRIDGE_Z_OFFSET],
        args: [4, 0.2, 8] // Width 4, Thickness 0.2, Length 8 (spans river width 6)
    }));

    return (
        <mesh ref={ref as any}>
            <boxGeometry args={[4, 0.2, 8]} />
            <meshStandardMaterial color={COLORS.WOOD_DARK} />
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

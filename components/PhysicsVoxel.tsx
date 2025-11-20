import React, { useState, useEffect, useMemo } from 'react';
import { useBox } from '@react-three/cannon';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AppState, VoxelData } from '../types';
import { BLOCK_SCALE } from '../constants';

interface PhysicsVoxelProps {
  data: VoxelData;
  targetData?: VoxelData; // Where it should go when rebuilding
  appState: AppState;
}

export const PhysicsVoxel: React.FC<PhysicsVoxelProps> = ({ data, targetData, appState }) => {
  // Determine initial position based on whether we are generating fresh or using existing
  const initialPos: [number, number, number] = [data.x, data.y, data.z];

  // Cannon physics hook
  // Note: We control 'type' via mass (0 = static/kinematic behavior, >0 = dynamic)
  // Scale is now BLOCK_SCALE (0.5)
  const [ref, api] = useBox(() => ({
    mass: 1, 
    position: initialPos,
    args: [BLOCK_SCALE, BLOCK_SCALE, BLOCK_SCALE],
    material: { friction: 0.5, restitution: 0.3 },
    sleepSpeedLimit: 0.1, // Allow aggressive sleeping for performance
  }));

  const [isRebuildLocked, setRebuildLocked] = useState(false);

  // State Machine handling
  useEffect(() => {
    if (!api) return;

    if (appState === AppState.EXPLODING) {
      // Wake up physics
      api.mass.set(1); 
      api.wakeUp();
      setRebuildLocked(false);
      
      // Add a random explosion impulse to scatter them
      const force = 3; // Reduced force for smaller blocks
      api.applyImpulse(
        [(Math.random() - 0.5) * force, Math.random() * force, (Math.random() - 0.5) * force],
        [0, 0, 0]
      );
    } else if (appState === AppState.REBUILDING) {
      // Disable gravity/physics for rebuilding
      api.mass.set(0);
      // Stop moving
      api.velocity.set(0, 0, 0);
      api.angularVelocity.set(0, 0, 0);
    } else if (appState === AppState.IDLE) {
       // Lock in place
       api.mass.set(0);
       api.velocity.set(0,0,0);
       api.angularVelocity.set(0, 0, 0);
       
       // If we just finished rebuilding, snap to target grid exactly
       if (targetData) {
            api.position.set(targetData.x, targetData.y, targetData.z);
            api.rotation.set(0,0,0);
       }
    }
  }, [appState, api, targetData]);

  // Animation loop for rebuilding interpolation
  useFrame(() => {
    if (appState === AppState.REBUILDING && targetData && !isRebuildLocked) {
      // We need to read the current position from physics world
      const currentPos = new THREE.Vector3();
      if (ref.current) {
          ref.current.getWorldPosition(currentPos);
      }
      
      const target = new THREE.Vector3(targetData.x, targetData.y, targetData.z);
      
      // Lerp factor
      const alpha = 0.05;
      currentPos.lerp(target, alpha);
      
      // Drive position manually (teleport) since mass is 0
      api.position.set(currentPos.x, currentPos.y, currentPos.z);
      
      // Rotate upright
      api.rotation.set(0,0,0);

      // Check completion
      if (currentPos.distanceTo(target) < 0.1) {
        setRebuildLocked(true);
        api.position.set(targetData.x, targetData.y, targetData.z);
      }
    }
  });

  // Color transition
  const materialColor = useMemo(() => {
      return targetData && appState === AppState.REBUILDING ? targetData.color : data.color;
  }, [data.color, targetData, appState]);

  return (
    <mesh ref={ref as any} castShadow receiveShadow>
      <boxGeometry args={[BLOCK_SCALE * 0.95, BLOCK_SCALE * 0.95, BLOCK_SCALE * 0.95]} />
      <meshStandardMaterial color={materialColor} />
    </mesh>
  );
};

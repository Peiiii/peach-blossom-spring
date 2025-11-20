import React, { useEffect, useRef, useState } from 'react';
import { useSphere } from '@react-three/cannon';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { usePlayerControls } from '../hooks/usePlayerControls';
import { COLORS } from '../constants';

const WALK_SPEED = 10;
const JUMP_FORCE = 15;
const GRAVITY = 30;

export const Player = () => {
  const { camera } = useThree();
  const { forward, backward, left, right, jump } = usePlayerControls();
  
  // 1. Source of Truth: Visual Position
  // We calculate this manually every frame.
  const position = useRef(new THREE.Vector3(0, 10, 0)); 
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  
  // 2. Physics Body (Kinematic)
  // Type: 'Kinematic' means "I control the position, Physics engine calculates collisions based on my movement"
  // This prevents the player from tipping over, getting stuck, or floating weirdly.
  const [ref, api] = useSphere(() => ({
    mass: 1,
    type: 'Kinematic', 
    position: [0, 10, 0],
    args: [0.5],
  }));

  // 3. Camera Controls
  const controlsRef = useRef<any>(null);

  useFrame((state, delta) => {
    // Limit delta to avoid huge jumps if frame lags
    const dt = Math.min(delta, 0.1);

    // --- A. MOVEMENT (WASD) ---
    // Calculate raw input vector
    const frontInput = Number(backward) - Number(forward);
    const sideInput = Number(left) - Number(right);
    
    const moveVector = new THREE.Vector3(sideInput, 0, frontInput);
    
    // If moving
    if (moveVector.length() > 0) {
        moveVector.normalize().multiplyScalar(WALK_SPEED * dt);

        // Align movement with Camera Angle
        const cameraEuler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
        moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraEuler.y);
        
        // Apply X/Z movement
        position.current.x += moveVector.x;
        position.current.z += moveVector.z;

        // Rotate Character Model
        if (ref.current) {
            const angle = Math.atan2(moveVector.x, moveVector.z);
            // Instant rotation for responsiveness
            ref.current.rotation.y = angle;
        }
    }

    // --- B. GRAVITY (Manual) ---
    // Always apply gravity
    velocity.current.y -= GRAVITY * dt;
    
    // Apply Y velocity
    position.current.y += velocity.current.y * dt;

    // --- C. GROUND COLLISION (Hardcoded) ---
    // Simple floor check at Y=0
    if (position.current.y <= 0) {
        position.current.y = 0;
        velocity.current.y = 0;
        
        // Jump is only allowed when grounded
        if (jump) {
            velocity.current.y = JUMP_FORCE;
        }
    }

    // --- D. SYNC TO PHYSICS ---
    // Teleport the physics body to our calculated position
    // This ensures we smash into blocks if we run into them
    api.position.set(position.current.x, position.current.y + 0.5, position.current.z);

    // --- E. CAMERA FOLLOW ---
    if (controlsRef.current) {
        const target = new THREE.Vector3(
            position.current.x,
            position.current.y + 1.5, 
            position.current.z
        );
        // Smoothly interpolate camera target
        controlsRef.current.target.lerp(target, 0.2);
        controlsRef.current.update();
    }
  });

  return (
    <>
        <OrbitControls 
            ref={controlsRef}
            enablePan={false}
            enableZoom={true}
            maxPolarAngle={Math.PI / 2 - 0.05} // Prevent looking underground
            minDistance={5}
            maxDistance={30}
        />

        {/* The Visual Character */}
        <group ref={ref as any}>
            <group position={[0, -0.5, 0]}>
                {/* Body */}
                <mesh castShadow position={[0, 0.75, 0]}>
                    <boxGeometry args={[0.4, 0.7, 0.25]} />
                    <meshStandardMaterial color="#D32F2F" />
                </mesh>
                {/* Head */}
                <mesh castShadow position={[0, 1.3, 0]}>
                    <boxGeometry args={[0.25, 0.25, 0.25]} />
                    <meshStandardMaterial color={COLORS.SKIN} />
                </mesh>
                {/* Hat */}
                <mesh position={[0, 1.45, 0]} castShadow>
                    <coneGeometry args={[0.4, 0.25, 4]} />
                    <meshStandardMaterial color={COLORS.WOOD_DARK} />
                </mesh>
                {/* Backpack */}
                <mesh castShadow position={[0, 0.8, -0.2]}>
                    <boxGeometry args={[0.3, 0.4, 0.15]} />
                    <meshStandardMaterial color={COLORS.WOOD_LIGHT} />
                </mesh>
            </group>
        </group>
    </>
  );
};
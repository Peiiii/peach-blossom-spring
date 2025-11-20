
import React, { useEffect, useRef, useState } from 'react';
import { useSphere } from '@react-three/cannon';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { usePlayerControls } from '../hooks/usePlayerControls';
import { COLORS } from '../constants';

const WALK_SPEED = 10;
const FLY_SPEED = 20;
const JUMP_FORCE = 15;
const GRAVITY = 30;

export const Player = () => {
  const { camera } = useThree();
  const { forward, backward, left, right, jump, descend, flyMode } = usePlayerControls();
  
  // 1. Source of Truth: Visual Position
  // We calculate this manually every frame.
  const position = useRef(new THREE.Vector3(0, 10, 0)); 
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const prevPosition = useRef(new THREE.Vector3(0, 10, 0));
  
  const propellerRef = useRef<THREE.Mesh>(null);

  // 2. Physics Body (Kinematic)
  // Type: 'Kinematic' means "I control the position, Physics engine calculates collisions based on my movement"
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
    // Corrected direction logic: Right is positive X, Left is negative X relative to camera view
    const sideInput = Number(right) - Number(left);
    
    const moveVector = new THREE.Vector3(sideInput, 0, frontInput);
    const currentSpeed = flyMode ? FLY_SPEED : WALK_SPEED;
    
    // If moving
    if (moveVector.length() > 0) {
        moveVector.normalize().multiplyScalar(currentSpeed * dt);

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

    if (flyMode) {
        // --- B. FLIGHT MODE PHYSICS ---
        // No gravity. Velocity is controlled directly by input.
        let verticalSpeed = 0;
        if (jump) verticalSpeed += FLY_SPEED;
        if (descend) verticalSpeed -= FLY_SPEED;
        
        // Smooth vertical movement
        position.current.y += verticalSpeed * dt;
        
        // Reset accumulated velocity so we don't rocket off when switching back to walk
        velocity.current.y = 0;
        
        // Animate propeller
        if (propellerRef.current) {
            propellerRef.current.rotation.z += dt * 20;
        }

    } else {
        // --- B. NORMAL GRAVITY ---
        velocity.current.y -= GRAVITY * dt;
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
    }

    // --- D. SYNC TO PHYSICS ---
    // Teleport the physics body to our calculated position
    api.position.set(position.current.x, position.current.y + 0.5, position.current.z);

    // --- E. CAMERA FOLLOW (Fixed Angle) ---
    // 1. Calculate movement delta
    const displacement = new THREE.Vector3().copy(position.current).sub(prevPosition.current);
    
    // 2. Apply exact same movement to camera position
    camera.position.add(displacement);

    if (controlsRef.current) {
        // 3. Update controls target to match player
        // Use copy/set instead of lerp to keep perfect sync with the rigid camera move
        controlsRef.current.target.copy(position.current).add(new THREE.Vector3(0, 1.5, 0));
        controlsRef.current.update();
    }
    
    // Update history
    prevPosition.current.copy(position.current);
  });

  return (
    <>
        <OrbitControls 
            ref={controlsRef}
            enablePan={false}
            enableZoom={true}
            enableDamping={true} 
            dampingFactor={0.1} 
            rotateSpeed={0.3} // Reduced rotation speed for smoother feel
            maxPolarAngle={flyMode ? Math.PI : Math.PI / 2 - 0.05}
            minDistance={2} 
            maxDistance={5} // EXTREMELY REDUCED: Keeps camera very tight to player
        />

        {/* The Visual Character */}
        <group ref={ref as any}>
            {/* Flight visual indicator (Propeller) */}
            {flyMode && (
                <mesh ref={propellerRef} position={[0, 1.8, -0.3]}>
                     <boxGeometry args={[0.8, 0.05, 0.05]} />
                     <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.5} />
                </mesh>
            )}
            
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
                {/* Jet/Cape for flight */}
                {flyMode && (
                    <mesh position={[0, 0.6, -0.4]}>
                        <boxGeometry args={[0.2, 0.5, 0.1]} />
                        <meshStandardMaterial color="#555" />
                    </mesh>
                )}
            </group>
        </group>
    </>
  );
};

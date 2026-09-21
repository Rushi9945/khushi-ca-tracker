import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const Tree = ({ progress = 0 }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.2;
    }
  });

  const scale = 0.5 + progress * 0.05; // Tree grows with progress

  return (
    <group ref={groupRef} scale={[scale, scale, scale]} position={[0, -2, 0]}>
      {/* Trunk */}
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.2, 0.3, 2, 8]} />
        <meshStandardMaterial color="#5c4033" />
      </mesh>
      
      {/* Leaves */}
      <mesh position={[0, 2.5, 0]}>
        <coneGeometry args={[1.5, 3, 8]} />
        <meshStandardMaterial color="#228b22" />
      </mesh>
      
      {/* More leaves if progress is high */}
      {progress > 5 && (
        <mesh position={[0, 3.5, 0]}>
          <coneGeometry args={[1, 2, 8]} />
          <meshStandardMaterial color="#32cd32" />
        </mesh>
      )}
    </group>
  );
};

"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { TowerParams } from "@/types/tower";

export default function ShackTower({ params }: { params: TowerParams }) {
  const smokeRef = useRef<THREE.Mesh>(null);
  const h = Math.max(3, params.height);
  const w = params.width * 0.6;

  // Animate chimney smoke
  useFrame((state) => {
    if (smokeRef.current) {
      smokeRef.current.position.y = h + 1.5 + Math.sin(state.clock.elapsedTime) * 0.3;
      smokeRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.2);
      const mat = smokeRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.15 + Math.sin(state.clock.elapsedTime * 0.7) * 0.08;
    }
  });

  return (
    <group>
      {/* Stone foundation */}
      <mesh position={[0, 0.15, 0]} receiveShadow castShadow>
        <boxGeometry args={[w + 0.6, 0.3, w + 0.6]} />
        <meshStandardMaterial color="#555544" roughness={0.95} metalness={0.05} />
      </mesh>

      {/* Main wooden body */}
      <mesh position={[0, h / 2 + 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, w]} />
        <meshStandardMaterial color="#8B6914" roughness={0.9} metalness={0.02} />
      </mesh>

      {/* Horizontal plank lines */}
      {Array.from({ length: Math.floor(h / 0.5) }).map((_, i) => (
        <mesh key={`plank-${i}`} position={[0, 0.3 + i * 0.5, w / 2 + 0.005]}>
          <boxGeometry args={[w, 0.02, 0.01]} />
          <meshStandardMaterial color="#6B4F12" roughness={0.9} />
        </mesh>
      ))}

      {/* Slanted roof */}
      <mesh position={[0, h + 0.3 + h * 0.12, 0]} castShadow rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[w * 0.9, h * 0.25, 4]} />
        <meshStandardMaterial color="#5a3a1a" roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Door */}
      <mesh position={[0, 0.9, w / 2 + 0.01]}>
        <planeGeometry args={[w * 0.3, 1.2]} />
        <meshStandardMaterial color="#3d2b1f" roughness={0.9} />
      </mesh>
      {/* Door frame */}
      <mesh position={[0, 0.9, w / 2 + 0.015]}>
        <planeGeometry args={[w * 0.33, 1.25]} />
        <meshStandardMaterial color="#2a1a0a" roughness={0.8} />
      </mesh>

      {/* Window with warm glow */}
      <mesh position={[w * 0.3, h * 0.6 + 0.3, w / 2 + 0.01]}>
        <planeGeometry args={[0.4, 0.4]} />
        <meshStandardMaterial
          color="#ffdd88"
          emissive="#ffaa33"
          emissiveIntensity={0.6}
          roughness={0.3}
        />
      </mesh>
      {/* Window frame */}
      <mesh position={[w * 0.3, h * 0.6 + 0.3, w / 2 + 0.015]}>
        <planeGeometry args={[0.45, 0.45]} />
        <meshStandardMaterial color="#3d2b1f" roughness={0.8} />
      </mesh>

      {/* Chimney */}
      <mesh position={[w * 0.25, h + 0.6, -w * 0.15]} castShadow>
        <boxGeometry args={[0.3, 1.2, 0.3]} />
        <meshStandardMaterial color="#664433" roughness={0.85} />
      </mesh>

      {/* Chimney smoke */}
      <mesh ref={smokeRef} position={[w * 0.25, h + 1.5, -w * 0.15]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial color="#aaaaaa" transparent opacity={0.15} />
      </mesh>

      {/* Warm interior glow */}
      <pointLight
        position={[0, h * 0.4, w * 0.3]}
        intensity={0.8}
        color="#ffaa44"
        distance={3}
        decay={2}
      />
    </group>
  );
}

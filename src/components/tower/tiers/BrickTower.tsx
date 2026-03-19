"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { TowerParams } from "@/types/tower";

export default function BrickTower({ params }: { params: TowerParams }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const h = Math.max(5, params.height);
  const w = params.width;

  // Animate entrance light
  useFrame((state) => {
    if (lightRef.current) {
      lightRef.current.intensity = 1.5 + Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
    }
  });

  const floors = Math.max(3, params.floors);
  const floorH = h / floors;

  return (
    <group>
      {/* Concrete sidewalk */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[w + 1, 0.1, w + 1]} />
        <meshStandardMaterial color="#444444" roughness={0.9} />
      </mesh>

      {/* Foundation */}
      <mesh position={[0, 0.2, 0]} receiveShadow castShadow>
        <boxGeometry args={[w + 0.3, 0.3, w + 0.3]} />
        <meshStandardMaterial color="#555555" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Main brick body */}
      <mesh position={[0, h / 2 + 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, w]} />
        <meshStandardMaterial color="#A0522D" roughness={0.75} metalness={0.05} />
      </mesh>

      {/* Floor separator ledges */}
      {Array.from({ length: floors + 1 }).map((_, i) => (
        <mesh key={`ledge-${i}`} position={[0, 0.35 + i * floorH, 0]}>
          <boxGeometry args={[w + 0.08, 0.06, w + 0.08]} />
          <meshStandardMaterial color="#8B4513" roughness={0.7} metalness={0.1} />
        </mesh>
      ))}

      {/* Windows on all sides */}
      {Array.from({ length: floors }).map((_, floor) => {
        const y = 0.35 + floor * floorH + floorH * 0.55;
        const winsPerSide = Math.max(2, Math.floor(w / 0.7));
        const lit = Math.random() > 0.3;
        return Array.from({ length: winsPerSide }).map((_, wi) => {
          const offset = (wi - (winsPerSide - 1) / 2) * 0.65;
          const isLit = lit && Math.random() > 0.2;
          return (
            <group key={`win-${floor}-${wi}`}>
              {/* Front */}
              <mesh position={[offset, y, w / 2 + 0.006]}>
                <planeGeometry args={[0.35, 0.5]} />
                <meshStandardMaterial
                  color={isLit ? "#ffeebb" : "#222222"}
                  emissive={isLit ? "#ffcc44" : "#000000"}
                  emissiveIntensity={isLit ? 0.35 : 0}
                  roughness={0.2}
                />
              </mesh>
              {/* Back */}
              <mesh position={[offset, y, -(w / 2 + 0.006)]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[0.35, 0.5]} />
                <meshStandardMaterial
                  color={isLit ? "#ffeebb" : "#222222"}
                  emissive={isLit ? "#ffcc44" : "#000000"}
                  emissiveIntensity={isLit ? 0.35 : 0}
                  roughness={0.2}
                />
              </mesh>
            </group>
          );
        });
      })}

      {/* Roof cornice */}
      <mesh position={[0, h + 0.35 + 0.12, 0]} castShadow>
        <boxGeometry args={[w + 0.2, 0.25, w + 0.2]} />
        <meshStandardMaterial color="#777" roughness={0.6} metalness={0.15} />
      </mesh>

      {/* Flat roof with water tank */}
      <mesh position={[0, h + 0.35 + 0.3, 0]}>
        <boxGeometry args={[w - 0.1, 0.1, w - 0.1]} />
        <meshStandardMaterial color="#333" roughness={0.9} />
      </mesh>
      <mesh position={[w * 0.2, h + 0.35 + 0.8, -w * 0.2]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.8, 8]} />
        <meshStandardMaterial color="#666" roughness={0.7} metalness={0.3} />
      </mesh>

      {/* Entrance canopy */}
      <mesh position={[0, 1.5, w / 2 + 0.3]}>
        <boxGeometry args={[w * 0.4, 0.08, 0.5]} />
        <meshStandardMaterial color="#444" roughness={0.5} metalness={0.3} />
      </mesh>

      {/* Entrance light */}
      <pointLight
        ref={lightRef}
        position={[0, 1.3, w / 2 + 0.3]}
        intensity={1.5}
        color="#ffcc77"
        distance={3}
        decay={2}
      />
    </group>
  );
}

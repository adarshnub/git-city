"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { TowerParams } from "@/types/tower";

export default function OfficeTower({ params }: { params: TowerParams }) {
  const beaconRef = useRef<THREE.Mesh>(null);
  const h = Math.max(8, params.height);
  const w = params.width;
  const floors = Math.max(5, params.floors);
  const floorH = h / floors;

  // Window lighting data
  const windowLitPattern = useMemo(() => {
    return Array.from({ length: floors * 4 * 3 }).map(() => ({
      lit: Math.random() > 0.15,
      warmth: Math.random(),
    }));
  }, [floors]);

  // Animate roof beacon
  useFrame((state) => {
    if (beaconRef.current) {
      const mat = beaconRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.8;
    }
  });

  return (
    <group>
      {/* Street-level plaza */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[w + 1.5, 0.1, w + 1.5]} />
        <meshStandardMaterial color="#333333" roughness={0.85} metalness={0.1} />
      </mesh>

      {/* Heavy foundation */}
      <mesh position={[0, 0.35, 0]} receiveShadow castShadow>
        <boxGeometry args={[w + 0.4, 0.6, w + 0.4]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.5} metalness={0.3} />
      </mesh>

      {/* Lobby level - darker, taller */}
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w + 0.2, 1.5, w + 0.2]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.3} metalness={0.4} />
      </mesh>

      {/* Main concrete body */}
      <mesh position={[0, h / 2 + 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, w]} />
        <meshStandardMaterial color="#708090" roughness={0.55} metalness={0.2} />
      </mesh>

      {/* Vertical column lines on corners */}
      {[
        [w / 2, 0, w / 2],
        [-w / 2, 0, w / 2],
        [w / 2, 0, -w / 2],
        [-w / 2, 0, -w / 2],
      ].map((pos, i) => (
        <mesh key={`col-${i}`} position={[pos[0], h / 2 + 2, pos[2]]}>
          <boxGeometry args={[0.12, h, 0.12]} />
          <meshStandardMaterial color="#555566" roughness={0.4} metalness={0.4} />
        </mesh>
      ))}

      {/* Floor separator bands */}
      {Array.from({ length: floors }).map((_, i) => (
        <mesh key={`band-${i}`} position={[0, 2 + (i + 1) * floorH, 0]}>
          <boxGeometry args={[w + 0.04, 0.06, w + 0.04]} />
          <meshStandardMaterial color="#5a5a6a" roughness={0.4} metalness={0.3} />
        </mesh>
      ))}

      {/* Windows - blue tinted glass */}
      {Array.from({ length: floors }).map((_, floor) => {
        const y = 2 + floor * floorH + floorH * 0.5;
        const winsPerSide = Math.max(3, Math.floor(w / 0.55));

        return Array.from({ length: winsPerSide }).map((_, wi) => {
          const offset = (wi - (winsPerSide - 1) / 2) * 0.5;
          const dataIdx = (floor * 4 * 3 + wi) % windowLitPattern.length;
          const isLit = windowLitPattern[dataIdx].lit;
          const warmth = windowLitPattern[dataIdx].warmth;

          const litColor = warmth > 0.5 ? "#ffeedd" : "#ddeeff";
          const emColor = warmth > 0.5 ? "#ffcc66" : "#aaccff";

          return (
            <group key={`win-${floor}-${wi}`}>
              <mesh position={[offset, y, w / 2 + 0.006]}>
                <planeGeometry args={[0.35, floorH * 0.65]} />
                <meshStandardMaterial
                  color={isLit ? litColor : "#1a1a2e"}
                  emissive={isLit ? emColor : "#000"}
                  emissiveIntensity={isLit ? 0.3 : 0}
                  roughness={0.1}
                  metalness={0.4}
                />
              </mesh>
              <mesh position={[offset, y, -(w / 2 + 0.006)]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[0.35, floorH * 0.65]} />
                <meshStandardMaterial
                  color={isLit ? litColor : "#1a1a2e"}
                  emissive={isLit ? emColor : "#000"}
                  emissiveIntensity={isLit ? 0.3 : 0}
                  roughness={0.1}
                  metalness={0.4}
                />
              </mesh>
              <mesh position={[w / 2 + 0.006, y, offset]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[0.35, floorH * 0.65]} />
                <meshStandardMaterial
                  color={isLit ? litColor : "#1a1a2e"}
                  emissive={isLit ? emColor : "#000"}
                  emissiveIntensity={isLit ? 0.3 : 0}
                  roughness={0.1}
                  metalness={0.4}
                />
              </mesh>
            </group>
          );
        });
      })}

      {/* Mechanical penthouse */}
      <mesh position={[0, h + 2 + 0.5, 0]} castShadow>
        <boxGeometry args={[w * 0.6, 1, w * 0.6]} />
        <meshStandardMaterial color="#4a4a5a" roughness={0.5} metalness={0.3} />
      </mesh>

      {/* Roof beacon */}
      <mesh ref={beaconRef} position={[0, h + 3.2, 0]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color="#ff3333" emissive="#ff0000" emissiveIntensity={1} />
      </mesh>
      <mesh position={[0, h + 2.9, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.5, 6]} />
        <meshStandardMaterial color="#666" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Interior glow through lobby */}
      <pointLight position={[0, 1.2, w / 2]} intensity={2} color="#ffddaa" distance={4} decay={2} />
    </group>
  );
}

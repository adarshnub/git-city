"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { TowerParams } from "@/types/tower";

export default function GlassTower({ params }: { params: TowerParams }) {
  const elevatorRef = useRef<THREE.Mesh>(null);
  const crownRef = useRef<THREE.Mesh>(null);
  const h = Math.max(10, params.height);
  const w = params.width;
  const floors = Math.max(8, params.floors);
  const floorH = h / floors;

  // Window lighting data
  const windowData = useMemo(() => {
    return Array.from({ length: floors * 6 * 4 }).map(() => ({
      lit: Math.random() > 0.1,
      warmth: Math.random(),
      flicker: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 1.5,
    }));
  }, [floors]);

  // Animate elevator light + crown pulse
  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Elevator moving up and down
    if (elevatorRef.current) {
      const cycle = ((t * 0.4) % 2);
      const progress = cycle < 1 ? cycle : 2 - cycle;
      elevatorRef.current.position.y = 2.5 + progress * (h - 1);
    }

    // Crown glow pulse
    if (crownRef.current) {
      const mat = crownRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.6 + Math.sin(t * 1.5) * 0.3;
    }
  });

  return (
    <group>
      {/* Grand plaza */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[w + 2, 0.1, w + 2]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.8} metalness={0.15} />
      </mesh>

      {/* Polished granite base */}
      <mesh position={[0, 0.35, 0]} receiveShadow castShadow>
        <boxGeometry args={[w + 0.6, 0.6, w + 0.6]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.15} metalness={0.6} />
      </mesh>

      {/* Glass lobby - double height with visible interior */}
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[w + 0.3, 2.2, w + 0.3]} />
        <meshPhysicalMaterial
          color="#0a0a1a"
          roughness={0.05}
          metalness={0.3}
          transmission={0.5}
          thickness={0.3}
          transparent
          opacity={0.85}
          envMapIntensity={1.5}
        />
      </mesh>

      {/* Lobby interior warm light */}
      <pointLight position={[0, 1.5, w / 2]} intensity={3} color="#ffddaa" distance={5} decay={2} />
      <pointLight position={[0, 1.5, -w / 2]} intensity={3} color="#ffddaa" distance={5} decay={2} />

      {/* Main glass curtain wall body */}
      <mesh position={[0, h / 2 + 2.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, w]} />
        <meshPhysicalMaterial
          color="#1a2a4a"
          roughness={0.02}
          metalness={0.15}
          transmission={0.35}
          thickness={0.5}
          ior={1.5}
          transparent
          opacity={0.88}
          envMapIntensity={2}
        />
      </mesh>

      {/* Steel mullion grid - vertical */}
      {Array.from({ length: Math.max(4, Math.floor(w / 0.5) + 1) }).map((_, i) => {
        const count = Math.max(4, Math.floor(w / 0.5) + 1);
        const offset = (i / (count - 1) - 0.5) * w;
        return (
          <group key={`vmullion-${i}`}>
            {/* Front */}
            <mesh position={[offset, h / 2 + 2.6, w / 2 + 0.003]}>
              <boxGeometry args={[0.02, h, 0.006]} />
              <meshStandardMaterial color="#8899aa" roughness={0.2} metalness={0.7} />
            </mesh>
            {/* Back */}
            <mesh position={[offset, h / 2 + 2.6, -(w / 2 + 0.003)]}>
              <boxGeometry args={[0.02, h, 0.006]} />
              <meshStandardMaterial color="#8899aa" roughness={0.2} metalness={0.7} />
            </mesh>
            {/* Right side */}
            <mesh position={[w / 2 + 0.003, h / 2 + 2.6, offset]}>
              <boxGeometry args={[0.006, h, 0.02]} />
              <meshStandardMaterial color="#8899aa" roughness={0.2} metalness={0.7} />
            </mesh>
            {/* Left side */}
            <mesh position={[-(w / 2 + 0.003), h / 2 + 2.6, offset]}>
              <boxGeometry args={[0.006, h, 0.02]} />
              <meshStandardMaterial color="#8899aa" roughness={0.2} metalness={0.7} />
            </mesh>
          </group>
        );
      })}

      {/* Steel mullion grid - horizontal floor bands */}
      {Array.from({ length: floors }).map((_, i) => (
        <group key={`hband-${i}`}>
          <mesh position={[0, 2.6 + (i + 1) * floorH, w / 2 + 0.003]}>
            <boxGeometry args={[w + 0.01, 0.025, 0.006]} />
            <meshStandardMaterial color="#8899aa" roughness={0.2} metalness={0.7} />
          </mesh>
          <mesh position={[0, 2.6 + (i + 1) * floorH, -(w / 2 + 0.003)]}>
            <boxGeometry args={[w + 0.01, 0.025, 0.006]} />
            <meshStandardMaterial color="#8899aa" roughness={0.2} metalness={0.7} />
          </mesh>
          <mesh position={[w / 2 + 0.003, 2.6 + (i + 1) * floorH, 0]}>
            <boxGeometry args={[0.006, 0.025, w + 0.01]} />
            <meshStandardMaterial color="#8899aa" roughness={0.2} metalness={0.7} />
          </mesh>
          <mesh position={[-(w / 2 + 0.003), 2.6 + (i + 1) * floorH, 0]}>
            <boxGeometry args={[0.006, 0.025, w + 0.01]} />
            <meshStandardMaterial color="#8899aa" roughness={0.2} metalness={0.7} />
          </mesh>
        </group>
      ))}

      {/* Window panels with warm/cool interior lighting */}
      {Array.from({ length: floors }).map((_, floor) => {
        const y = 2.6 + floor * floorH + floorH * 0.5;
        const winsPerSide = Math.max(4, Math.floor(w / 0.45));
        return Array.from({ length: winsPerSide }).map((_, wi) => {
          const offset = (wi - (winsPerSide - 1) / 2) * 0.42;
          const dataIdx = (floor * 6 * 4 + wi) % windowData.length;
          const d = windowData[dataIdx];
          const litColor = d.warmth > 0.6 ? "#ffeedd" : d.warmth > 0.3 ? "#ddeeff" : "#eeeeff";
          const emColor = d.warmth > 0.6 ? "#ffcc66" : d.warmth > 0.3 ? "#88aaff" : "#aaddff";
          return (
            <group key={`win-${floor}-${wi}`}>
              {/* Front */}
              <mesh position={[offset, y, w / 2 + 0.007]}>
                <planeGeometry args={[0.32, floorH * 0.7]} />
                <meshStandardMaterial
                  color={d.lit ? litColor : "#0a0a1e"}
                  emissive={d.lit ? emColor : "#000"}
                  emissiveIntensity={d.lit ? 0.35 : 0}
                  roughness={0.05}
                  metalness={0.3}
                />
              </mesh>
              {/* Back */}
              <mesh position={[offset, y, -(w / 2 + 0.007)]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[0.32, floorH * 0.7]} />
                <meshStandardMaterial
                  color={d.lit ? litColor : "#0a0a1e"}
                  emissive={d.lit ? emColor : "#000"}
                  emissiveIntensity={d.lit ? 0.35 : 0}
                  roughness={0.05}
                  metalness={0.3}
                />
              </mesh>
              {/* Right */}
              <mesh position={[w / 2 + 0.007, y, offset]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[0.32, floorH * 0.7]} />
                <meshStandardMaterial
                  color={d.lit ? litColor : "#0a0a1e"}
                  emissive={d.lit ? emColor : "#000"}
                  emissiveIntensity={d.lit ? 0.35 : 0}
                  roughness={0.05}
                  metalness={0.3}
                />
              </mesh>
              {/* Left */}
              <mesh position={[-(w / 2 + 0.007), y, offset]} rotation={[0, -Math.PI / 2, 0]}>
                <planeGeometry args={[0.32, floorH * 0.7]} />
                <meshStandardMaterial
                  color={d.lit ? litColor : "#0a0a1e"}
                  emissive={d.lit ? emColor : "#000"}
                  emissiveIntensity={d.lit ? 0.35 : 0}
                  roughness={0.05}
                  metalness={0.3}
                />
              </mesh>
            </group>
          );
        });
      })}

      {/* Corner chrome columns */}
      {[
        [w / 2 + 0.02, 0, w / 2 + 0.02],
        [-(w / 2 + 0.02), 0, w / 2 + 0.02],
        [w / 2 + 0.02, 0, -(w / 2 + 0.02)],
        [-(w / 2 + 0.02), 0, -(w / 2 + 0.02)],
      ].map((pos, i) => (
        <mesh key={`col-${i}`} position={[pos[0], h / 2 + 2.6, pos[2]]}>
          <boxGeometry args={[0.08, h + 0.5, 0.08]} />
          <meshStandardMaterial color="#c0c8d0" roughness={0.1} metalness={0.85} />
        </mesh>
      ))}

      {/* Elevator shaft visible on one side */}
      <mesh position={[w * 0.3, h / 2 + 2.6, w / 2 + 0.008]}>
        <boxGeometry args={[0.5, h, 0.005]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.3} metalness={0.4} transparent opacity={0.5} />
      </mesh>

      {/* Animated elevator light */}
      <mesh ref={elevatorRef} position={[w * 0.3, 2.5, w / 2 + 0.012]}>
        <planeGeometry args={[0.4, 0.3]} />
        <meshStandardMaterial color="#ffeecc" emissive="#ffcc66" emissiveIntensity={0.8} />
      </mesh>

      {/* Mechanical penthouse / crown */}
      <mesh position={[0, h + 2.8, 0]} castShadow>
        <boxGeometry args={[w * 0.7, 0.6, w * 0.7]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.2} metalness={0.6} />
      </mesh>

      {/* Crown decorative ring */}
      <mesh ref={crownRef} position={[0, h + 3.2, 0]}>
        <boxGeometry args={[w * 0.75, 0.15, w * 0.75]} />
        <meshStandardMaterial
          color="#4488aa"
          emissive="#2266aa"
          emissiveIntensity={0.6}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>

      {/* Spire */}
      {params.hasSpire && (
        <group position={[0, h + 3.4, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.02, 0.12, h * 0.12, 8]} />
            <meshStandardMaterial color="#d0d8e0" roughness={0.1} metalness={0.9} />
          </mesh>
          <mesh position={[0, h * 0.06 + 0.1, 0]}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshStandardMaterial color="#00aaff" emissive="#0088ff" emissiveIntensity={2} />
          </mesh>
        </group>
      )}

      {/* Reflection accent lights at base */}
      <pointLight position={[w / 2, 0.3, w / 2]} intensity={1} color="#4488cc" distance={3} decay={2} />
      <pointLight position={[-w / 2, 0.3, -w / 2]} intensity={1} color="#4488cc" distance={3} decay={2} />
    </group>
  );
}

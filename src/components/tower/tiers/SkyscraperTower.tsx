"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { TowerParams } from "@/types/tower";

export default function SkyscraperTower({ params }: { params: TowerParams }) {
  const crownRef = useRef<THREE.Group>(null);
  const spireRef = useRef<THREE.Mesh>(null);
  const h = Math.max(14, params.height);
  const w = params.width;
  const floors = Math.max(12, params.floors);
  const floorH = h / floors;

  // Three setback sections
  const sections = useMemo(() => [
    { w: w, h: h * 0.45, yBase: 3, floors: Math.floor(floors * 0.45) },
    { w: w * 0.82, h: h * 0.3, yBase: 3 + h * 0.45, floors: Math.floor(floors * 0.3) },
    { w: w * 0.6, h: h * 0.25, yBase: 3 + h * 0.75, floors: Math.floor(floors * 0.25) },
  ], [w, h, floors]);

  // Window data for all sections
  const windowData = useMemo(() => {
    const total = floors * 8 * 4;
    return Array.from({ length: total }).map(() => ({
      lit: Math.random() > 0.08,
      warmth: Math.random(),
    }));
  }, [floors]);

  // Animate crown and spire
  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Crown lights sweep
    if (crownRef.current) {
      crownRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshStandardMaterial;
          if (mat.emissive) {
            mat.emissiveIntensity = 0.5 + Math.sin(t * 2 + i * 0.5) * 0.4;
          }
        }
      });
    }

    // Spire beacon blink
    if (spireRef.current) {
      const mat = spireRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 1.5 + Math.sin(t * 4) * 1.2;
    }
  });

  return (
    <group>
      {/* Grand plaza with accent lighting */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[w + 2.5, 0.1, w + 2.5]} />
        <meshStandardMaterial color="#222222" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Polished dark granite base */}
      <mesh position={[0, 0.35, 0]} receiveShadow castShadow>
        <boxGeometry args={[w + 0.8, 0.6, w + 0.8]} />
        <meshStandardMaterial color="#111122" roughness={0.1} metalness={0.7} />
      </mesh>

      {/* Grand lobby - triple height glass */}
      <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[w + 0.4, 2.5, w + 0.4]} />
        <meshPhysicalMaterial
          color="#0a0a1a"
          roughness={0.03}
          metalness={0.3}
          transmission={0.45}
          thickness={0.3}
          transparent
          opacity={0.88}
          envMapIntensity={1.8}
        />
      </mesh>

      {/* Lobby interior lights */}
      <pointLight position={[0, 1.5, w / 2 + 0.3]} intensity={4} color="#ffddaa" distance={6} decay={2} />
      <pointLight position={[w / 2 + 0.3, 1.5, 0]} intensity={3} color="#ffddaa" distance={5} decay={2} />

      {/* Three setback sections */}
      {sections.map((sec, si) => {
        const yCenter = sec.yBase + sec.h / 2;
        const secFloorH = sec.h / Math.max(1, sec.floors);
        const winsPerSide = Math.max(4, Math.floor(sec.w / 0.4));

        return (
          <group key={`section-${si}`}>
            {/* Main curtain wall glass body */}
            <mesh position={[0, yCenter, 0]} castShadow receiveShadow>
              <boxGeometry args={[sec.w, sec.h, sec.w]} />
              <meshPhysicalMaterial
                color="#1a2a4a"
                roughness={0.02}
                metalness={0.4}
                transmission={0.3}
                thickness={0.5}
                transparent
                opacity={0.9}
                envMapIntensity={2.5}
              />
            </mesh>

            {/* Chrome corner pillars */}
            {[
              [sec.w / 2, 0, sec.w / 2],
              [-sec.w / 2, 0, sec.w / 2],
              [sec.w / 2, 0, -sec.w / 2],
              [-sec.w / 2, 0, -sec.w / 2],
            ].map((pos, j) => (
              <mesh key={`edge-${si}-${j}`} position={[pos[0], yCenter, pos[2]]}>
                <boxGeometry args={[0.1, sec.h + 0.1, 0.1]} />
                <meshStandardMaterial color="#c0c8d0" roughness={0.08} metalness={0.9} />
              </mesh>
            ))}

            {/* Floor bands */}
            {Array.from({ length: sec.floors }).map((_, fi) => (
              <mesh key={`fband-${si}-${fi}`} position={[0, sec.yBase + (fi + 1) * secFloorH, 0]}>
                <boxGeometry args={[sec.w + 0.02, 0.03, sec.w + 0.02]} />
                <meshStandardMaterial color="#667788" roughness={0.2} metalness={0.6} />
              </mesh>
            ))}

            {/* Windows per section */}
            {Array.from({ length: sec.floors }).map((_, fi) => {
              const wy = sec.yBase + fi * secFloorH + secFloorH * 0.5;
              return Array.from({ length: winsPerSide }).map((_, wi) => {
                const offset = (wi - (winsPerSide - 1) / 2) * 0.38;
                const dataIdx = (si * 100 + fi * winsPerSide + wi) % windowData.length;
                const d = windowData[dataIdx];
                const litCol = d.warmth > 0.5 ? "#ffeedd" : "#ddeeff";
                const emCol = d.warmth > 0.5 ? "#ffbb55" : "#88aaff";
                return (
                  <group key={`w-${si}-${fi}-${wi}`}>
                    <mesh position={[offset, wy, sec.w / 2 + 0.006]}>
                      <planeGeometry args={[0.28, secFloorH * 0.7]} />
                      <meshStandardMaterial
                        color={d.lit ? litCol : "#0a0a1a"}
                        emissive={d.lit ? emCol : "#000"}
                        emissiveIntensity={d.lit ? 0.4 : 0}
                        roughness={0.05}
                        metalness={0.3}
                      />
                    </mesh>
                    <mesh position={[offset, wy, -(sec.w / 2 + 0.006)]} rotation={[0, Math.PI, 0]}>
                      <planeGeometry args={[0.28, secFloorH * 0.7]} />
                      <meshStandardMaterial
                        color={d.lit ? litCol : "#0a0a1a"}
                        emissive={d.lit ? emCol : "#000"}
                        emissiveIntensity={d.lit ? 0.4 : 0}
                        roughness={0.05}
                        metalness={0.3}
                      />
                    </mesh>
                    <mesh position={[sec.w / 2 + 0.006, wy, offset]} rotation={[0, Math.PI / 2, 0]}>
                      <planeGeometry args={[0.28, secFloorH * 0.7]} />
                      <meshStandardMaterial
                        color={d.lit ? litCol : "#0a0a1a"}
                        emissive={d.lit ? emCol : "#000"}
                        emissiveIntensity={d.lit ? 0.4 : 0}
                        roughness={0.05}
                        metalness={0.3}
                      />
                    </mesh>
                    <mesh position={[-(sec.w / 2 + 0.006), wy, offset]} rotation={[0, -Math.PI / 2, 0]}>
                      <planeGeometry args={[0.28, secFloorH * 0.7]} />
                      <meshStandardMaterial
                        color={d.lit ? litCol : "#0a0a1a"}
                        emissive={d.lit ? emCol : "#000"}
                        emissiveIntensity={d.lit ? 0.4 : 0}
                        roughness={0.05}
                        metalness={0.3}
                      />
                    </mesh>
                  </group>
                );
              });
            })}

            {/* Setback terrace ledge */}
            {si < sections.length - 1 && (
              <mesh position={[0, sec.yBase + sec.h + 0.05, 0]}>
                <boxGeometry args={[sec.w + 0.15, 0.1, sec.w + 0.15]} />
                <meshStandardMaterial color="#aabbcc" roughness={0.15} metalness={0.8} />
              </mesh>
            )}
          </group>
        );
      })}

      {/* Crown structure with animated lights */}
      <group ref={crownRef}>
        {/* Crown base */}
        <mesh position={[0, 3 + h + 0.3, 0]} castShadow>
          <boxGeometry args={[w * 0.55, 0.6, w * 0.55]} />
          <meshStandardMaterial color="#1a1a2a" roughness={0.15} metalness={0.7} />
        </mesh>
        {/* Crown accent lights - 4 sides */}
        {[
          [0, 0, w * 0.55 / 2 + 0.01],
          [0, 0, -(w * 0.55 / 2 + 0.01)],
          [w * 0.55 / 2 + 0.01, 0, 0],
          [-(w * 0.55 / 2 + 0.01), 0, 0],
        ].map((pos, i) => (
          <mesh key={`crown-light-${i}`} position={[pos[0], 3 + h + 0.3, pos[2]]}>
            <planeGeometry args={[w * 0.3, 0.4]} />
            <meshStandardMaterial
              color="#ffddaa"
              emissive="#ffaa44"
              emissiveIntensity={0.6}
              roughness={0.1}
              metalness={0.5}
            />
          </mesh>
        ))}
        {/* Crown top decorative element */}
        <mesh position={[0, 3 + h + 0.7, 0]}>
          <boxGeometry args={[w * 0.35, 0.2, w * 0.35]} />
          <meshStandardMaterial color="#c0c8d0" roughness={0.08} metalness={0.9} />
        </mesh>
      </group>

      {/* Antenna spire with blinking beacon */}
      {params.hasAntenna && (
        <group position={[0, 3 + h + 0.8, 0]}>
          {/* Main spire shaft */}
          <mesh castShadow>
            <cylinderGeometry args={[0.02, 0.08, h * 0.15, 8]} />
            <meshStandardMaterial color="#e0e0e0" roughness={0.08} metalness={0.95} />
          </mesh>
          {/* Cross-arms */}
          <mesh position={[0, h * 0.08, 0]}>
            <boxGeometry args={[0.6, 0.02, 0.02]} />
            <meshStandardMaterial color="#d0d0d0" roughness={0.1} metalness={0.9} />
          </mesh>
          {/* Beacon light */}
          <mesh ref={spireRef} position={[0, h * 0.075 + 0.1, 0]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color="#ff2222" emissive="#ff0000" emissiveIntensity={2} />
          </mesh>
        </group>
      )}

      {/* Observation deck accent glow */}
      <pointLight
        position={[0, 3 + h * 0.85, w / 2 + 0.5]}
        intensity={2}
        color="#aaccff"
        distance={5}
        decay={2}
      />

      {/* Base accent uplights */}
      <pointLight position={[w / 2, 0.3, w / 2]} intensity={1.5} color="#4466aa" distance={4} decay={2} />
      <pointLight position={[-w / 2, 0.3, -w / 2]} intensity={1.5} color="#4466aa" distance={4} decay={2} />
    </group>
  );
}

"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { TowerParams } from "@/types/tower";

export default function FuturisticTower({ params }: { params: TowerParams }) {
  const ringsRef = useRef<THREE.Group>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const orbRef = useRef<THREE.Mesh>(null);
  const panelRefs = useRef<THREE.MeshStandardMaterial[]>([]);
  const h = Math.max(16, params.height);
  const w = params.width;
  const floors = Math.max(15, params.floors);

  // Floating ring config
  const rings = useMemo(() =>
    Array.from({ length: 6 }).map((_, i) => ({
      y: h * 0.15 + (i * h * 0.7) / 5,
      radius: w * 0.45 + i * 0.1,
      speed: 0.2 + i * 0.08,
      phase: i * 1.2,
    })),
    [h, w]
  );

  // Holographic panel data
  const panelData = useMemo(() =>
    Array.from({ length: floors * 4 }).map(() => ({
      hue: Math.random(),
      speed: 0.5 + Math.random() * 2,
      phase: Math.random() * Math.PI * 2,
    })),
    [floors]
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Rotate floating rings with wobble
    if (ringsRef.current) {
      ringsRef.current.children.forEach((ring, i) => {
        if (i < rings.length) {
          ring.rotation.y = t * rings[i].speed;
          ring.rotation.x = Math.sin(t * 0.3 + rings[i].phase) * 0.15;
          ring.rotation.z = Math.cos(t * 0.2 + rings[i].phase) * 0.08;
          ring.position.y = rings[i].y + Math.sin(t * 0.8 + rings[i].phase) * 0.4 + 2;
        }
      });
    }

    // Pulse energy beam
    if (beamRef.current) {
      const mat = beamRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 2 + Math.sin(t * 3) * 1;
      mat.opacity = 0.25 + Math.sin(t * 2) * 0.1;
      beamRef.current.rotation.y = t * 0.5;
    }

    // Breathe core
    if (coreRef.current) {
      const scale = 1 + Math.sin(t * 1.5) * 0.03;
      coreRef.current.scale.set(scale, 1, scale);
    }

    // Orbit crown orb
    if (orbRef.current) {
      orbRef.current.position.x = Math.cos(t * 0.8) * 0.3;
      orbRef.current.position.z = Math.sin(t * 0.8) * 0.3;
      orbRef.current.position.y = h + 3.5 + Math.sin(t * 1.5) * 0.2;
    }

    // Animate holographic panels
    panelRefs.current.forEach((mat, i) => {
      if (mat && panelData[i]) {
        const pulse = Math.sin(t * panelData[i].speed + panelData[i].phase);
        mat.emissiveIntensity = 0.4 + pulse * 0.3;
        mat.opacity = 0.7 + pulse * 0.15;
      }
    });
  });

  panelRefs.current = [];

  const floorH = h / floors;

  return (
    <group>
      {/* Hovering hexagonal platform */}
      <mesh position={[0, 0.2, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[w * 0.8, w * 0.9, 0.4, 6]} />
        <meshStandardMaterial
          color="#050520"
          roughness={0.05}
          metalness={0.95}
          emissive={params.colorPrimary}
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* Ground energy ring */}
      <mesh position={[0, 0.05, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[w * 0.75, w * 1.0, 6]} />
        <meshStandardMaterial
          color={params.colorPrimary}
          emissive={params.colorPrimary}
          emissiveIntensity={1.5}
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Secondary outer ring */}
      <mesh position={[0, 0.03, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[w * 1.0, w * 1.1, 6]} />
        <meshStandardMaterial
          color={params.colorSecondary}
          emissive={params.colorSecondary}
          emissiveIntensity={0.8}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Stepped base with glow seams */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[w * 0.65, w * 0.75, 1.2, 6]} />
        <meshStandardMaterial color="#0a0a30" roughness={0.08} metalness={0.9} />
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[w * 0.66, w * 0.76, 0.05, 6]} />
        <meshStandardMaterial
          color={params.colorPrimary}
          emissive={params.colorPrimary}
          emissiveIntensity={1}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Main twisted tower body - tapered hexagonal prism */}
      <mesh ref={coreRef} position={[0, h / 2 + 1.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[w * 0.32, w * 0.55, h, 6, 1, false]} />
        <meshPhysicalMaterial
          color="#0a0a2e"
          roughness={0.03}
          metalness={0.85}
          emissive={params.colorPrimary}
          emissiveIntensity={0.2}
          envMapIntensity={3}
        />
      </mesh>

      {/* Inner emissive energy core (visible through gaps) */}
      <mesh position={[0, h / 2 + 1.5, 0]}>
        <cylinderGeometry args={[w * 0.22, w * 0.4, h * 0.95, 6]} />
        <meshStandardMaterial
          color={params.colorSecondary}
          emissive={params.colorSecondary}
          emissiveIntensity={0.7}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Holographic floor panels on all sides */}
      {Array.from({ length: floors }).map((_, fi) => {
        const y = 1.5 + fi * floorH + floorH * 0.5;
        // Place panels on 4 sides (simplified from hex)
        return [0, Math.PI / 2, Math.PI, -Math.PI / 2].map((angle, si) => {
          const radius = w * 0.55 - (fi / floors) * (w * 0.55 - w * 0.32);
          const px = Math.sin(angle) * (radius + 0.01);
          const pz = Math.cos(angle) * (radius + 0.01);
          const idx = fi * 4 + si;
          const d = panelData[idx % panelData.length];
          const hueShift = d.hue;
          const panelColor = hueShift > 0.5 ? params.colorPrimary : params.colorSecondary;
          return (
            <mesh
              key={`panel-${fi}-${si}`}
              position={[px, y, pz]}
              rotation={[0, angle + Math.PI, 0]}
            >
              <planeGeometry args={[w * 0.3, floorH * 0.65]} />
              <meshStandardMaterial
                ref={(ref) => { if (ref) panelRefs.current[idx] = ref; }}
                color={panelColor}
                emissive={panelColor}
                emissiveIntensity={0.5}
                transparent
                opacity={0.75}
                roughness={0.05}
                metalness={0.5}
                side={THREE.DoubleSide}
              />
            </mesh>
          );
        });
      })}

      {/* Horizontal glow bands at intervals */}
      {Array.from({ length: Math.floor(floors / 3) }).map((_, i) => {
        const y = 1.5 + (i + 1) * floorH * 3;
        const r = w * 0.55 - ((i * 3) / floors) * (w * 0.55 - w * 0.32);
        return (
          <mesh key={`gband-${i}`} position={[0, y, 0]}>
            <torusGeometry args={[r + 0.02, 0.02, 6, 6]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? params.colorPrimary : params.colorSecondary}
              emissive={i % 2 === 0 ? params.colorPrimary : params.colorSecondary}
              emissiveIntensity={1.2}
            />
          </mesh>
        );
      })}

      {/* Floating rings */}
      <group ref={ringsRef}>
        {rings.map((ring, i) => (
          <mesh key={`ring-${i}`} position={[0, ring.y + 2, 0]}>
            <torusGeometry args={[ring.radius, 0.04, 6, 6]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? params.colorPrimary : params.colorSecondary}
              emissive={i % 2 === 0 ? params.colorPrimary : params.colorSecondary}
              emissiveIntensity={1.8}
              roughness={0.05}
              metalness={0.95}
            />
          </mesh>
        ))}
      </group>

      {/* Crown structure */}
      <mesh position={[0, h + 1.8, 0]} castShadow>
        <cylinderGeometry args={[w * 0.25, w * 0.35, 0.8, 6]} />
        <meshStandardMaterial
          color="#0a0a2e"
          roughness={0.05}
          metalness={0.9}
          emissive={params.colorSecondary}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Crown accent ring */}
      <mesh position={[0, h + 2.3, 0]}>
        <torusGeometry args={[w * 0.3, 0.03, 8, 6]} />
        <meshStandardMaterial
          color={params.colorSecondary}
          emissive={params.colorSecondary}
          emissiveIntensity={2}
        />
      </mesh>

      {/* Floating crown orb */}
      <mesh ref={orbRef} position={[0, h + 3.5, 0]}>
        <sphereGeometry args={[w * 0.15, 32, 32]} />
        <meshPhysicalMaterial
          color={params.colorSecondary}
          emissive={params.colorSecondary}
          emissiveIntensity={2.5}
          roughness={0.0}
          metalness={1}
          envMapIntensity={4}
        />
      </mesh>

      {/* Energy beam shooting upward */}
      <mesh ref={beamRef} position={[0, h + 5, 0]}>
        <cylinderGeometry args={[0.03, 0.1, 5, 6]} />
        <meshStandardMaterial
          color={params.colorPrimary}
          emissive={params.colorPrimary}
          emissiveIntensity={2.5}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Multi-point glow lighting */}
      <pointLight
        position={[0, h * 0.3 + 1.5, 0]}
        intensity={params.glowIntensity * 4}
        color={params.colorPrimary}
        distance={w * 8}
        decay={2}
      />
      <pointLight
        position={[0, h + 3, 0]}
        intensity={params.glowIntensity * 3}
        color={params.colorSecondary}
        distance={w * 6}
        decay={2}
      />
      <pointLight
        position={[0, 0.5, 0]}
        intensity={3}
        color={params.colorPrimary}
        distance={w * 5}
        decay={2}
      />
      {/* Accent side lights */}
      <pointLight position={[w, h * 0.5, 0]} intensity={1.5} color={params.colorSecondary} distance={4} decay={2} />
      <pointLight position={[-w, h * 0.5, 0]} intensity={1.5} color={params.colorSecondary} distance={4} decay={2} />
    </group>
  );
}

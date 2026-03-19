"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AchievementEffect } from "@/types/tower";

interface TowerEffectsProps {
  achievements: AchievementEffect[];
  towerHeight: number;
  towerWidth: number;
}

export default function TowerEffects({
  achievements,
  towerHeight,
  towerWidth,
}: TowerEffectsProps) {
  return (
    <group>
      {achievements.map((achievement, index) => (
        <AchievementVisual
          key={achievement.type}
          achievement={achievement}
          towerHeight={towerHeight}
          towerWidth={towerWidth}
          index={index}
        />
      ))}
    </group>
  );
}

function AchievementVisual({
  achievement,
  towerHeight,
  towerWidth,
  index,
}: {
  achievement: AchievementEffect;
  towerHeight: number;
  towerWidth: number;
  index: number;
}) {
  switch (achievement.effect) {
    case "frost":
      return <FrostEffect towerHeight={towerHeight} towerWidth={towerWidth} color={achievement.color} />;
    case "fire":
      return <FireEffect towerHeight={towerHeight} color={achievement.color} />;
    case "stars":
      return <StarsEffect towerHeight={towerHeight} towerWidth={towerWidth} color={achievement.color} />;
    case "nebula":
      return <NebulaEffect towerHeight={towerHeight} towerWidth={towerWidth} color={achievement.color} />;
    case "lightning":
      return <LightningEffect towerHeight={towerHeight} color={achievement.color} />;
    case "orbs":
    case "shark":
      return <OrbsEffect towerHeight={towerHeight} towerWidth={towerWidth} index={index} color={achievement.color} />;
    default:
      return null;
  }
}

function useParticleGeometry(count: number, initFn: (pos: Float32Array) => void, deps: unknown[]) {
  return useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    initFn(positions);
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geometry;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// Frost/Ice particles around base
function FrostEffect({ towerHeight, towerWidth, color }: { towerHeight: number; towerWidth: number; color: string }) {
  const particlesRef = useRef<THREE.Points>(null);
  const count = 100;

  const geometry = useParticleGeometry(count, (pos) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = towerWidth * 0.8 + Math.random() * towerWidth * 0.5;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = Math.random() * towerHeight * 0.3;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
    }
  }, [towerHeight, towerWidth]);

  useFrame((state) => {
    if (!particlesRef.current) return;
    particlesRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    const posArr = particlesRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      posArr[i * 3 + 1] += Math.sin(state.clock.elapsedTime + i) * 0.002;
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={particlesRef} geometry={geometry}>
      <pointsMaterial size={0.15} color={color} transparent opacity={0.6} sizeAttenuation blending={THREE.AdditiveBlending} />
    </points>
  );
}

// Fire particles at top
function FireEffect({ towerHeight, color }: { towerHeight: number; color: string }) {
  const particlesRef = useRef<THREE.Points>(null);
  const count = 60;

  const geometry = useParticleGeometry(count, (pos) => {
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 1.5;
      pos[i * 3 + 1] = towerHeight + Math.random() * 3;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
    }
  }, [towerHeight]);

  useFrame(() => {
    if (!particlesRef.current) return;
    const posArr = particlesRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      posArr[i * 3 + 1] += 0.02;
      if (posArr[i * 3 + 1] > towerHeight + 5) {
        posArr[i * 3 + 1] = towerHeight;
        posArr[i * 3] = (Math.random() - 0.5) * 1.5;
        posArr[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
      }
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={particlesRef} geometry={geometry}>
      <pointsMaterial size={0.2} color={color} transparent opacity={0.8} sizeAttenuation blending={THREE.AdditiveBlending} />
    </points>
  );
}

// Rising star particles
function StarsEffect({ towerHeight, towerWidth, color }: { towerHeight: number; towerWidth: number; color: string }) {
  const particlesRef = useRef<THREE.Points>(null);
  const count = 40;

  const geometry = useParticleGeometry(count, (pos) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = towerWidth * 0.5 + Math.random() * towerWidth;
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = Math.random() * towerHeight * 1.5;
      pos[i * 3 + 2] = Math.sin(angle) * r;
    }
  }, [towerHeight, towerWidth]);

  useFrame(() => {
    if (!particlesRef.current) return;
    const posArr = particlesRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      posArr[i * 3 + 1] += 0.015;
      if (posArr[i * 3 + 1] > towerHeight * 1.8) {
        posArr[i * 3 + 1] = 0;
      }
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={particlesRef} geometry={geometry}>
      <pointsMaterial size={0.25} color={color} transparent opacity={0.9} sizeAttenuation blending={THREE.AdditiveBlending} />
    </points>
  );
}

// Purple nebula aura
function NebulaEffect({ towerHeight, towerWidth, color }: { towerHeight: number; towerWidth: number; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const scale = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    meshRef.current.scale.set(scale, scale, scale);
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
  });

  return (
    <mesh ref={meshRef} position={[0, towerHeight * 0.5, 0]}>
      <sphereGeometry args={[towerWidth * 1.5, 16, 16]} />
      <meshBasicMaterial color={color} transparent opacity={0.08} side={THREE.DoubleSide} />
    </mesh>
  );
}

// Lightning bolt at top
function LightningEffect({ towerHeight, color }: { towerHeight: number; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.visible = Math.sin(state.clock.elapsedTime * 8) > 0.3;
  });

  return (
    <mesh ref={meshRef} position={[0, towerHeight + 2, 0]}>
      <coneGeometry args={[0.15, 3, 4]} />
      <meshBasicMaterial color={color} transparent opacity={0.9} />
    </mesh>
  );
}

// Orbiting orbs
function OrbsEffect({ towerHeight, towerWidth, index, color }: { towerHeight: number; towerWidth: number; index: number; color: string }) {
  const orb1Ref = useRef<THREE.Mesh>(null);
  const orb2Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime + index * Math.PI;
    const radius = towerWidth * 1.2;
    const y = towerHeight * 0.6;

    if (orb1Ref.current) {
      orb1Ref.current.position.x = Math.cos(t) * radius;
      orb1Ref.current.position.y = y + Math.sin(t * 2) * 0.5;
      orb1Ref.current.position.z = Math.sin(t) * radius;
    }
    if (orb2Ref.current) {
      orb2Ref.current.position.x = Math.cos(t + Math.PI) * radius;
      orb2Ref.current.position.y = y + Math.sin(t * 2 + Math.PI) * 0.5;
      orb2Ref.current.position.z = Math.sin(t + Math.PI) * radius;
    }
  });

  return (
    <>
      <mesh ref={orb1Ref}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
      </mesh>
      <mesh ref={orb2Ref}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
      </mesh>
    </>
  );
}

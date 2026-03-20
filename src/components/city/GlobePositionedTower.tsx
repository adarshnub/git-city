"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface GlobePositionedTowerProps {
  flatPosition: [number, number, number];
  globePosition: [number, number, number];
  children: React.ReactNode;
}

export default function GlobePositionedTower({
  flatPosition,
  globePosition,
  children,
}: GlobePositionedTowerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (!groupRef.current) return;
    const dist = camera.position.length();
    // Blend: at dist < 35 use flat (ground-level), at dist > 65 use globe surface
    // This matches CityLandscape fade range (35–65)
    const t = THREE.MathUtils.clamp((dist - 35) / 30, 0, 1);

    groupRef.current.position.x = THREE.MathUtils.lerp(flatPosition[0], globePosition[0], t);
    groupRef.current.position.y = THREE.MathUtils.lerp(flatPosition[1], globePosition[1], t);
    groupRef.current.position.z = THREE.MathUtils.lerp(flatPosition[2], globePosition[2], t);
  });

  return <group ref={groupRef}>{children}</group>;
}

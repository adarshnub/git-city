"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface TowerWindowsProps {
  width: number;
  height: number;
  depth: number;
  rows: number;
  cols: number;
  yOffset?: number;
  color?: string;
  emissiveColor?: string;
  animated?: boolean;
}

// Creates a grid of glowing windows on all 4 sides of a rectangular tower
export default function TowerWindows({
  width,
  height,
  depth,
  rows,
  cols,
  yOffset = 0,
  color = "#ffeedd",
  emissiveColor = "#ffcc66",
  animated = true,
}: TowerWindowsProps) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRefs = useRef<THREE.MeshStandardMaterial[]>([]);

  // Pre-calculate which windows are "lit" and their flicker timing
  const windowData = useMemo(() => {
    const data: { lit: boolean; flickerSpeed: number; flickerOffset: number }[] = [];
    const total = rows * cols * 4; // 4 sides
    for (let i = 0; i < total; i++) {
      data.push({
        lit: Math.random() > 0.2, // 80% of windows are lit
        flickerSpeed: 0.5 + Math.random() * 2,
        flickerOffset: Math.random() * Math.PI * 2,
      });
    }
    return data;
  }, [rows, cols]);

  // Animate window brightness
  useFrame((state) => {
    if (!animated) return;
    materialRefs.current.forEach((mat, i) => {
      if (!mat || !windowData[i]?.lit) return;
      const flicker = Math.sin(state.clock.elapsedTime * windowData[i].flickerSpeed + windowData[i].flickerOffset);
      mat.emissiveIntensity = 0.3 + flicker * 0.15;
    });
  });

  const windowWidth = (width * 0.85) / cols;
  const windowHeight = (height * 0.8) / rows;
  const gapX = windowWidth * 0.15;
  const gapY = windowHeight * 0.1;
  const actualWinW = windowWidth - gapX;
  const actualWinH = windowHeight - gapY;

  materialRefs.current = [];

  const sides: { pos: [number, number, number]; rot: [number, number, number]; w: number; d: number }[] = [
    { pos: [0, 0, depth / 2 + 0.01], rot: [0, 0, 0], w: width, d: depth },
    { pos: [0, 0, -(depth / 2 + 0.01)], rot: [0, Math.PI, 0], w: width, d: depth },
    { pos: [width / 2 + 0.01, 0, 0], rot: [0, Math.PI / 2, 0], w: depth, d: width },
    { pos: [-(width / 2 + 0.01), 0, 0], rot: [0, -Math.PI / 2, 0], w: depth, d: width },
  ];

  let globalIdx = 0;

  return (
    <group ref={groupRef}>
      {sides.map((side, sideIdx) => {
        const sideWidth = sideIdx < 2 ? width : depth;
        const sideCols = Math.max(1, Math.floor(cols * (sideWidth / width)));
        const sideWinWidth = (sideWidth * 0.85) / sideCols;
        const sideActualW = sideWinWidth - gapX;

        return Array.from({ length: rows }).map((_, row) => {
          return Array.from({ length: sideCols }).map((_, col) => {
            const idx = globalIdx++;
            const data = windowData[idx % windowData.length];
            const x = (col - (sideCols - 1) / 2) * sideWinWidth;
            const y = yOffset + row * windowHeight + windowHeight / 2 + height * 0.1;

            return (
              <mesh
                key={`${sideIdx}-${row}-${col}`}
                position={[
                  side.pos[0] + (sideIdx >= 2 ? 0 : x),
                  side.pos[1] + y,
                  side.pos[2] + (sideIdx >= 2 ? x : 0),
                ]}
                rotation={side.rot}
              >
                <planeGeometry args={[sideActualW, actualWinH]} />
                <meshStandardMaterial
                  ref={(ref) => {
                    if (ref) materialRefs.current[idx] = ref;
                  }}
                  color={data.lit ? color : "#111122"}
                  emissive={data.lit ? emissiveColor : "#000000"}
                  emissiveIntensity={data.lit ? 0.4 : 0}
                  roughness={0.1}
                  metalness={0.3}
                  transparent
                  opacity={0.95}
                />
              </mesh>
            );
          });
        });
      })}
    </group>
  );
}

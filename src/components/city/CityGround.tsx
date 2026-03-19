"use client";

import { useRef, useMemo } from "react";
import * as THREE from "three";

export default function CityGround() {
  const meshRef = useRef<THREE.Mesh>(null);

  // Create a grid texture procedurally
  const gridTexture = useMemo(() => {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    // Dark ground
    ctx.fillStyle = "#0a0e1a";
    ctx.fillRect(0, 0, size, size);

    // Grid lines
    ctx.strokeStyle = "#1a2040";
    ctx.lineWidth = 1;
    const gridSize = size / 16;

    for (let i = 0; i <= 16; i++) {
      const pos = i * gridSize;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(size, pos);
      ctx.stroke();
    }

    // Road lines (thicker, slightly brighter)
    ctx.strokeStyle = "#252e50";
    ctx.lineWidth = 3;
    for (let i = 0; i <= 4; i++) {
      const pos = i * (size / 4);
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(size, pos);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    return texture;
  }, []);

  return (
    <mesh
      ref={meshRef}
      rotation-x={-Math.PI / 2}
      position={[0, -0.01, 0]}
      receiveShadow
    >
      <planeGeometry args={[200, 200]} />
      <meshStandardMaterial
        map={gridTexture}
        roughness={0.95}
        metalness={0.05}
        color="#0d1117"
      />
    </mesh>
  );
}

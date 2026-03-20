"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export default function CityLandscape() {
  const streetLightRefs = useRef<THREE.MeshStandardMaterial[]>([]);
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const groundMatRef = useRef<THREE.MeshStandardMaterial>(null);

  // Circular ground texture with alpha fade at edges
  const groundTexture = useMemo(() => {
    const size = 2048;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    // Fully transparent background (circle will be drawn on top)
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const maxR = size / 2;

    // Circular ground with radial fade
    const baseGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
    baseGrad.addColorStop(0, "rgba(10, 14, 22, 1)");
    baseGrad.addColorStop(0.6, "rgba(10, 14, 22, 0.95)");
    baseGrad.addColorStop(0.8, "rgba(10, 14, 22, 0.5)");
    baseGrad.addColorStop(0.92, "rgba(10, 14, 22, 0.15)");
    baseGrad.addColorStop(1, "rgba(10, 14, 22, 0)");
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, size, size);

    // Subtle noise (only within circle)
    for (let i = 0; i < 4000; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * maxR * 0.85;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      const brightness = Math.random() * 15;
      ctx.fillStyle = `rgba(${brightness}, ${brightness + 5}, ${brightness + 10}, 0.2)`;
      ctx.fillRect(x, y, 2, 2);
    }

    // Grid lines (clipped to circle)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, maxR * 0.85, 0, Math.PI * 2);
    ctx.clip();

    ctx.strokeStyle = "rgba(0, 150, 200, 0.04)";
    ctx.lineWidth = 0.5;
    const gridStep = size / 64;
    for (let i = 0; i <= 64; i++) {
      const pos = i * gridStep;
      ctx.beginPath(); ctx.moveTo(pos, 0); ctx.lineTo(pos, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, pos); ctx.lineTo(size, pos); ctx.stroke();
    }

    ctx.strokeStyle = "rgba(0, 180, 220, 0.07)";
    ctx.lineWidth = 1;
    const majorStep = size / 8;
    for (let i = 0; i <= 8; i++) {
      const pos = i * majorStep;
      ctx.beginPath(); ctx.moveTo(pos, 0); ctx.lineTo(pos, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, pos); ctx.lineTo(size, pos); ctx.stroke();
    }

    // Concentric rings around plaza
    for (let r = 1; r <= 4; r++) {
      ctx.strokeStyle = `rgba(0, 200, 200, ${0.1 - r * 0.02})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r * size * 0.02, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Roads
    const drawRoad = (x1: number, y1: number, x2: number, y2: number, width: number) => {
      ctx.strokeStyle = "rgba(15, 20, 30, 0.9)";
      ctx.lineWidth = width;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

      ctx.strokeStyle = "rgba(0, 200, 255, 0.1)";
      ctx.lineWidth = 1;
      const dx = x2 - x1, dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = (-dy / len) * (width / 2), ny = (dx / len) * (width / 2);
      ctx.beginPath(); ctx.moveTo(x1 + nx, y1 + ny); ctx.lineTo(x2 + nx, y2 + ny); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x1 - nx, y1 - ny); ctx.lineTo(x2 - nx, y2 - ny); ctx.stroke();

      ctx.strokeStyle = "rgba(0, 200, 255, 0.05)";
      ctx.lineWidth = 0.8;
      ctx.setLineDash([12, 18]);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.setLineDash([]);
    };

    const roadW = 26;
    drawRoad(cx, cy - maxR * 0.8, cx, cy + maxR * 0.8, roadW);
    drawRoad(cx - maxR * 0.8, cy, cx + maxR * 0.8, cy, roadW);
    drawRoad(cx - maxR * 0.55, cy - maxR * 0.55, cx + maxR * 0.55, cy + maxR * 0.55, roadW * 0.5);
    drawRoad(cx + maxR * 0.55, cy - maxR * 0.55, cx - maxR * 0.55, cy + maxR * 0.55, roadW * 0.5);

    // Park patches
    [[cx - size * 0.12, cy - size * 0.12, size * 0.06],
     [cx + size * 0.12, cy - size * 0.12, size * 0.05],
     [cx - size * 0.12, cy + size * 0.12, size * 0.055],
     [cx + size * 0.12, cy + size * 0.12, size * 0.065],
    ].forEach(([px, py, pr]) => {
      const g = ctx.createRadialGradient(px, py, 0, px, py, pr);
      g.addColorStop(0, "rgba(0, 50, 25, 0.25)");
      g.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();
    });

    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, []);

  // Street lights along roads (closer to center)
  const streetLights = useMemo(() => {
    const lights: { x: number; z: number }[] = [];
    for (let i = -4; i <= 4; i++) {
      if (Math.abs(i) < 2) continue;
      lights.push({ x: 1.2, z: i * 4 });
      lights.push({ x: -1.2, z: i * 4 });
      lights.push({ x: i * 4, z: 1.2 });
      lights.push({ x: i * 4, z: -1.2 });
    }
    return lights;
  }, []);

  // Trees in park areas (within tighter radius)
  const trees = useMemo(() => {
    const list: { x: number; z: number; height: number; type: number }[] = [];
    const centers = [
      [-6, -6], [6, -6], [-6, 6], [6, 6],
      [-10, 0], [10, 0], [0, -10], [0, 10],
    ];
    centers.forEach(([cx, cz]) => {
      const count = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const d = 1 + Math.random() * 2.5;
        list.push({
          x: cx + Math.cos(a) * d,
          z: cz + Math.sin(a) * d,
          height: 1.5 + Math.random() * 2,
          type: Math.floor(Math.random() * 3),
        });
      }
    });
    return list;
  }, []);

  // Background buildings (within tighter radius ~20)
  const buildings = useMemo(() => {
    const bldgs: { x: number; z: number; w: number; d: number; h: number; color: string }[] = [];
    const positions = [
      [-16, -14], [-18, -6], [-18, 6], [-16, 14],
      [16, -14], [18, -6], [18, 6], [16, 14],
      [-14, -16], [-6, -18], [6, -18], [14, -16],
      [-14, 16], [-6, 18], [6, 18], [14, 16],
    ];
    const colors = ["#0a0e18", "#0c1020", "#0e1225", "#08101c"];
    positions.forEach(([x, z], i) => {
      bldgs.push({
        x: x + (Math.random() - 0.5) * 2,
        z: z + (Math.random() - 0.5) * 2,
        w: 1.2 + Math.random() * 1.5,
        d: 1.2 + Math.random() * 1.5,
        h: 2 + Math.random() * 8,
        color: colors[i % colors.length],
      });
    });
    return bldgs;
  }, []);

  streetLightRefs.current = [];

  // Fade landscape based on camera distance — disappear EARLY
  useFrame(() => {
    if (groupRef.current) {
      const dist = camera.position.length();
      // Start fading at distance 35, fully gone by 65
      const visibility = THREE.MathUtils.clamp(1 - (dist - 35) / 30, 0, 1);
      groupRef.current.visible = visibility > 0.01;

      // Also fade the ground material opacity for smooth transition
      if (groundMatRef.current) {
        groundMatRef.current.opacity = visibility;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Circular ground plane */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, 0]} receiveShadow>
        <circleGeometry args={[40, 64]} />
        <meshStandardMaterial
          ref={groundMatRef}
          map={groundTexture}
          roughness={0.92}
          metalness={0.08}
          transparent
          opacity={1}
          alphaTest={0.01}
        />
      </mesh>

      {/* Plaza glow rings */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]}>
        <ringGeometry args={[3.5, 4, 64]} />
        <meshStandardMaterial
          color="#00ccaa" emissive="#00ccaa" emissiveIntensity={0.8}
          transparent opacity={0.15} side={THREE.DoubleSide}
        />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]}>
        <ringGeometry args={[5, 5.3, 64]} />
        <meshStandardMaterial
          color="#0066aa" emissive="#0088cc" emissiveIntensity={0.6}
          transparent opacity={0.1} side={THREE.DoubleSide}
        />
      </mesh>

      {/* Street lights */}
      {streetLights.map((sl, i) => (
        <group key={`sl-${i}`} position={[sl.x, 0, sl.z]}>
          <mesh position={[0, 1.5, 0]}>
            <cylinderGeometry args={[0.03, 0.04, 3, 6]} />
            <meshStandardMaterial color="#333844" roughness={0.3} metalness={0.7} />
          </mesh>
          <mesh position={[0.3, 2.9, 0]} rotation-z={-0.4}>
            <cylinderGeometry args={[0.02, 0.02, 0.7, 4]} />
            <meshStandardMaterial color="#333844" roughness={0.3} metalness={0.7} />
          </mesh>
          <mesh position={[0.55, 2.85, 0]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial
              ref={(ref) => { if (ref) streetLightRefs.current.push(ref); }}
              color="#ffeedd" emissive="#ffcc88" emissiveIntensity={1.5}
            />
          </mesh>
          <pointLight position={[0.55, 2.8, 0]} intensity={0.8} color="#ffeedd" distance={5} decay={2} />
        </group>
      ))}

      {/* Trees */}
      {trees.map((tree, i) => (
        <group key={`tree-${i}`} position={[tree.x, 0, tree.z]}>
          <mesh position={[0, tree.height * 0.35, 0]}>
            <cylinderGeometry args={[0.05, 0.08, tree.height * 0.7, 5]} />
            <meshStandardMaterial color="#1a2a1a" roughness={0.8} metalness={0.1} />
          </mesh>
          {tree.type === 0 && (
            <mesh position={[0, tree.height * 0.75, 0]}>
              <coneGeometry args={[0.5, tree.height * 0.6, 6]} />
              <meshStandardMaterial color="#0a3520" emissive="#003318" emissiveIntensity={0.15} roughness={0.9} />
            </mesh>
          )}
          {tree.type === 1 && (
            <mesh position={[0, tree.height * 0.8, 0]}>
              <sphereGeometry args={[0.6, 8, 8]} />
              <meshStandardMaterial color="#0a3a20" emissive="#003a18" emissiveIntensity={0.1} roughness={0.9} />
            </mesh>
          )}
          {tree.type === 2 && (
            <mesh position={[0, tree.height * 0.75, 0]}>
              <octahedronGeometry args={[0.5, 0]} />
              <meshStandardMaterial
                color="#0a4040" emissive="#00aa88" emissiveIntensity={0.3}
                transparent opacity={0.7} roughness={0.1} metalness={0.5}
              />
            </mesh>
          )}
        </group>
      ))}

      {/* Background buildings */}
      {buildings.map((bldg, i) => (
        <group key={`bldg-${i}`} position={[bldg.x, bldg.h / 2, bldg.z]}>
          <mesh castShadow>
            <boxGeometry args={[bldg.w, bldg.h, bldg.d]} />
            <meshStandardMaterial color={bldg.color} roughness={0.7} metalness={0.3} />
          </mesh>
          {Array.from({ length: Math.floor(bldg.h / 1.5) }).map((_, wi) => {
            const wy = -bldg.h / 2 + 1 + wi * 1.5;
            const side = wi % 2 === 0;
            return (
              <mesh
                key={`bwin-${wi}`}
                position={[side ? bldg.w / 2 + 0.01 : 0, wy, side ? 0 : bldg.d / 2 + 0.01]}
                rotation={side ? [0, 0, 0] : [0, Math.PI / 2, 0]}
              >
                <planeGeometry args={[0.3, 0.5]} />
                <meshStandardMaterial
                  color={Math.random() > 0.3 ? "#ffeedd" : "#88aaff"}
                  emissive={Math.random() > 0.3 ? "#ffaa44" : "#4466cc"}
                  emissiveIntensity={Math.random() > 0.5 ? 0.4 : 0.1}
                />
              </mesh>
            );
          })}
          <mesh position={[0, bldg.h / 2 + 0.05, 0]}>
            <boxGeometry args={[bldg.w + 0.1, 0.1, bldg.d + 0.1]} />
            <meshStandardMaterial color="#1a1a2a" emissive="#003355" emissiveIntensity={0.2} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

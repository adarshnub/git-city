"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export default function CityLandscape() {
  const streetLightRefs = useRef<THREE.MeshStandardMaterial[]>([]);
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  // Ground texture: dark asphalt + futuristic grid
  const groundTexture = useMemo(() => {
    const size = 2048;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    // Dark concrete base
    ctx.fillStyle = "#0a0e16";
    ctx.fillRect(0, 0, size, size);

    // Subtle noise/grain
    for (let i = 0; i < 5000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const brightness = Math.random() * 15;
      ctx.fillStyle = `rgba(${brightness}, ${brightness + 5}, ${brightness + 10}, 0.3)`;
      ctx.fillRect(x, y, 2, 2);
    }

    // Fine grid lines
    ctx.strokeStyle = "rgba(0, 150, 200, 0.04)";
    ctx.lineWidth = 0.5;
    const gridStep = size / 64;
    for (let i = 0; i <= 64; i++) {
      const pos = i * gridStep;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(size, pos);
      ctx.stroke();
    }

    // Major grid lines (block boundaries)
    ctx.strokeStyle = "rgba(0, 180, 220, 0.08)";
    ctx.lineWidth = 1;
    const majorStep = size / 8;
    for (let i = 0; i <= 8; i++) {
      const pos = i * majorStep;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(size, pos);
      ctx.stroke();
    }

    // Central plaza circle
    const cx = size / 2;
    const cy = size / 2;
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.08);
    gradient.addColorStop(0, "rgba(0, 200, 180, 0.1)");
    gradient.addColorStop(0.5, "rgba(0, 100, 120, 0.05)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Concentric rings around plaza
    for (let r = 1; r <= 4; r++) {
      ctx.strokeStyle = `rgba(0, 200, 200, ${0.12 - r * 0.02})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r * size * 0.02, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Roads: main cross + diagonal
    const drawRoad = (
      x1: number, y1: number, x2: number, y2: number, width: number
    ) => {
      ctx.strokeStyle = "rgba(20, 25, 35, 1)";
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Road edge glow
      ctx.strokeStyle = "rgba(0, 200, 255, 0.12)";
      ctx.lineWidth = 1;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = (-dy / len) * (width / 2);
      const ny = (dx / len) * (width / 2);

      ctx.beginPath();
      ctx.moveTo(x1 + nx, y1 + ny);
      ctx.lineTo(x2 + nx, y2 + ny);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x1 - nx, y1 - ny);
      ctx.lineTo(x2 - nx, y2 - ny);
      ctx.stroke();

      // Center dashes
      ctx.strokeStyle = "rgba(0, 200, 255, 0.06)";
      ctx.lineWidth = 0.8;
      ctx.setLineDash([12, 18]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const roadW = 28;
    // N-S road
    drawRoad(cx, 0, cx, size, roadW);
    // E-W road
    drawRoad(0, cy, size, cy, roadW);
    // Diagonals
    drawRoad(cx - size * 0.35, cy - size * 0.35, cx + size * 0.35, cy + size * 0.35, roadW * 0.6);
    drawRoad(cx + size * 0.35, cy - size * 0.35, cx - size * 0.35, cy + size * 0.35, roadW * 0.6);

    // Green park patches between roads
    const parkAreas: [number, number, number][] = [
      [cx - size * 0.14, cy - size * 0.14, size * 0.08],
      [cx + size * 0.14, cy - size * 0.14, size * 0.06],
      [cx - size * 0.14, cy + size * 0.14, size * 0.07],
      [cx + size * 0.14, cy + size * 0.14, size * 0.09],
    ];
    parkAreas.forEach(([px, py, pr]) => {
      const parkGrad = ctx.createRadialGradient(px, py, 0, px, py, pr);
      parkGrad.addColorStop(0, "rgba(0, 60, 30, 0.3)");
      parkGrad.addColorStop(0.7, "rgba(0, 40, 20, 0.15)");
      parkGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = parkGrad;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }, []);

  // Street light positions along roads
  const streetLights = useMemo(() => {
    const lights: { x: number; z: number; rot: number }[] = [];
    // Along N-S road
    for (let i = -5; i <= 5; i++) {
      if (Math.abs(i) < 2) continue; // Skip near center
      lights.push({ x: 1.2, z: i * 5, rot: 0 });
      lights.push({ x: -1.2, z: i * 5, rot: Math.PI });
    }
    // Along E-W road
    for (let i = -5; i <= 5; i++) {
      if (Math.abs(i) < 2) continue;
      lights.push({ x: i * 5, z: 1.2, rot: Math.PI / 2 });
      lights.push({ x: i * 5, z: -1.2, rot: -Math.PI / 2 });
    }
    return lights;
  }, []);

  // Trees scattered in park areas
  const trees = useMemo(() => {
    const treeList: { x: number; z: number; height: number; type: number }[] = [];
    const parkCenters = [
      [-7, -7], [7, -7], [-7, 7], [7, 7],
      [-12, 0], [12, 0], [0, -12], [0, 12],
      [-15, -10], [15, 10], [-10, 15], [10, -15],
    ];

    parkCenters.forEach(([cx, cz]) => {
      const count = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 1 + Math.random() * 3;
        treeList.push({
          x: cx + Math.cos(angle) * dist,
          z: cz + Math.sin(angle) * dist,
          height: 1.5 + Math.random() * 2,
          type: Math.floor(Math.random() * 3),
        });
      }
    });
    return treeList;
  }, []);

  // Background buildings
  const buildings = useMemo(() => {
    const bldgs: { x: number; z: number; w: number; d: number; h: number; color: string }[] = [];
    const positions = [
      [-20, -18], [-22, -10], [-25, 0], [-22, 10], [-20, 18],
      [20, -18], [22, -10], [25, 0], [22, 10], [20, 18],
      [-18, -22], [-10, -25], [0, -25], [10, -25], [18, -22],
      [-18, 22], [-10, 25], [0, 25], [10, 25], [18, 22],
      [-28, -15], [28, 15], [-15, -28], [15, 28],
      [-30, 5], [30, -5], [5, -30], [-5, 30],
    ];
    const colors = ["#0a0e18", "#0c1020", "#0e1225", "#08101c", "#0b0f1e"];

    positions.forEach(([x, z], i) => {
      bldgs.push({
        x: x + (Math.random() - 0.5) * 3,
        z: z + (Math.random() - 0.5) * 3,
        w: 1.5 + Math.random() * 2,
        d: 1.5 + Math.random() * 2,
        h: 3 + Math.random() * 12,
        color: colors[i % colors.length],
      });
    });
    return bldgs;
  }, []);

  // Animate street light flicker
  streetLightRefs.current = [];
  useFrame(() => {
    // Fade landscape based on camera distance
    if (groupRef.current) {
      const dist = camera.position.length();
      const opacity = THREE.MathUtils.clamp(1 - (dist - 80) / 60, 0, 1);
      groupRef.current.visible = opacity > 0.01;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main ground plane */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial
          map={groundTexture}
          roughness={0.92}
          metalness={0.08}
          color="#0d1117"
        />
      </mesh>

      {/* Circular plaza glow ring */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]}>
        <ringGeometry args={[3.5, 4, 64]} />
        <meshStandardMaterial
          color="#00ccaa"
          emissive="#00ccaa"
          emissiveIntensity={0.8}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]}>
        <ringGeometry args={[5, 5.3, 64]} />
        <meshStandardMaterial
          color="#0066aa"
          emissive="#0088cc"
          emissiveIntensity={0.6}
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Street lights */}
      {streetLights.map((sl, i) => (
        <group key={`sl-${i}`} position={[sl.x, 0, sl.z]}>
          {/* Pole */}
          <mesh position={[0, 1.5, 0]}>
            <cylinderGeometry args={[0.03, 0.04, 3, 6]} />
            <meshStandardMaterial color="#333844" roughness={0.3} metalness={0.7} />
          </mesh>
          {/* Arm */}
          <mesh position={[0.3, 2.9, 0]} rotation-z={-0.4}>
            <cylinderGeometry args={[0.02, 0.02, 0.7, 4]} />
            <meshStandardMaterial color="#333844" roughness={0.3} metalness={0.7} />
          </mesh>
          {/* Light orb */}
          <mesh position={[0.55, 2.85, 0]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial
              ref={(ref) => { if (ref) streetLightRefs.current.push(ref); }}
              color="#ffeedd"
              emissive="#ffcc88"
              emissiveIntensity={1.5}
            />
          </mesh>
          {/* Light cone */}
          <pointLight
            position={[0.55, 2.8, 0]}
            intensity={0.8}
            color="#ffeedd"
            distance={5}
            decay={2}
          />
        </group>
      ))}

      {/* Trees - futuristic style */}
      {trees.map((tree, i) => (
        <group key={`tree-${i}`} position={[tree.x, 0, tree.z]}>
          {/* Trunk */}
          <mesh position={[0, tree.height * 0.35, 0]}>
            <cylinderGeometry args={[0.05, 0.08, tree.height * 0.7, 5]} />
            <meshStandardMaterial color="#1a2a1a" roughness={0.8} metalness={0.1} />
          </mesh>
          {/* Canopy - varies by type */}
          {tree.type === 0 && (
            // Cone tree (cypress style)
            <mesh position={[0, tree.height * 0.75, 0]}>
              <coneGeometry args={[0.5, tree.height * 0.6, 6]} />
              <meshStandardMaterial
                color="#0a3520"
                emissive="#003318"
                emissiveIntensity={0.15}
                roughness={0.9}
              />
            </mesh>
          )}
          {tree.type === 1 && (
            // Sphere tree
            <mesh position={[0, tree.height * 0.8, 0]}>
              <sphereGeometry args={[0.6, 8, 8]} />
              <meshStandardMaterial
                color="#0a3a20"
                emissive="#003a18"
                emissiveIntensity={0.1}
                roughness={0.9}
              />
            </mesh>
          )}
          {tree.type === 2 && (
            // Futuristic crystal tree
            <mesh position={[0, tree.height * 0.75, 0]}>
              <octahedronGeometry args={[0.5, 0]} />
              <meshStandardMaterial
                color="#0a4040"
                emissive="#00aa88"
                emissiveIntensity={0.3}
                transparent
                opacity={0.7}
                roughness={0.1}
                metalness={0.5}
              />
            </mesh>
          )}
        </group>
      ))}

      {/* Background buildings */}
      {buildings.map((bldg, i) => (
        <group key={`bldg-${i}`} position={[bldg.x, bldg.h / 2, bldg.z]}>
          {/* Main body */}
          <mesh castShadow>
            <boxGeometry args={[bldg.w, bldg.h, bldg.d]} />
            <meshStandardMaterial
              color={bldg.color}
              roughness={0.7}
              metalness={0.3}
            />
          </mesh>
          {/* Scattered lit windows */}
          {Array.from({ length: Math.floor(bldg.h / 1.5) }).map((_, wi) => {
            const wy = -bldg.h / 2 + 1 + wi * 1.5;
            const side = wi % 2 === 0;
            return (
              <mesh
                key={`bwin-${wi}`}
                position={[
                  side ? bldg.w / 2 + 0.01 : 0,
                  wy,
                  side ? 0 : bldg.d / 2 + 0.01,
                ]}
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
          {/* Roof accent */}
          <mesh position={[0, bldg.h / 2 + 0.05, 0]}>
            <boxGeometry args={[bldg.w + 0.1, 0.1, bldg.d + 0.1]} />
            <meshStandardMaterial
              color="#1a1a2a"
              emissive="#003355"
              emissiveIntensity={0.2}
            />
          </mesh>
        </group>
      ))}

      {/* Edge fog/fade - ring of dark transparent walls */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.5, 0]}>
        <ringGeometry args={[45, 60, 64]} />
        <meshStandardMaterial
          color="#050810"
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

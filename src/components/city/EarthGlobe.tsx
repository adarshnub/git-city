"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface EarthGlobeProps {
  radius?: number;
  showLocationMarker?: boolean;
}

export default function EarthGlobe({
  radius = 200,
  showLocationMarker = true,
}: EarthGlobeProps) {
  const earthRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const markerRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  // Procedural futuristic Earth texture
  const earthTexture = useMemo(() => {
    const size = 2048;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    // Deep space ocean base
    ctx.fillStyle = "#040c18";
    ctx.fillRect(0, 0, size, size);

    // Latitude lines (glowing)
    for (let lat = 0; lat <= 180; lat += 15) {
      const y = (lat / 180) * size;
      ctx.strokeStyle =
        lat === 90 ? "rgba(0, 200, 255, 0.25)" : "rgba(0, 120, 180, 0.08)";
      ctx.lineWidth = lat === 90 ? 2 : 0.8;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }

    // Longitude lines
    for (let lng = 0; lng < 360; lng += 15) {
      const x = (lng / 360) * size;
      ctx.strokeStyle =
        lng === 0 || lng === 180
          ? "rgba(0, 200, 255, 0.25)"
          : "rgba(0, 120, 180, 0.08)";
      ctx.lineWidth = lng === 0 || lng === 180 ? 2 : 0.8;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }

    // Draw simplified continents as glowing land masses
    const drawContinent = (
      points: [number, number][],
      color: string,
      glowColor: string
    ) => {
      // Convert lat/lng to canvas coords
      const canvasPoints = points.map(([lat, lng]) => ({
        x: ((lng + 180) / 360) * size,
        y: ((90 - lat) / 180) * size,
      }));

      // Glow fill
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y);
      for (let i = 1; i < canvasPoints.length; i++) {
        ctx.lineTo(canvasPoints[i].x, canvasPoints[i].y);
      }
      ctx.closePath();
      ctx.fill();

      // Bright outline
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };

    const landFill = "rgba(0, 60, 50, 0.5)";
    const landGlow = "rgba(0, 220, 170, 0.4)";

    // North America (simplified)
    drawContinent(
      [
        [70, -165], [72, -140], [70, -100], [65, -65], [50, -55],
        [45, -65], [30, -80], [25, -100], [30, -120], [48, -125],
        [55, -130], [60, -140], [65, -168],
      ],
      landFill, landGlow
    );

    // South America
    drawContinent(
      [
        [12, -75], [5, -78], [-5, -80], [-15, -75], [-23, -70],
        [-35, -70], [-50, -70], [-55, -68], [-50, -60], [-35, -55],
        [-20, -40], [-5, -35], [5, -52], [10, -62],
      ],
      landFill, landGlow
    );

    // Europe
    drawContinent(
      [
        [70, -10], [72, 30], [65, 40], [55, 40], [50, 30],
        [45, 25], [37, 25], [36, -5], [40, -10], [45, -5],
        [50, 0], [55, -5], [60, 5], [65, -5],
      ],
      landFill, landGlow
    );

    // Africa
    drawContinent(
      [
        [35, -10], [37, 10], [30, 32], [20, 40], [10, 42],
        [0, 42], [-10, 40], [-25, 35], [-35, 25], [-34, 18],
        [-25, 15], [-10, 12], [0, 10], [5, -5], [15, -17],
        [25, -15], [30, -10],
      ],
      landFill, landGlow
    );

    // Asia (simplified)
    drawContinent(
      [
        [72, 40], [75, 100], [70, 140], [65, 170], [55, 140],
        [45, 130], [35, 120], [25, 120], [20, 105], [10, 105],
        [5, 100], [10, 80], [20, 70], [25, 55], [35, 35],
        [40, 28], [50, 40], [55, 40], [65, 40],
      ],
      landFill, landGlow
    );

    // Australia
    drawContinent(
      [
        [-12, 130], [-15, 140], [-25, 150], [-35, 150],
        [-38, 145], [-35, 135], [-30, 115], [-20, 115],
        [-12, 125],
      ],
      landFill, landGlow
    );

    // Add city light clusters (orange dots on continents)
    const cityLights: [number, number][] = [
      [40, -74], [34, -118], [41, -87], // US cities
      [51, 0], [48, 2], [52, 13], [40, -3], // European
      [35, 139], [31, 121], [37, 127], [22, 114], // Asian
      [28, 77], [19, 73], // Indian
      [-23, -43], [-34, -58], // South American
      [-34, 151], [-37, 144], // Australian
    ];

    cityLights.forEach(([lat, lng]) => {
      const cx = ((lng + 180) / 360) * size;
      const cy = ((90 - lat) / 180) * size;
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 8);
      gradient.addColorStop(0, "rgba(255, 180, 50, 0.8)");
      gradient.addColorStop(0.5, "rgba(255, 150, 30, 0.3)");
      gradient.addColorStop(1, "rgba(255, 120, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(cx - 8, cy - 8, 16, 16);
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    return texture;
  }, []);

  // Atmosphere glow texture
  const atmosphereGradient = useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, size * 0.3,
      size / 2, size / 2, size / 2
    );
    gradient.addColorStop(0, "rgba(0, 150, 255, 0)");
    gradient.addColorStop(0.7, "rgba(0, 150, 255, 0.05)");
    gradient.addColorStop(0.85, "rgba(0, 180, 255, 0.15)");
    gradient.addColorStop(1, "rgba(0, 200, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(canvas);
  }, []);

  // Animate Earth rotation + visibility based on camera distance
  useFrame(() => {
    const dist = camera.position.length();

    // Slow rotation
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.0003;
      // Fade in Earth as camera pulls back
      const mat = earthRef.current.material as THREE.MeshStandardMaterial;
      const opacity = THREE.MathUtils.clamp((dist - 40) / 60, 0, 1);
      mat.opacity = opacity;
      mat.visible = opacity > 0.01;
    }

    // Atmosphere visibility
    if (atmosphereRef.current) {
      const opacity = THREE.MathUtils.clamp((dist - 50) / 80, 0, 0.6);
      const mat = atmosphereRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = opacity;
      mat.visible = opacity > 0.01;
    }

    // Pulse marker beacon
    if (markerRef.current) {
      const pulse = Math.sin(Date.now() * 0.003) * 0.3 + 0.7;
      markerRef.current.scale.setScalar(pulse);
      markerRef.current.visible = dist > 50;
    }
  });

  return (
    <group>
      {/* Earth sphere */}
      <mesh
        ref={earthRef}
        position={[0, -radius - 0.5, 0]}
      >
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial
          map={earthTexture}
          roughness={0.8}
          metalness={0.2}
          emissive="#003344"
          emissiveIntensity={0.3}
          transparent
          opacity={0}
        />
      </mesh>

      {/* Atmosphere ring */}
      <mesh
        ref={atmosphereRef}
        position={[0, -radius - 0.5, 0]}
      >
        <sphereGeometry args={[radius * 1.015, 64, 64]} />
        <meshStandardMaterial
          color="#0088cc"
          emissive="#0088ff"
          emissiveIntensity={0.5}
          transparent
          opacity={0}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Location marker beam (at north pole = tower location) */}
      {showLocationMarker && (
        <group ref={markerRef} position={[0, 2, 0]}>
          {/* Vertical beam */}
          <mesh position={[0, 5, 0]}>
            <cylinderGeometry args={[0.05, 0.3, 10, 8]} />
            <meshStandardMaterial
              color="#00ffcc"
              emissive="#00ffaa"
              emissiveIntensity={2}
              transparent
              opacity={0.6}
            />
          </mesh>
          {/* Beacon ring */}
          <mesh position={[0, 0.5, 0]} rotation-x={-Math.PI / 2}>
            <ringGeometry args={[1, 1.5, 32]} />
            <meshStandardMaterial
              color="#00ffcc"
              emissive="#00ffaa"
              emissiveIntensity={1.5}
              transparent
              opacity={0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

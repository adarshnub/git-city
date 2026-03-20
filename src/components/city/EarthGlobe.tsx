"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface EarthGlobeProps {
  radius?: number;
  userLat?: number | null;
  userLng?: number | null;
}

// Convert lat/lng to 3D position on sphere surface
function latLngToSphere(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

export default function EarthGlobe({
  radius = 200,
  userLat = null,
  userLng = null,
}: EarthGlobeProps) {
  const earthRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const markerRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  // Procedural Earth texture with detailed continents
  const earthTexture = useMemo(() => {
    const size = 2048;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    // Deep ocean base
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, size);
    oceanGrad.addColorStop(0, "#061224");
    oceanGrad.addColorStop(0.3, "#0a1a30");
    oceanGrad.addColorStop(0.5, "#0c1e38");
    oceanGrad.addColorStop(0.7, "#0a1a30");
    oceanGrad.addColorStop(1, "#061224");
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, size, size);

    // Ocean texture noise
    for (let i = 0; i < 8000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.fillStyle = `rgba(${5 + Math.random() * 15}, ${15 + Math.random() * 25}, ${30 + Math.random() * 30}, 0.15)`;
      ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
    }

    // Helper: convert lat/lng to canvas pixel coords (equirectangular)
    const toXY = (lat: number, lng: number): [number, number] => [
      ((lng + 180) / 360) * size,
      ((90 - lat) / 180) * size,
    ];

    // Draw a filled polygon from lat/lng points
    const drawLand = (points: [number, number][], fill: string, stroke: string, strokeW: number) => {
      const px = points.map((p) => toXY(p[0], p[1]));
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(px[0][0], px[0][1]);
      for (let i = 1; i < px.length; i++) ctx.lineTo(px[i][0], px[i][1]);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = strokeW;
      ctx.stroke();
    };

    const landFill = "#0d2e1e";
    const landEdge = "rgba(0, 200, 140, 0.35)";

    // --- NORTH AMERICA ---
    drawLand([
      [83, -70], [80, -90], [75, -120], [70, -165], [65, -168], [60, -165],
      [58, -152], [60, -140], [55, -132], [48, -125], [40, -124],
      [33, -118], [28, -115], [25, -110], [20, -105], [18, -97],
      [18, -88], [21, -87], [22, -84], [25, -80], [27, -77],
      [30, -82], [30, -85], [32, -81], [35, -75], [38, -75],
      [40, -74], [41, -71], [42, -70], [44, -67], [45, -64],
      [47, -60], [49, -55], [52, -56], [55, -60], [58, -62],
      [60, -65], [62, -75], [65, -64], [70, -55], [72, -58],
      [75, -60], [78, -68], [82, -63],
    ], landFill, landEdge, 1.2);

    // Greenland
    drawLand([
      [83, -25], [82, -18], [78, -18], [72, -22], [70, -25],
      [68, -30], [65, -40], [60, -45], [60, -50], [65, -55],
      [70, -55], [75, -60], [78, -68], [82, -50], [83, -35],
    ], landFill, landEdge, 1);

    // Central America
    drawLand([
      [18, -97], [17, -92], [15, -88], [14, -87], [12, -84],
      [10, -84], [8, -82], [7, -78], [8, -77], [10, -75],
      [10, -80], [13, -82], [15, -84], [16, -87], [17, -92],
    ], landFill, landEdge, 0.8);

    // --- SOUTH AMERICA ---
    drawLand([
      [12, -72], [10, -75], [8, -77], [5, -77], [2, -80],
      [0, -80], [-3, -78], [-5, -80], [-8, -78], [-10, -77],
      [-13, -76], [-15, -75], [-18, -70], [-20, -65], [-23, -60],
      [-25, -58], [-28, -55], [-30, -52], [-33, -52], [-35, -55],
      [-40, -62], [-45, -65], [-50, -70], [-55, -68], [-55, -65],
      [-52, -60], [-48, -55], [-42, -48], [-35, -48], [-30, -45],
      [-25, -42], [-20, -40], [-15, -38], [-10, -36], [-5, -35],
      [0, -50], [3, -60], [5, -62], [8, -62], [10, -65],
      [12, -68],
    ], landFill, landEdge, 1.2);

    // --- EUROPE ---
    drawLand([
      [71, 28], [70, 20], [68, 15], [64, 10], [60, 5],
      [56, 8], [55, 5], [53, 5], [51, 2], [49, 0],
      [47, -2], [44, -1], [43, -8], [42, -9], [37, -9],
      [36, -6], [36, 0], [38, 2], [40, 0], [42, 3],
      [44, 8], [43, 12], [40, 15], [38, 18], [37, 22],
      [38, 24], [40, 22], [41, 25], [42, 28], [44, 26],
      [45, 14], [47, 15], [48, 17], [50, 14], [52, 14],
      [54, 18], [55, 20], [57, 22], [60, 25], [63, 22],
      [65, 25], [68, 25],
    ], landFill, landEdge, 1.2);

    // Scandinavian Peninsula
    drawLand([
      [71, 28], [70, 30], [68, 25], [63, 12], [60, 12],
      [58, 8], [56, 12], [56, 15], [58, 16], [60, 18],
      [62, 15], [65, 14], [68, 16], [70, 20],
    ], landFill, landEdge, 0.8);

    // --- AFRICA ---
    drawLand([
      [37, -9], [36, -6], [35, -2], [36, 2], [37, 10],
      [35, 12], [33, 13], [30, 32], [25, 35], [20, 38],
      [15, 42], [12, 44], [8, 46], [5, 42], [2, 42],
      [-2, 40], [-5, 40], [-10, 40], [-15, 38], [-20, 35],
      [-25, 33], [-28, 30], [-32, 28], [-34, 25], [-34, 20],
      [-32, 18], [-28, 15], [-22, 14], [-18, 12], [-12, 14],
      [-8, 10], [-5, 8], [0, 6], [5, 2], [8, -2],
      [10, -5], [12, -10], [14, -14], [16, -16], [20, -17],
      [25, -16], [28, -14], [30, -10], [33, -8], [35, -5],
    ], landFill, landEdge, 1.2);

    // Madagascar
    drawLand([
      [-12, 49], [-15, 50], [-18, 48], [-22, 44], [-25, 44],
      [-25, 46], [-22, 48], [-18, 50], [-14, 50],
    ], landFill, landEdge, 0.8);

    // --- ASIA ---
    drawLand([
      [71, 28], [72, 40], [73, 55], [75, 70], [77, 100],
      [75, 115], [73, 130], [72, 140], [68, 170], [65, 175],
      [60, 165], [55, 155], [50, 143], [45, 135], [42, 132],
      [38, 128], [35, 126], [33, 130], [30, 122], [25, 120],
      [22, 108], [20, 106], [18, 103], [15, 100], [10, 100],
      [5, 103], [2, 104], [-2, 106], [-5, 110], [-8, 115],
      [-8, 120], [-5, 122], [0, 118], [3, 115], [5, 108],
      [8, 100], [10, 95], [8, 80], [10, 78], [15, 75],
      [22, 70], [25, 65], [28, 63], [30, 60], [32, 50],
      [35, 45], [37, 40], [38, 36], [40, 30], [42, 28],
      [44, 26], [48, 30], [50, 32], [52, 36], [55, 40],
      [58, 45], [60, 50], [62, 55], [65, 60], [68, 65],
    ], landFill, landEdge, 1.2);

    // India
    drawLand([
      [30, 70], [28, 73], [25, 72], [22, 73], [20, 73],
      [18, 76], [15, 77], [12, 78], [10, 78], [8, 77],
      [8, 76], [10, 73], [12, 72], [15, 75], [18, 73],
      [20, 70], [22, 70], [25, 68], [28, 68],
    ], landFill, landEdge, 0.8);

    // Japan
    drawLand([
      [45, 142], [43, 145], [40, 140], [38, 140], [35, 136],
      [33, 131], [34, 130], [35, 133], [37, 137], [40, 140],
      [43, 143],
    ], landFill, landEdge, 0.8);

    // --- AUSTRALIA ---
    drawLand([
      [-12, 133], [-14, 127], [-18, 122], [-22, 114], [-26, 114],
      [-30, 115], [-33, 117], [-35, 118], [-35, 122], [-38, 145],
      [-37, 150], [-33, 152], [-28, 153], [-23, 150], [-18, 147],
      [-15, 145], [-12, 142], [-12, 138],
    ], landFill, landEdge, 1.2);

    // New Zealand
    drawLand([
      [-35, 174], [-38, 176], [-42, 175], [-46, 170], [-46, 168],
      [-44, 168], [-40, 172], [-37, 175],
    ], landFill, landEdge, 0.8);

    // Antarctica (bottom edge)
    drawLand([
      [-70, -180], [-75, -150], [-80, -120], [-85, -90], [-82, -60],
      [-78, -30], [-75, 0], [-78, 30], [-82, 60], [-85, 90],
      [-80, 120], [-75, 150], [-70, 180], [-70, 180],
      [-65, 180], [-65, -180],
    ], "#081820", "rgba(0, 180, 200, 0.15)", 0.5);

    // --- Latitude/Longitude grid ---
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = "#00aacc";
    ctx.lineWidth = 0.5;
    for (let lat = -90; lat <= 90; lat += 15) {
      const y = ((90 - lat) / 180) * size;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }
    for (let lng = -180; lng < 180; lng += 15) {
      const x = ((lng + 180) / 360) * size;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Equator + Prime Meridian (brighter)
    ctx.strokeStyle = "rgba(0, 200, 255, 0.15)";
    ctx.lineWidth = 1.5;
    const eqY = size / 2;
    ctx.beginPath(); ctx.moveTo(0, eqY); ctx.lineTo(size, eqY); ctx.stroke();
    const pmX = size / 2;
    ctx.beginPath(); ctx.moveTo(pmX, 0); ctx.lineTo(pmX, size); ctx.stroke();

    // City light clusters
    const cities: [number, number, number][] = [
      // Americas
      [40.7, -74, 1.2], [34, -118, 1], [41.9, -87.6, 0.8], [19.4, -99.1, 0.9],
      [-23.5, -46.6, 1.1], [-34.6, -58.4, 0.8], [45.5, -73.6, 0.6],
      [49.3, -123.1, 0.5], [25.8, -80.2, 0.6], [37.8, -122.4, 0.7],
      // Europe
      [51.5, -0.1, 1.3], [48.9, 2.3, 1.1], [52.5, 13.4, 0.9], [40.4, -3.7, 0.8],
      [41.9, 12.5, 0.7], [55.8, 37.6, 1], [59.3, 18.1, 0.5], [52.2, 21, 0.5],
      [47.5, 19, 0.5], [50.1, 14.4, 0.5],
      // Asia
      [35.7, 139.7, 1.4], [31.2, 121.5, 1.3], [37.6, 127, 1], [22.3, 114.2, 1],
      [39.9, 116.4, 1.3], [28.6, 77.2, 1.2], [19.1, 72.9, 1.1], [1.3, 103.8, 0.8],
      [13.8, 100.5, 0.7], [14.6, 121, 0.7], [35.2, 136.9, 0.6],
      // Oceania
      [-33.9, 151.2, 1], [-37.8, 145, 0.8],
      // Africa
      [30, 31.2, 0.8], [-1.3, 36.8, 0.5], [6.5, 3.4, 0.6], [-26.2, 28.1, 0.6],
      [33.6, -7.6, 0.5],
      // Middle East
      [25.2, 55.3, 0.7], [24.7, 46.7, 0.6], [41, 29, 0.8],
    ];

    cities.forEach(([lat, lng, intensity]) => {
      const [cx, cy] = toXY(lat, lng);
      const r = 4 + intensity * 5;
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      gradient.addColorStop(0, `rgba(255, 200, 80, ${0.6 * intensity})`);
      gradient.addColorStop(0.4, `rgba(255, 160, 40, ${0.3 * intensity})`);
      gradient.addColorStop(1, "rgba(255, 120, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    return texture;
  }, []);

  // Compute user marker position on the sphere
  const markerPosition = useMemo(() => {
    if (userLat == null || userLng == null) return null;
    return latLngToSphere(userLat, userLng, radius);
  }, [userLat, userLng, radius]);

  // Animate
  useFrame(() => {
    const dist = camera.position.length();

    // Slow rotation
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.0002;
      const mat = earthRef.current.material as THREE.MeshStandardMaterial;
      const opacity = THREE.MathUtils.clamp((dist - 40) / 60, 0, 1);
      mat.opacity = opacity;
      mat.visible = opacity > 0.01;
    }

    if (atmosphereRef.current) {
      const opacity = THREE.MathUtils.clamp((dist - 50) / 80, 0, 0.6);
      const mat = atmosphereRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = opacity;
      mat.visible = opacity > 0.01;
    }

    // Pulse marker
    if (markerRef.current) {
      const pulse = Math.sin(Date.now() * 0.003) * 0.3 + 0.7;
      markerRef.current.scale.setScalar(pulse);
      markerRef.current.visible = dist > 50;
    }
  });

  return (
    <group>
      {/* Earth sphere */}
      <mesh ref={earthRef} position={[0, -radius - 0.5, 0]}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial
          map={earthTexture}
          roughness={0.8}
          metalness={0.2}
          emissive="#002233"
          emissiveIntensity={0.25}
          transparent
          opacity={0}
        />
      </mesh>

      {/* Atmosphere */}
      <mesh ref={atmosphereRef} position={[0, -radius - 0.5, 0]}>
        <sphereGeometry args={[radius * 1.012, 64, 64]} />
        <meshStandardMaterial
          color="#0088cc"
          emissive="#0066aa"
          emissiveIntensity={0.4}
          transparent
          opacity={0}
          side={THREE.BackSide}
        />
      </mesh>

      {/* User location marker on the sphere */}
      {markerPosition && (
        <group
          ref={markerRef}
          position={[
            markerPosition.x,
            markerPosition.y - radius - 0.5,
            markerPosition.z,
          ]}
        >
          {/* Beam pointing outward from sphere */}
          <mesh position={[0, 3, 0]}>
            <cylinderGeometry args={[0.05, 0.3, 6, 8]} />
            <meshStandardMaterial
              color="#00ffcc"
              emissive="#00ffaa"
              emissiveIntensity={2}
              transparent
              opacity={0.7}
            />
          </mesh>
          {/* Ring at surface */}
          <mesh rotation-x={-Math.PI / 2}>
            <ringGeometry args={[1, 1.8, 32]} />
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

      {/* Location beacon at tower (always at y=0, visible when zoomed in) */}
      <group position={[0, 2, 0]}>
        <mesh position={[0, 5, 0]}>
          <cylinderGeometry args={[0.05, 0.3, 10, 8]} />
          <meshStandardMaterial
            color="#00ffcc"
            emissive="#00ffaa"
            emissiveIntensity={2}
            transparent
            opacity={0.5}
          />
        </mesh>
        <mesh position={[0, 0.5, 0]} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[1, 1.5, 32]} />
          <meshStandardMaterial
            color="#00ffcc"
            emissive="#00ffaa"
            emissiveIntensity={1.5}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
}

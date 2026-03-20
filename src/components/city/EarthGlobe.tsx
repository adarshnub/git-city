"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree, useLoader } from "@react-three/fiber";
import * as THREE from "three";

interface EarthGlobeProps {
  radius?: number;
  userLat?: number | null;
  userLng?: number | null;
}

export default function EarthGlobe({
  radius = 200,
  userLat = null,
  userLng = null,
}: EarthGlobeProps) {
  const earthGroupRef = useRef<THREE.Group>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  // Load real NASA Earth texture
  const earthTexture = useLoader(THREE.TextureLoader, "/textures/earth.jpg");

  // Compute rotation so that the user's location is at the top of the globe (where the tower sits)
  // The tower is at [0, 0, 0] which is the "north pole" of the scene.
  // We rotate the Earth so the user's lat/lng ends up at the top.
  const earthRotation = useMemo((): [number, number, number] => {
    if (userLat == null || userLng == null) {
      // Default: estimate from browser timezone
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        // Estimate longitude from UTC offset
        const now = new Date();
        const utcOffset = -now.getTimezoneOffset() / 60; // hours ahead of UTC
        const estLng = utcOffset * 15;
        // Estimate latitude from timezone region (rough)
        const estLat = tz.includes("Asia") ? 25
          : tz.includes("Europe") ? 50
          : tz.includes("America") ? 35
          : tz.includes("Africa") ? 5
          : tz.includes("Australia") ? -25
          : 30;

        // Rotate Earth: Y rotation aligns longitude, X rotation aligns latitude
        // In three.js SphereGeometry, the texture starts with lng=-180 at the seam.
        // We need to rotate Y so the user's longitude faces +Y (up), and
        // tilt X so the user's latitude is at the top.
        const rotY = -((estLng + 90) * Math.PI) / 180;
        const rotX = -((90 - estLat) * Math.PI) / 180;
        return [rotX, rotY, 0];
      } catch {
        return [0, 0, 0];
      }
    }

    // Rotate so user's location is at the top of the sphere
    const rotY = -((userLng + 90) * Math.PI) / 180;
    const rotX = -((90 - userLat) * Math.PI) / 180;
    return [rotX, rotY, 0];
  }, [userLat, userLng]);

  // Animate visibility based on camera distance
  useFrame(() => {
    const dist = camera.position.length();

    if (earthGroupRef.current) {
      // Fade in as camera pulls back
      const opacity = THREE.MathUtils.clamp((dist - 40) / 60, 0, 1);
      earthGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child !== atmosphereRef.current) {
          const mat = child.material as THREE.MeshStandardMaterial;
          if (mat.transparent) {
            mat.opacity = opacity;
          }
          mat.visible = opacity > 0.01;
        }
      });
      earthGroupRef.current.visible = opacity > 0.01;
    }

    // Atmosphere
    if (atmosphereRef.current) {
      const opacity = THREE.MathUtils.clamp((dist - 50) / 80, 0, 0.5);
      const mat = atmosphereRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = opacity;
      mat.visible = opacity > 0.01;
    }
  });

  return (
    <group>
      {/* Earth globe - rotated so user's location is at top */}
      <group ref={earthGroupRef} position={[0, -radius - 0.5, 0]} rotation={earthRotation}>
        {/* Main Earth sphere with real texture */}
        <mesh>
          <sphereGeometry args={[radius, 64, 64]} />
          <meshStandardMaterial
            map={earthTexture}
            roughness={0.7}
            metalness={0.1}
            transparent
            opacity={0}
          />
        </mesh>

        {/* Subtle emissive overlay for night-side glow */}
        <mesh>
          <sphereGeometry args={[radius * 1.001, 64, 64]} />
          <meshStandardMaterial
            color="#001122"
            emissive="#001830"
            emissiveIntensity={0.3}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Atmosphere glow */}
      <mesh ref={atmosphereRef} position={[0, -radius - 0.5, 0]}>
        <sphereGeometry args={[radius * 1.015, 64, 64]} />
        <meshStandardMaterial
          color="#4488dd"
          emissive="#2266cc"
          emissiveIntensity={0.5}
          transparent
          opacity={0}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Location beacon at tower (always at y=0, glowing pin) */}
      <group position={[0, 0.5, 0]}>
        {/* Vertical beam */}
        <mesh position={[0, 4, 0]}>
          <cylinderGeometry args={[0.03, 0.2, 8, 8]} />
          <meshStandardMaterial
            color="#00ffcc"
            emissive="#00ffaa"
            emissiveIntensity={2}
            transparent
            opacity={0.5}
          />
        </mesh>
        {/* Ground ring pulse */}
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.05, 0]}>
          <ringGeometry args={[1.2, 1.8, 32]} />
          <meshStandardMaterial
            color="#00ffcc"
            emissive="#00ffaa"
            emissiveIntensity={1.5}
            transparent
            opacity={0.25}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
}

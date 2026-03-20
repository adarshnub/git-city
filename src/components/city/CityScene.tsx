"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import {
  OrbitControls,
  Environment,
  ContactShadows,
  Stars,
} from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  SSAO,
  ToneMapping,
} from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import CityLandscape from "./CityLandscape";
import CityLighting from "./CityLighting";
import EarthGlobe from "./EarthGlobe";

interface CitySceneProps {
  children: React.ReactNode;
  cameraPosition?: [number, number, number];
  showGround?: boolean;
  autoRotate?: boolean;
  showEarth?: boolean;
  userLat?: number | null;
  userLng?: number | null;
}

export default function CityScene({
  children,
  cameraPosition = [15, 20, 25],
  showGround = true,
  autoRotate = false,
  showEarth = true,
  userLat = null,
  userLng = null,
}: CitySceneProps) {
  return (
    <div className="canvas-container h-full w-full">
      <Canvas
        shadows
        camera={{ position: cameraPosition, fov: 50, near: 0.1, far: 1500 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          stencil: false,
        }}
        dpr={[1, 2]}
      >
        <color attach="background" args={["#030508"]} />

        <Suspense fallback={null}>
          {/* HDRI environment for realistic reflections */}
          <Environment preset="city" background={false} />

          {/* Star field (visible when zoomed out) */}
          <Stars
            radius={400}
            depth={100}
            count={3000}
            factor={3}
            saturation={0.2}
            fade
            speed={0.5}
          />

          {/* Lighting */}
          <CityLighting />

          {/* Earth globe (visible when zoomed out) */}
          {showEarth && <EarthGlobe userLat={userLat} userLng={userLng} />}

          {/* Ground landscape */}
          {showGround && <CityLandscape />}

          {/* Contact shadows beneath towers */}
          <ContactShadows
            opacity={0.5}
            scale={50}
            blur={2}
            far={20}
            resolution={256}
            color="#000000"
          />

          {/* Tower children */}
          {children}

          {/* Post-processing for photorealistic quality */}
          <EffectComposer multisampling={4}>
            <Bloom
              intensity={0.6}
              luminanceThreshold={0.7}
              luminanceSmoothing={0.3}
              mipmapBlur
            />
            <SSAO
              samples={21}
              radius={0.15}
              intensity={20}
              luminanceInfluence={0.6}
            />
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          </EffectComposer>
        </Suspense>

        {/* Camera controls - extended range for Earth zoom */}
        <OrbitControls
          makeDefault
          autoRotate={autoRotate}
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 2.05}
          minDistance={3}
          maxDistance={500}
          enableDamping
          dampingFactor={0.05}
          zoomSpeed={1.2}
        />
      </Canvas>
    </div>
  );
}

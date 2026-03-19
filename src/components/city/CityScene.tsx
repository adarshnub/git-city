"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import {
  OrbitControls,
  Environment,
  ContactShadows,
  Sky,
} from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  SSAO,
  ToneMapping,
} from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import CityGround from "./CityGround";
import CityLighting from "./CityLighting";

interface CitySceneProps {
  children: React.ReactNode;
  cameraPosition?: [number, number, number];
  showGround?: boolean;
  autoRotate?: boolean;
}

export default function CityScene({
  children,
  cameraPosition = [15, 20, 25],
  showGround = true,
  autoRotate = false,
}: CitySceneProps) {
  return (
    <div className="canvas-container h-full w-full">
      <Canvas
        shadows
        camera={{ position: cameraPosition, fov: 50, near: 0.1, far: 500 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          stencil: false,
        }}
        dpr={[1, 2]}
      >
        <color attach="background" args={["#070b14"]} />

        <Suspense fallback={null}>
          {/* HDRI environment for realistic reflections */}
          <Environment preset="city" background={false} />

          {/* Sky with stars */}
          <Sky
            distance={450000}
            sunPosition={[5, 1, 8]}
            inclination={0}
            azimuth={0.25}
            rayleigh={0.5}
          />

          {/* Lighting */}
          <CityLighting />

          {/* Ground */}
          {showGround && <CityGround />}

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
              intensity={0.5}
              luminanceThreshold={0.8}
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

        {/* Camera controls */}
        <OrbitControls
          makeDefault
          autoRotate={autoRotate}
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 2.1}
          minDistance={5}
          maxDistance={100}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
}

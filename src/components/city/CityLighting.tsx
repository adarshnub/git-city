"use client";

export default function CityLighting() {
  return (
    <>
      {/* Ambient fill light */}
      <ambientLight intensity={0.15} color="#b0c4de" />

      {/* Main directional sunlight with shadows */}
      <directionalLight
        position={[20, 30, 15]}
        intensity={1.2}
        color="#fff5e6"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={60}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-bias={-0.0001}
      />

      {/* Secondary fill light from opposite side */}
      <directionalLight
        position={[-10, 15, -10]}
        intensity={0.3}
        color="#87ceeb"
      />

      {/* Rim light for depth */}
      <directionalLight
        position={[0, 10, -20]}
        intensity={0.2}
        color="#e6e0ff"
      />

      {/* Ground bounce light */}
      <hemisphereLight
        args={["#87ceeb", "#362907", 0.3]}
      />
    </>
  );
}

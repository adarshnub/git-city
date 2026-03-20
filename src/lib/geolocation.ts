// Haversine formula for distance between two lat/lng points in meters
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// Round coordinates to ~100m precision (3 decimal places)
export function roundCoordinate(coord: number): number {
  return Math.round(coord * 1000) / 1000;
}

// Convert lat/lng to relative x/z position for 3D scene (meters from center)
export function geoToScenePosition(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
  scale: number = 0.01
): { x: number; z: number } {
  // Approximate meters per degree
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng = 111320 * Math.cos(toRad(centerLat));

  const dx = (lng - centerLng) * metersPerDegreeLng * scale;
  const dz = (lat - centerLat) * metersPerDegreeLat * scale;

  return { x: dx, z: -dz }; // Negate z because Three.js z-axis points toward camera
}

// Compute bearing (angle) from point 1 to point 2 in radians
export function computeBearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return Math.atan2(y, x);
}

// Convert a lat/lng to a 3D position on the Earth globe surface.
// The globe is centered at [0, -earthRadius - 0.5, 0] and rotated so
// that centerLat/centerLng is at the very top (where the user's tower sits).
export function latLngToGlobePosition(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
  earthRadius: number = 200
): [number, number, number] {
  const angDist = haversineDistance(centerLat, centerLng, lat, lng) / 6371000; // radians
  const bearing = computeBearing(centerLat, centerLng, lat, lng);

  // Position on sphere where the user is at the "north pole" (top)
  const x = earthRadius * Math.sin(angDist) * Math.sin(bearing);
  const y = earthRadius * Math.cos(angDist);
  const z = -earthRadius * Math.sin(angDist) * Math.cos(bearing);

  // Offset by Earth center position [0, -earthRadius - 0.5, 0]
  return [x, y - earthRadius - 0.5, z];
}

// Generate a simple geohash (5 characters ~ 5km precision)
export function encodeGeohash(lat: number, lng: number, precision: number = 5): string {
  const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
  let minLat = -90, maxLat = 90;
  let minLng = -180, maxLng = 180;
  let hash = "";
  let isEven = true;
  let bit = 0;
  let ch = 0;

  while (hash.length < precision) {
    if (isEven) {
      const mid = (minLng + maxLng) / 2;
      if (lng >= mid) {
        ch |= 1 << (4 - bit);
        minLng = mid;
      } else {
        maxLng = mid;
      }
    } else {
      const mid = (minLat + maxLat) / 2;
      if (lat >= mid) {
        ch |= 1 << (4 - bit);
        minLat = mid;
      } else {
        maxLat = mid;
      }
    }
    isEven = !isEven;
    if (bit < 4) {
      bit++;
    } else {
      hash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }

  return hash;
}

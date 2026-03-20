"use client";

import { useState, useEffect, useCallback } from "react";
import { UserLocationData } from "@/types/location";
import { LOCATION_UPDATE_INTERVAL_MS } from "@/lib/constants";

export function useNearbyUsers(
  latitude: number | null,
  longitude: number | null,
  isSharing: boolean,
  radiusMeters?: number
) {
  const [nearbyUsers, setNearbyUsers] = useState<UserLocationData[]>([]);
  const [loading, setLoading] = useState(false);

  const updateLocation = useCallback(async () => {
    if (!latitude || !longitude) return;

    try {
      await fetch("/api/location/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude, longitude, isSharing }),
      });
    } catch (error) {
      console.error("Failed to update location:", error);
    }
  }, [latitude, longitude, isSharing]);

  const fetchNearby = useCallback(async () => {
    if (!latitude || !longitude) return;

    setLoading(true);
    try {
      const radiusParam = radiusMeters ? `&radius=${radiusMeters}` : "";
      const res = await fetch(
        `/api/location/nearby?lat=${latitude}&lng=${longitude}${radiusParam}`
      );
      const data = await res.json();
      setNearbyUsers(data);
    } catch (error) {
      console.error("Failed to fetch nearby users:", error);
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude, radiusMeters]);

  useEffect(() => {
    if (!isSharing || !latitude || !longitude) return;

    // Initial update and fetch
    updateLocation();
    fetchNearby();

    // Poll periodically
    const interval = setInterval(() => {
      updateLocation();
      fetchNearby();
    }, LOCATION_UPDATE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isSharing, latitude, longitude, updateLocation, fetchNearby]);

  const stopSharing = useCallback(async () => {
    try {
      await fetch("/api/location/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSharing: false }),
      });
      setNearbyUsers([]);
    } catch (error) {
      console.error("Failed to stop sharing:", error);
    }
  }, []);

  return { nearbyUsers, loading, stopSharing };
}

import { useState, useEffect } from "react";
import { saveGPSLocation } from "../lib/gps";

export interface GPSPosition {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
    speed?: number;
    heading?: number;
    altitude?: number;
}

export function useGPSTracking(teamId: string, stageId: string, active: boolean) {
    const [position, setPosition] = useState<GPSPosition | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [watchId, setWatchId] = useState<number | null>(null);

    useEffect(() => {
        if (!active || !teamId || !stageId) {
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
                setWatchId(null);
            }
            return;
        }

        if ("geolocation" in navigator) {
            const options = {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            };

            const id = navigator.geolocation.watchPosition(
                async (geoPosition) => {
                    const newPosition: GPSPosition = {
                        latitude: geoPosition.coords.latitude,
                        longitude: geoPosition.coords.longitude,
                        accuracy: geoPosition.coords.accuracy,
                        speed: geoPosition.coords.speed !== null && geoPosition.coords.speed !== undefined ? geoPosition.coords.speed : undefined,
                        heading: geoPosition.coords.heading !== null && geoPosition.coords.heading !== undefined ? geoPosition.coords.heading : undefined,
                        altitude: geoPosition.coords.altitude !== null && geoPosition.coords.altitude !== undefined ? geoPosition.coords.altitude : undefined,
                        timestamp: Date.now()
                    };

                    setPosition(newPosition);
                    setError(null);

                    try {
                        await saveGPSLocation({
                            teamId,
                            stageId,
                            latitude: newPosition.latitude,
                            longitude: newPosition.longitude,
                            accuracy: newPosition.accuracy,
                            speed: newPosition.speed,
                            heading: newPosition.heading,
                            altitude: newPosition.altitude,
                            timestamp: new Date(geoPosition.timestamp).toISOString()
                        });
                    } catch (err) {
                        console.error("Error sending GPS data:", err);
                    }
                },
                (err) => {
                    setError(err.message);
                    console.error("GPS error:", err);
                },
                options
            );

            setWatchId(id);

            return () => {
                navigator.geolocation.clearWatch(id);
            };
        } else {
            setError("Geolocation não suportada neste dispositivo");
        }
    }, [active, teamId, stageId]);

    return { position, error };
}


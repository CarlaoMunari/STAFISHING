import { useState, useEffect } from "react";
import { saveGPSLocation } from "../lib/gps";
import { Capacitor, registerPlugin } from '@capacitor/core';

const BackgroundGeolocation = registerPlugin<any>('BackgroundGeolocation');

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

    useEffect(() => {
        let currentWatchId: string | number | null = null;
        let isMounted = true;

        const startTracking = async () => {
            if (Capacitor.isNativePlatform()) {
                try {
                    const id = await BackgroundGeolocation.addWatcher(
                        {
                            backgroundMessage: "Rastreamento GPS ativo para a etapa.",
                            backgroundTitle: "STA FISHING",
                            requestPermissions: true,
                            stale: false,
                            distanceFilter: 10
                        },
                        async (location: any, err: any) => {
                            if (err) {
                                if (err.code === "NOT_AUTHORIZED" && isMounted) {
                                    setError("Permissão de localização em segundo plano negada. Altere nas configurações.");
                                } else if (isMounted) {
                                    setError(err.message || "Erro no GPS Nativo");
                                }
                                return;
                            }
                            if (!location) return;

                            const newPos: GPSPosition = {
                                latitude: location.latitude,
                                longitude: location.longitude,
                                accuracy: location.accuracy,
                                speed: location.speed,
                                heading: location.bearing,
                                altitude: location.altitude,
                                timestamp: location.time || Date.now()
                            };

                            if (isMounted) {
                                setPosition(newPos);
                                setError(null);
                            }

                            try {
                                await saveGPSLocation({
                                    teamId,
                                    stageId,
                                    latitude: newPos.latitude,
                                    longitude: newPos.longitude,
                                    accuracy: newPos.accuracy,
                                    speed: newPos.speed,
                                    heading: newPos.heading,
                                    altitude: newPos.altitude,
                                    timestamp: new Date(newPos.timestamp).toISOString()
                                });
                            } catch (e) {
                                console.error("Erro salvando GPS nativo:", e);
                            }
                        }
                    );
                    
                    if (isMounted) {
                        currentWatchId = id;
                    } else {
                        BackgroundGeolocation.removeWatcher({ id });
                    }
                } catch (e: any) {
                    if (isMounted) setError("Erro ao iniciar Background GPS: " + e.message);
                }
            } else {
                if ("geolocation" in navigator) {
                    currentWatchId = navigator.geolocation.watchPosition(
                        async (geo) => {
                            const newPos: GPSPosition = {
                                latitude: geo.coords.latitude,
                                longitude: geo.coords.longitude,
                                accuracy: geo.coords.accuracy,
                                speed: geo.coords.speed !== null ? geo.coords.speed : undefined,
                                heading: geo.coords.heading !== null ? geo.coords.heading : undefined,
                                altitude: geo.coords.altitude !== null ? geo.coords.altitude : undefined,
                                timestamp: Date.now()
                            };

                            if (isMounted) {
                                setPosition(newPos);
                                setError(null);
                            }

                            try {
                                await saveGPSLocation({
                                    teamId,
                                    stageId,
                                    latitude: newPos.latitude,
                                    longitude: newPos.longitude,
                                    accuracy: newPos.accuracy,
                                    speed: newPos.speed,
                                    heading: newPos.heading,
                                    altitude: newPos.altitude,
                                    timestamp: new Date(geo.timestamp).toISOString()
                                });
                            } catch (err) {
                                console.error("Error sending GPS data:", err);
                            }
                        },
                        (err) => {
                            if (isMounted) setError(err.message);
                        },
                        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                    );
                } else {
                    if (isMounted) setError("Geolocation não suportada neste dispositivo");
                }
            }
        };

        if (active && teamId && stageId) {
            startTracking();
        }

        return () => {
            isMounted = false;
            if (currentWatchId !== null) {
                if (Capacitor.isNativePlatform()) {
                    BackgroundGeolocation.removeWatcher({ id: currentWatchId as string });
                } else {
                    navigator.geolocation.clearWatch(currentWatchId as number);
                }
            }
        };
    }, [active, teamId, stageId]);

    return { position, error };
}


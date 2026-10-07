import { useState, useEffect } from "react";
import { useGPSTracking } from "../../hooks/useGPSTracking";
import { validateGPSAccessKey } from "../../lib/gps";
import {
    MapPin,
    Power,
    LogOut,
    Gauge,
    Compass,
    Signal,
    ShieldCheck,
    AlertTriangle,
    Smartphone,
    Info
} from "lucide-react";

export function GPSTracking() {
    const [accessKey, setAccessKey] = useState("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [teamInfo, setTeamInfo] = useState<any>(null);
    const [isTracking, setIsTracking] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [wakeLockActive, setWakeLockActive] = useState(false);

    const { position, error: gpsError } = useGPSTracking(
        teamInfo?.teams?.id,
        teamInfo?.stages?.id,
        isTracking
    );

    // Screen Wake Lock API to prevent phone screen timeout during fishing
    useEffect(() => {
        let sentinel: any = null;

        const requestWakeLock = async () => {
            if (isTracking && "wakeLock" in navigator) {
                try {
                    sentinel = await (navigator as any).wakeLock.request("screen");
                    setWakeLockActive(true);

                    sentinel.addEventListener("release", () => {
                        setWakeLockActive(false);
                    });
                } catch (err) {
                    console.warn("Wake lock request failed:", err);
                    setWakeLockActive(false);
                }
            }
        };

        if (isTracking) {
            requestWakeLock();
        } else if (sentinel) {
            sentinel.release().catch(() => {});
            setWakeLockActive(false);
        }

        return () => {
            if (sentinel) {
                sentinel.release().catch(() => {});
            }
        };
    }, [isTracking]);

    const handleLogin = async () => {
        if (!accessKey.trim()) {
            setError("Por favor, digite a chave de acesso");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await validateGPSAccessKey(accessKey.toUpperCase().trim());

            if (response.valid) {
                setTeamInfo(response.data);
                setIsLoggedIn(true);
            } else {
                setError(response.message || "Chave de acesso inválida");
            }
        } catch (err) {
            setError("Erro ao validar chave de acesso");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        setIsTracking(false);
        setIsLoggedIn(false);
        setAccessKey("");
        setTeamInfo(null);
    };

    // Helper for heading compass direction
    const getHeadingText = (heading: number | null | undefined) => {
        if (heading === null || heading === undefined) return "--";
        const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
        return directions[Math.round(heading / 45) % 8];
    };

    // Helper for accuracy status
    const getAccuracyBadge = (accuracy: number | undefined) => {
        if (!accuracy) return { text: "Buscando...", color: "bg-gray-700 text-gray-300" };
        if (accuracy <= 10) return { text: "Excelente", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" };
        if (accuracy <= 25) return { text: "Boa", color: "bg-blue-500/20 text-blue-400 border-blue-500/40" };
        return { text: "Imprecisa", color: "bg-amber-500/20 text-amber-400 border-amber-500/40" };
    };

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex flex-col justify-center items-center p-4 safe-top pb-mobile-nav">
                <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-slate-800 p-6 md:p-8 shadow-2xl space-y-6">
                    {/* Header Logo */}
                    <div className="text-center">
                        <div className="inline-flex bg-gradient-to-tr from-blue-600 to-cyan-500 p-4 rounded-2xl shadow-lg shadow-blue-500/30 mb-4 animate-bounce">
                            <MapPin className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                            GPS Tracker
                        </h1>
                        <p className="text-sm text-gray-400 mt-1">
                            Rastreamento Oficial de Embarcações
                        </p>
                    </div>

                    {/* Form */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                                Chave de Acesso da Equipe
                            </label>
                            <input
                                type="text"
                                value={accessKey}
                                onChange={(e) => setAccessKey(e.target.value.toUpperCase())}
                                placeholder="ABC123-XYZ789"
                                className="w-full px-4 py-3.5 bg-slate-800/90 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-xl font-mono font-bold tracking-widest text-white placeholder-gray-500 shadow-inner"
                                maxLength={13}
                                disabled={loading}
                            />
                        </div>

                        {error && (
                            <div className="bg-rose-500/10 border border-rose-500/40 text-rose-300 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            onClick={handleLogin}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98] disabled:opacity-50 text-base"
                        >
                            {loading ? "Validando Chave..." : "Conectar Embarcação"}
                        </button>

                        <div className="bg-slate-800/50 rounded-xl p-3 text-xs text-gray-400 border border-slate-800 flex items-start gap-2">
                            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                            <span>Utilize a chave de 12 dígitos fornecida no momento da inscrição da equipe.</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const accuracyInfo = getAccuracyBadge(position?.accuracy);

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col safe-top pb-mobile-nav selection:bg-blue-600">
            {/* Top Bar Header */}
            <div className="bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 px-4 py-3.5 sticky top-0 z-40 shadow-lg">
                <div className="max-w-md mx-auto flex items-center justify-between">
                    <div>
                        <span className="text-xs text-blue-400 font-semibold tracking-wider uppercase">
                            {teamInfo?.stages?.name}
                        </span>
                        <h2 className="text-lg font-bold text-white leading-tight truncate max-w-[220px]">
                            {teamInfo?.teams?.team_name}
                        </h2>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2.5 bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white rounded-xl transition-colors active:scale-95 border border-slate-700"
                        title="Sair"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Main Cockpit Display */}
            <div className="max-w-md mx-auto w-full p-4 space-y-4 flex-1 flex flex-col justify-between">
                {/* Main Action Power Card */}
                <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-800 p-6 shadow-2xl text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                        {wakeLockActive && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                <Smartphone className="w-3 h-3" /> Tela Mantida Acesa
                            </span>
                        )}
                    </div>

                    <div className="mt-2 mb-6">
                        <div className="relative inline-block">
                            <button
                                onClick={() => setIsTracking(!isTracking)}
                                className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl active:scale-90 ${
                                    isTracking
                                        ? "bg-gradient-to-tr from-emerald-600 to-teal-400 text-white ring-8 ring-emerald-500/20 shadow-emerald-500/40 animate-pulse"
                                        : "bg-gradient-to-tr from-slate-800 to-slate-700 text-gray-400 hover:text-white ring-8 ring-slate-800/50 shadow-slate-900/80"
                                }`}
                            >
                                <Power className="w-12 h-12" />
                            </button>
                        </div>
                    </div>

                    <h3 className="text-xl font-extrabold text-white">
                        {isTracking ? "Rastreamento GPS Ativo" : "Rastreamento Em Espera"}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                        {isTracking
                            ? "Transmitindo posição da embarcação em tempo real"
                            : "Toque no botão central para iniciar a transmissão"}
                    </p>

                    {/* Status Pill */}
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs">
                        <span className={`w-2.5 h-2.5 rounded-full ${isTracking ? "bg-emerald-400 animate-ping" : "bg-gray-500"}`} />
                        <span className="text-gray-300 font-medium">
                            {isTracking ? "Conectado aos Satélites" : "Standby"}
                        </span>
                    </div>
                </div>

                {/* Telemetry Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Speed Gauge */}
                    <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-800 p-4 flex flex-col justify-between shadow-lg">
                        <div className="flex items-center justify-between text-gray-400">
                            <span className="text-xs font-semibold uppercase">Velocidade</span>
                            <Gauge className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="mt-2">
                            <span className="text-3xl font-extrabold font-mono text-cyan-400">
                                {position?.speed ? (position.speed * 3.6).toFixed(1) : "0.0"}
                            </span>
                            <span className="text-xs text-gray-400 ml-1">km/h</span>
                        </div>
                    </div>

                    {/* Heading / Compass */}
                    <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-800 p-4 flex flex-col justify-between shadow-lg">
                        <div className="flex items-center justify-between text-gray-400">
                            <span className="text-xs font-semibold uppercase">Direção</span>
                            <Compass className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="mt-2">
                            <span className="text-3xl font-extrabold font-mono text-blue-400">
                                {getHeadingText(position?.heading)}
                            </span>
                            <span className="text-xs text-gray-400 ml-1">
                                {position?.heading ? `${Math.round(position.heading)}°` : ""}
                            </span>
                        </div>
                    </div>
                </div>

                {/* GPS Location Details */}
                <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-800 p-4 space-y-3 shadow-lg">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Signal className="w-4 h-4 text-emerald-400" /> Sinal GPS
                        </span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${accuracyInfo.color}`}>
                            {accuracyInfo.text} ({position ? `${Math.round(position.accuracy)}m` : "--"})
                        </span>
                    </div>

                    {position ? (
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                            <div>
                                <span className="text-gray-500 block text-[10px]">LATITUDE</span>
                                <span className="text-gray-200 font-semibold">{position.latitude.toFixed(6)}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 block text-[10px]">LONGITUDE</span>
                                <span className="text-gray-200 font-semibold">{position.longitude.toFixed(6)}</span>
                            </div>
                            <div className="col-span-2 pt-1 border-t border-slate-800/60 flex justify-between text-[11px]">
                                <span className="text-gray-400">Último Envio:</span>
                                <span className="text-cyan-300 font-semibold">
                                    {new Date(position.timestamp).toLocaleTimeString("pt-BR")}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 py-3 text-xs">
                            {isTracking ? "Obtendo dados de localização..." : "Ative o rastreamento para visualizar coordenadas."}
                        </div>
                    )}

                    {gpsError && (
                        <div className="bg-rose-500/20 border border-rose-500/40 text-rose-300 px-3 py-2 rounded-xl text-xs flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                            <span>Erro no GPS: {gpsError}</span>
                        </div>
                    )}
                </div>

                {/* Instructions / Recommendations for Mobile */}
                <div className="bg-blue-950/40 border border-blue-800/40 rounded-2xl p-3 text-xs text-blue-200 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-blue-300">
                        <ShieldCheck className="w-4 h-4 text-blue-400" /> Dica para Android & iOS:
                    </div>
                    <p className="text-[11px] leading-relaxed text-blue-200/90">
                        Mantenha esta tela aberta ou instalada como App na Tela Inicial para evitar interrupções de sinal pelo sistema operacional.
                    </p>
                </div>
            </div>
        </div>
    );
}


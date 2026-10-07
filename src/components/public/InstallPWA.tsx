import { useState, useEffect } from "react";
import { Download, Share, PlusSquare, X, Smartphone } from "lucide-react";

export function InstallPWA() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showBanner, setShowBanner] = useState<boolean>(false);
    const [isIOS, setIsIOS] = useState<boolean>(false);

    useEffect(() => {
        const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone;
        if (isStandalone) {
            return;
        }

        const dismissed = localStorage.getItem("pwa_install_dismissed");
        if (dismissed && Date.now() - parseInt(dismissed, 10) < 3 * 24 * 60 * 60 * 1000) {
            return;
        }

        const userAgent = window.navigator.userAgent.toLowerCase();
        const iosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(iosDevice);

        if (iosDevice) {
            const timer = setTimeout(() => setShowBanner(true), 3000);
            return () => clearTimeout(timer);
        }

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowBanner(true);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
            setShowBanner(false);
        }
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowBanner(false);
        localStorage.setItem("pwa_install_dismissed", Date.now().toString());
    };

    if (!showBanner) return null;

    return (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-sm z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
            <div className="bg-slate-900/95 backdrop-blur-xl border border-blue-500/30 text-white rounded-2xl p-4 shadow-2xl relative">
                <button
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 text-gray-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
                    aria-label="Fechar"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-start gap-3 pr-6">
                    <div className="bg-gradient-to-br from-blue-600 to-cyan-500 p-3 rounded-xl shadow-lg shrink-0">
                        <Smartphone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                            Instalar STA FISHING App
                        </h4>
                        <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                            {isIOS
                                ? "Instale no seu iPhone para usar o GPS sem barras do navegador!"
                                : "Adicione ao seu celular Android para acesso rápido e modo offline."}
                        </p>

                        {isIOS ? (
                            <div className="mt-3 bg-slate-800/80 rounded-lg p-2.5 text-[11px] text-gray-200 space-y-1.5 border border-slate-700">
                                <div className="flex items-center gap-2">
                                    <span className="bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded text-[10px]">1</span>
                                    <span>Toque no botão <strong>Compartilhar</strong> <Share className="w-3.5 h-3.5 inline text-blue-400" /></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded text-[10px]">2</span>
                                    <span>Selecione <strong>"Adicionar à Tela de Início"</strong> <PlusSquare className="w-3.5 h-3.5 inline text-blue-400" /></span>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={handleInstallClick}
                                className="mt-3 w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                <Download className="w-4 h-4" />
                                Instalar Aplicativo Nativo
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}


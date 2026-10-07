import { Link, useParams } from "react-router-dom";
import { Menu, X, User, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { companyName } = useParams();

    const [activeCompanySlug, setActiveCompanySlug] = useState<string>("");

    useEffect(() => {
        loadCompanyData();

        const handleSlugUpdate = () => loadCompanyData();
        window.addEventListener("company_slug_updated", handleSlugUpdate);
        window.addEventListener("storage", handleSlugUpdate);

        return () => {
            window.removeEventListener("company_slug_updated", handleSlugUpdate);
            window.removeEventListener("storage", handleSlugUpdate);
        };
    }, [companyName]);

    const loadCompanyData = async () => {
        try {
            let currentSlug = companyName || "";

            if (!currentSlug) {
                currentSlug = localStorage.getItem("last_company_slug") || "";
            }

            if (!currentSlug) {
                const { data: masterComp } = await supabase
                    .from("users")
                    .select("slug")
                    .eq("email", "sta@stafishing.com.br")
                    .maybeSingle();
                if (masterComp?.slug) currentSlug = masterComp.slug;
            }

            if (currentSlug) {
                setActiveCompanySlug(currentSlug);
            }
        } catch (error) {
            console.error("Erro ao carregar dados da empresa na Navbar:", error);
        }
    };

    const companyHomePath = activeCompanySlug ? `/${activeCompanySlug}` : "/";
    const basePath = activeCompanySlug ? `/${activeCompanySlug}` : "";

    const menuLinks = [
        { label: "Início", to: companyHomePath },
        { label: "Notícias", to: "/#noticias" },
        { label: "Etapas", to: `${basePath}/etapas` },
        { label: "Classificação", to: `${basePath}/ranking` },
        { label: "Regulamento", to: `${basePath}/regulamento` },
    ];

    return (
        <nav className="bg-slate-950/95 text-white shadow-2xl sticky top-0 z-50 border-b border-amber-500/30 backdrop-blur-xl w-full">
            <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20 lg:h-24 gap-2">

                    {/* Logo + Brand */}
                    <Link to={companyHomePath} className="flex items-center gap-2 sm:gap-3 group shrink-0">
                        <img
                            src={`${import.meta.env.BASE_URL}sta-shield-logo.png`}
                            alt="STA FISHING"
                            className="h-12 lg:h-14 w-auto object-contain shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-all duration-300"
                            onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                            }}
                        />
                        <div className="flex flex-col justify-center">
                            <span className="text-base sm:text-lg lg:text-xl font-black tracking-widest bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent uppercase">
                                STA FISHING
                            </span>
                            <span className="hidden sm:block text-[9px] font-bold text-amber-400/90 tracking-widest uppercase mt-0.5">
                                PESCA ESPORTIVA • NATUREZA SEMPRE
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Menu — visible on xl+ */}
                    <div className="hidden xl:flex items-center gap-5 mx-2">
                        {menuLinks.map(({ label, to }) => (
                            <Link
                                key={label}
                                to={to}
                                className="text-[11px] font-black text-gray-300 hover:text-amber-400 transition-colors uppercase tracking-wider whitespace-nowrap"
                            >
                                {label}
                            </Link>
                        ))}
                        <a href="#patrocinadores" className="text-[11px] font-black text-gray-300 hover:text-amber-400 transition-colors uppercase tracking-wider whitespace-nowrap">
                            Parceiros
                        </a>
                        <a href="#contato" className="text-[11px] font-black text-gray-300 hover:text-amber-400 transition-colors uppercase tracking-wider whitespace-nowrap">
                            Contato
                        </a>
                    </div>

                    {/* Action Buttons — visible on lg+ */}
                    <div className="hidden lg:flex items-center gap-2 shrink-0">
                        <Link to="/login">
                            <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-[11px] uppercase tracking-wider shadow-xl shadow-red-600/30 transition-all active:scale-95 whitespace-nowrap">
                                <User className="w-3.5 h-3.5" />
                                Login
                            </button>
                        </Link>
                        <Link to={`${basePath}/etapas`}>
                            <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-amber-500/70 hover:bg-amber-500/10 text-amber-300 font-black text-[11px] uppercase tracking-wider transition-all whitespace-nowrap">
                                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                                Ver Etapas
                            </button>
                        </Link>
                    </div>

                    {/* Mobile/Tablet Toggle */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="xl:hidden text-amber-400 hover:text-white p-2 ml-auto"
                    >
                        {mobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
                    </button>
                </div>
            </div>

            {/* Mobile/Tablet Dropdown */}
            {mobileMenuOpen && (
                <div className="xl:hidden bg-slate-950 border-b border-amber-500/30 px-6 py-5 space-y-4">
                    {menuLinks.map(({ label, to }) => (
                        <Link
                            key={label}
                            to={to}
                            onClick={() => setMobileMenuOpen(false)}
                            className="block text-sm font-black text-gray-300 hover:text-amber-400 uppercase tracking-wider"
                        >
                            {label}
                        </Link>
                    ))}
                    <a href="#patrocinadores" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-black text-gray-300 hover:text-amber-400 uppercase tracking-wider">Parceiros</a>
                    <a href="#contato" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-black text-gray-300 hover:text-amber-400 uppercase tracking-wider">Contato</a>

                    <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
                        <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                            <button className="w-full py-3 bg-gradient-to-r from-red-600 to-amber-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-red-600/30">
                                Login
                            </button>
                        </Link>
                        <Link to={`${basePath}/etapas`} onClick={() => setMobileMenuOpen(false)}>
                            <button className="w-full py-3 border border-amber-500/70 text-amber-300 font-black text-xs uppercase tracking-wider rounded-xl">
                                Ver Etapas
                            </button>
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}

import { Link, useLocation, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Home, Building2, UserPlus, Trophy, MapPin } from "lucide-react";

export function MobileBottomNav() {
    const location = useLocation();
    const { companyName } = useParams();

    const [activeSlug, setActiveSlug] = useState<string>(
        companyName || localStorage.getItem("last_company_slug") || ""
    );

    useEffect(() => {
        const handleUpdate = () => {
            const slug = companyName || localStorage.getItem("last_company_slug") || "";
            setActiveSlug(slug);
        };

        handleUpdate();
        window.addEventListener("company_slug_updated", handleUpdate);
        window.addEventListener("storage", handleUpdate);

        return () => {
            window.removeEventListener("company_slug_updated", handleUpdate);
            window.removeEventListener("storage", handleUpdate);
        };
    }, [companyName, location.pathname]);
    const companyHomePath = activeSlug ? `/${activeSlug}` : "/";
    const basePath = activeSlug ? `/${activeSlug}` : "";

    const navItems = [
        {
            label: "Início",
            path: companyHomePath,
            icon: Home,
            exact: true
        },
        {
            label: "Empresas",
            path: "/empresas",
            icon: Building2
        },
        {
            label: "Inscrição",
            path: "/inscricao",
            icon: UserPlus
        },
        {
            label: "Ranking",
            path: `${basePath}/ranking`,
            icon: Trophy
        },
        {
            label: "GPS App",
            path: "/gps",
            icon: MapPin,
            highlight: true
        }
    ];

    const isActive = (itemPath: string, exact?: boolean) => {
        if (exact) {
            return location.pathname === itemPath;
        }
        return location.pathname === itemPath || (itemPath !== "/" && location.pathname.startsWith(itemPath));
    };

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 shadow-2xl safe-bottom text-white">
            <div className="flex items-center justify-around h-16 px-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path, item.exact);

                    if (item.highlight) {
                        return (
                            <Link
                                key={item.label}
                                to={item.path}
                                className="flex flex-col items-center justify-center -mt-5 transition-transform active:scale-95"
                            >
                                <div className={`p-3.5 rounded-full shadow-lg transition-all ${
                                    active
                                        ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white ring-4 ring-blue-500/30 scale-105"
                                        : "bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/40"
                                }`}>
                                    <Icon className="w-6 h-6 animate-pulse" />
                                </div>
                                <span className={`text-[10px] font-bold mt-1 tracking-tight ${
                                    active ? "text-cyan-400" : "text-blue-200"
                                }`}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    }

                    return (
                        <Link
                            key={item.label}
                            to={item.path}
                            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-95 ${
                                active ? "text-blue-400 font-semibold" : "text-gray-400 hover:text-gray-200"
                            }`}
                        >
                            <div className="relative">
                                <Icon className={`w-5 h-5 transition-transform ${active ? "scale-110" : ""}`} />
                                {active && (
                                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full" />
                                )}
                            </div>
                            <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}


import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Navbar } from "../../components/public/Navbar";
import { Footer } from "../../components/public/Footer";
import { Building2, Search, ArrowRight, ShieldCheck } from "lucide-react";

interface CompanyItem {
    id: string;
    name: string;
    slug?: string;
    email?: string;
}

export function CompanySelector() {
    const [companies, setCompanies] = useState<CompanyItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCompanies();
    }, []);

    const loadCompanies = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from("users")
                .select("id, name, slug, email")
                .eq("role", "company")
                .order("name", { ascending: true });

            if (data) {
                setCompanies(data);
            }
        } catch (error) {
            console.error("Erro ao carregar empresas:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCompanies = companies.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.slug && c.slug.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col pb-mobile-nav">
            <Navbar />

            {/* Header Banner */}
            <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 text-white py-10 shadow-xl">
                <div className="container mx-auto px-4 max-w-5xl text-center md:text-left">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600/30 p-3.5 rounded-2xl border border-blue-500/30 backdrop-blur-md">
                                <Building2 className="w-8 h-8 text-cyan-400" />
                            </div>
                            <div>
                                <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">
                                    Organizadores do Sistema
                                </span>
                                <h1 className="text-2xl md:text-3xl font-black text-white">
                                    Selecione a Empresa de Circuitos
                                </h1>
                            </div>
                        </div>

                        <p className="text-xs md:text-sm text-blue-200/80 max-w-md">
                            Escolha a empresa para visualizar o portal exclusivo, circuitos ativos, etapas e rankings.
                        </p>
                    </div>
                </div>
            </div>

            {/* Search and List Section */}
            <div className="container mx-auto px-4 py-8 max-w-5xl flex-grow">
                <div className="mb-6">
                    <div className="relative max-w-md">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar organizador por nome..."
                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 font-medium text-sm text-gray-800"
                        />
                        <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
                        <p className="mt-4 text-sm font-medium text-gray-600">Carregando empresas cadastradas...</p>
                    </div>
                ) : filteredCompanies.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 shadow-sm space-y-3">
                        <Building2 className="w-12 h-12 text-gray-300 mx-auto" />
                        <h3 className="text-lg font-bold text-gray-800">Nenhum organizador encontrado</h3>
                        <p className="text-xs text-gray-500">Tente buscar por outro termo de pesquisa.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredCompanies.map((company) => {
                            const companySlug = company.slug || company.name.toLowerCase().replace(/\s+/g, "-");

                            return (
                                <div
                                    key={company.id}
                                    className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                                >
                                    <div>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center font-bold text-lg shadow-md group-hover:scale-105 transition-transform">
                                                {company.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-base text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                                                    {company.name}
                                                </h3>
                                                <span className="text-xs text-gray-400 font-mono">
                                                    /{companySlug}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mb-4 bg-emerald-50 px-2.5 py-1 rounded-lg w-fit">
                                            <ShieldCheck className="w-3.5 h-3.5" /> Organizador Verificado
                                        </div>
                                    </div>

                                    <Link
                                        to={`/${companySlug}`}
                                        className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2 text-xs transition-colors active:scale-95 mt-2"
                                    >
                                        Acessar Portal da Empresa
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}


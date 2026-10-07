import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { formatDateBR } from "../../lib/dateUtils";
import { Navbar } from "../../components/public/Navbar";
import { Footer } from "../../components/public/Footer";
import { Building2, Trophy, Calendar, ArrowRight, UserPlus, Sparkles } from "lucide-react";

export function MultiCompanyRegistration() {
    const navigate = useNavigate();

    const [companies, setCompanies] = useState<any[]>([]);
    const [circuits, setCircuits] = useState<any[]>([]);
    const [stages, setStages] = useState<any[]>([]);

    const [selectedCompany, setSelectedCompany] = useState<string>("");
    const [selectedCircuit, setSelectedCircuit] = useState<string>("");
    const [selectedStage, setSelectedStage] = useState<string>("");

    const [loadingCompanies, setLoadingCompanies] = useState(true);
    const [loadingCircuits, setLoadingCircuits] = useState(false);
    const [loadingStages, setLoadingStages] = useState(false);

    useEffect(() => {
        loadCompanies();
    }, []);

    useEffect(() => {
        if (selectedCompany) {
            loadCircuits(selectedCompany);
        } else {
            setCircuits([]);
            setSelectedCircuit("");
        }
    }, [selectedCompany]);

    useEffect(() => {
        if (selectedCircuit) {
            loadStages(selectedCircuit);
        } else {
            setStages([]);
            setSelectedStage("");
        }
    }, [selectedCircuit]);

    const loadCompanies = async () => {
        setLoadingCompanies(true);
        try {
            const { data } = await supabase
                .from("users")
                .select("id, name, slug")
                .eq("role", "company")
                .order("name", { ascending: true });

            if (data) {
                setCompanies(data);
                if (data.length > 0) {
                    setSelectedCompany(data[0].id);
                }
            }
        } catch (err) {
            console.error("Erro ao carregar empresas:", err);
        } finally {
            setLoadingCompanies(false);
        }
    };

    const loadCircuits = async (companyId: string) => {
        setLoadingCircuits(true);
        try {
            const { data } = await supabase
                .from("circuits")
                .select("*")
                .eq("company_id", companyId)
                .eq("active", true)
                .order("year", { ascending: false });

            if (data) {
                setCircuits(data);
                if (data.length > 0) {
                    setSelectedCircuit(data[0].id);
                } else {
                    setSelectedCircuit("");
                }
            }
        } catch (err) {
            console.error("Erro ao carregar circuitos:", err);
        } finally {
            setLoadingCircuits(false);
        }
    };

    const loadStages = async (circuitId: string) => {
        setLoadingStages(true);
        try {
            const { data } = await supabase
                .from("stages")
                .select("*")
                .eq("circuit_id", circuitId)
                .order("date", { ascending: true });

            if (data) {
                setStages(data);
                if (data.length > 0) {
                    setSelectedStage(data[0].id);
                } else {
                    setSelectedStage("");
                }
            }
        } catch (err) {
            console.error("Erro ao carregar etapas:", err);
        } finally {
            setLoadingStages(false);
        }
    };

    const handleProceedToRegistration = () => {
        if (!selectedStage) return;

        const companyObj = companies.find(c => c.id === selectedCompany);
        const companySlug = companyObj?.slug || "";

        if (companySlug) {
            navigate(`/${companySlug}/register/${selectedStage}`);
        } else {
            navigate(`/register/${selectedStage}`);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col pb-mobile-nav">
            <Navbar />

            {/* Header */}
            <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 text-white py-10 shadow-xl">
                <div className="container mx-auto px-4 max-w-4xl text-center md:text-left">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600/30 p-3.5 rounded-2xl border border-blue-500/30 backdrop-blur-md">
                            <UserPlus className="w-8 h-8 text-cyan-400" />
                        </div>
                        <div>
                            <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">
                                Central de Inscrição Multi-Empresa
                            </span>
                            <h1 className="text-2xl md:text-3xl font-black text-white">
                                Inscrever Equipe na Etapa
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* Wizard Box */}
            <div className="container mx-auto px-4 py-8 max-w-4xl flex-grow">
                <div className="bg-white rounded-3xl border border-gray-200/80 p-6 md:p-8 shadow-sm space-y-6">

                    {/* Step 1: Select Company */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-blue-600" /> 1. Escolha a Empresa / Organizador
                        </label>
                        {loadingCompanies ? (
                            <div className="animate-pulse bg-gray-100 h-12 rounded-xl" />
                        ) : (
                            <select
                                value={selectedCompany}
                                onChange={(e) => setSelectedCompany(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl font-medium text-gray-800 text-sm focus:ring-2 focus:ring-blue-500"
                            >
                                {companies.map((company) => (
                                    <option key={company.id} value={company.id}>
                                        {company.name} ({company.slug ? `/${company.slug}` : ""})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Step 2: Select Circuit */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-blue-600" /> 2. Escolha o Circuito Ativo
                        </label>
                        {loadingCircuits ? (
                            <div className="animate-pulse bg-gray-100 h-12 rounded-xl" />
                        ) : circuits.length === 0 ? (
                            <p className="text-xs text-gray-500 italic bg-gray-50 p-3 rounded-xl border border-gray-200">
                                NENHUM CIRCUITO ATIVO ENCONTRADO PARA ESTA EMPRESA.
                            </p>
                        ) : (
                            <select
                                value={selectedCircuit}
                                onChange={(e) => setSelectedCircuit(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl font-medium text-gray-800 text-sm focus:ring-2 focus:ring-blue-500"
                            >
                                {circuits.map((circuit) => (
                                    <option key={circuit.id} value={circuit.id}>
                                        {circuit.name} - {circuit.year}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Step 3: Select Stage */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-600" /> 3. Escolha a Etapa Ativa
                        </label>
                        {loadingStages ? (
                            <div className="animate-pulse bg-gray-100 h-12 rounded-xl" />
                        ) : stages.length === 0 ? (
                            <p className="text-xs text-gray-500 italic bg-gray-50 p-3 rounded-xl border border-gray-200">
                                NENHUMA ETAPA ENCONTRADA PARA ESTE CIRCUITO.
                            </p>
                        ) : (
                            <select
                                value={selectedStage}
                                onChange={(e) => setSelectedStage(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl font-medium text-gray-800 text-sm focus:ring-2 focus:ring-blue-500"
                            >
                                {stages.map((stage) => (
                                    <option key={stage.id} value={stage.id}>
                                        {stage.name} - {stage.location} ({formatDateBR(stage.date)})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Step 4: Proceed Action Button */}
                    <div className="pt-4 border-t border-gray-200 flex justify-end">
                        <button
                            onClick={handleProceedToRegistration}
                            disabled={!selectedStage}
                            className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 text-sm"
                        >
                            Prosseguir para Inscrição da Equipe
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-4 flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-cyan-600 shrink-0" />
                        <p className="text-xs text-cyan-900 leading-relaxed">
                            <strong>Dica para Pescadores:</strong> Se você estiver logado, o formulário na próxima etapa irá preencher o nome da sua equipe e os integrantes automaticamente!
                        </p>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}


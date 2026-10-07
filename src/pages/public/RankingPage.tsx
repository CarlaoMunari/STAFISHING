import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Circuit, Stage } from "../../types";
import { Trophy, Award, MapPin, Building2 } from "lucide-react";
import { Navbar } from "../../components/public/Navbar";
import { Footer } from "../../components/public/Footer";

interface TeamRanking {
    teamName: string;
    city: string;
    score: number;
    stagesCount?: number;
}

export function RankingPage() {
    const { companyName } = useParams();
    const [searchParams] = useSearchParams();

    const [companies, setCompanies] = useState<any[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

    const [circuits, setCircuits] = useState<Circuit[]>([]);
    const [selectedCircuit, setSelectedCircuit] = useState<string>("");
    const [stages, setStages] = useState<Stage[]>([]);
    const [selectedStage, setSelectedStage] = useState<string>("");
    const [activeTab, setActiveTab] = useState<"stage" | "general">("stage");
    const [stageRanking, setStageRanking] = useState<TeamRanking[]>([]);
    const [generalRanking, setGeneralRanking] = useState<TeamRanking[]>([]);
    const [loading, setLoading] = useState(false);
    const [biggestBlue, setBiggestBlue] = useState<{ team: string; size: number } | null>(null);
    const [biggestYellow, setBiggestYellow] = useState<{ team: string; size: number } | null>(null);

    useEffect(() => {
        loadCompanies();
    }, [companyName]);

    useEffect(() => {
        if (selectedCompanyId) {
            loadCircuits(selectedCompanyId);
        }
    }, [selectedCompanyId]);

    useEffect(() => {
        if (selectedCircuit) {
            loadStages();
            loadGeneralRanking();
        }
    }, [selectedCircuit]);

    useEffect(() => {
        if (selectedStage) {
            loadStageRanking();
            setActiveTab("stage");
        } else if (stages.length > 0 && !selectedStage) {
            const paramStageId = searchParams.get("stageId");
            if (paramStageId) {
                const stageExists = stages.find((s) => s.id === paramStageId);
                if (stageExists) setSelectedStage(paramStageId);
            } else {
                setSelectedStage(stages[0].id);
            }
        }
    }, [selectedStage, stages]);

    const loadCompanies = async () => {
        try {
            const { data } = await supabase
                .from("users")
                .select("id, name, slug")
                .eq("role", "company")
                .order("name", { ascending: true });

            if (data) {
                setCompanies(data);

                if (companyName) {
                    const found = data.find((c) => c.slug?.toLowerCase() === companyName.toLowerCase());
                    if (found) {
                        setSelectedCompanyId(found.id);
                    } else if (data.length > 0) {
                        setSelectedCompanyId(data[0].id);
                    }
                } else {
                    const master = data.find((c) => c.slug === 'company-master' || (c as any).email === 'sta@stafishing.com.br');
                    if (master) {
                        setSelectedCompanyId(master.id);
                    } else if (data.length > 0) {
                        setSelectedCompanyId(data[0].id);
                    }
                }
            }
        } catch (err) {
            console.error("Erro ao carregar empresas:", err);
        }
    };

    const loadCircuits = async (companyId: string) => {
        let query = supabase.from("circuits").select("*").eq("active", true);

        if (companyId) {
            query = query.eq("company_id", companyId);
        }

        const { data } = await query.order("year", { ascending: false });

        if (data) {
            const circuitsData = data.map((item: any) => ({
                id: item.id,
                name: item.name,
                year: item.year,
                description: item.description,
                active: item.active,
                createdAt: new Date(item.created_at),
            }));
            setCircuits(circuitsData);
            if (circuitsData.length > 0) {
                const paramCircuitId = searchParams.get("circuitId");
                const found = circuitsData.find((c: any) => c.id === paramCircuitId);
                setSelectedCircuit(found ? found.id : circuitsData[0].id);
            } else {
                setSelectedCircuit("");
                setStages([]);
                setStageRanking([]);
                setGeneralRanking([]);
            }
        }
    };

    const loadStages = async () => {
        const { data } = await supabase
            .from("stages")
            .select("*")
            .eq("circuit_id", selectedCircuit)
            .order("date", { ascending: true });

        if (data) {
            const stagesData = data.map((item: any) => {
                const parseDate = (dateStr: string) => {
                    if (!dateStr) return new Date();
                    if (dateStr.length === 10) {
                        return new Date(dateStr + "T12:00:00");
                    }
                    return new Date(dateStr);
                };

                return {
                    id: item.id,
                    circuitId: item.circuit_id,
                    name: item.name,
                    location: item.location,
                    date: parseDate(item.date),
                    registrationDeadline: parseDate(item.registration_deadline),
                    registrationFee: item.registration_fee || 0,
                    active: item.active,
                    status: item.status || "upcoming",
                    createdAt: new Date(item.created_at),
                };
            });
            setStages(stagesData);
            if (stagesData.length > 0) {
                setSelectedStage(stagesData[0].id);
            }
        }
    };

    const loadStageRanking = async () => {
        setLoading(true);
        try {
            const { data: results } = await supabase
                .from("results")
                .select("*, team:teams(*)")
                .eq("stage_id", selectedStage);

            if (results) {
                const ranking = results
                    .filter((r: any) => r.average_score > 0)
                    .map((r: any) => ({
                        teamName: r.team ? r.team.team_name : "Equipe Sem Nome",
                        city: r.team ? r.team.city : "",
                        score: r.average_score,
                    }))
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 20);

                setStageRanking(ranking);

                const blues = results.filter((r: any) => r.biggest_blue > 0);
                const yellows = results.filter((r: any) => r.biggest_yellow > 0);

                if (blues.length > 0) {
                    const maxBlue = blues.reduce((max, r) => (r.biggest_blue > max.biggest_blue ? r : max));
                    setBiggestBlue({
                        team: maxBlue.team ? maxBlue.team.team_name : "",
                        size: maxBlue.biggest_blue,
                    });
                } else {
                    setBiggestBlue(null);
                }

                if (yellows.length > 0) {
                    const maxYellow = yellows.reduce((max, r) => (r.biggest_yellow > max.biggest_yellow ? r : max));
                    setBiggestYellow({
                        team: maxYellow.team ? maxYellow.team.team_name : "",
                        size: maxYellow.biggest_yellow,
                    });
                } else {
                    setBiggestYellow(null);
                }
            }
        } catch (error) {
            console.error("Erro ao carregar ranking da etapa:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadGeneralRanking = async () => {
        setLoading(true);
        try {
            const { data: stagesData } = await supabase
                .from("stages")
                .select("id")
                .eq("circuit_id", selectedCircuit);

            if (!stagesData || stagesData.length === 0) {
                setGeneralRanking([]);
                setLoading(false);
                return;
            }

            const stageIds = stagesData.map((s) => s.id);

            const { data: results } = await supabase
                .from("results")
                .select("*, team:teams(*)")
                .in("stage_id", stageIds);

            if (results) {
                const teamTotals = new Map<string, { teamName: string; city: string; total: number; count: number }>();

                results.forEach((r: any) => {
                    const teamId = r.team_id;
                    const total = r.fish_measurements ? r.fish_measurements.reduce((sum: number, m: number) => sum + (m || 0), 0) : 0;

                    if (teamTotals.has(teamId)) {
                        const existing = teamTotals.get(teamId)!;
                        existing.total += total;
                        existing.count += 1;
                    } else {
                        teamTotals.set(teamId, {
                            teamName: r.team ? r.team.team_name : "Equipe",
                            city: r.team ? r.team.city : "",
                            total: total,
                            count: 1,
                        });
                    }
                });

                const ranking = Array.from(teamTotals.values())
                    .map((t) => ({
                        teamName: t.teamName,
                        city: t.city,
                        score: t.total,
                        stagesCount: t.count,
                    }))
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 20);

                setGeneralRanking(ranking);
            }
        } catch (error) {
            console.error("Erro ao carregar ranking geral:", error);
        } finally {
            setLoading(false);
        }
    };

    const getMedalBadge = (index: number) => {
        if (index === 0) return { icon: "🥇", label: "1º Lugar", bg: "bg-amber-50 border-amber-300 text-amber-900" };
        if (index === 1) return { icon: "🥈", label: "2º Lugar", bg: "bg-slate-100 border-slate-300 text-slate-900" };
        if (index === 2) return { icon: "🥉", label: "3º Lugar", bg: "bg-orange-50 border-amber-700/30 text-amber-950" };
        return { icon: `${index + 1}º`, label: `${index + 1}º`, bg: "bg-white border-gray-200 text-gray-800" };
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col pb-mobile-nav">
            <Navbar />

            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white shadow-xl">
                <div className="max-w-6xl mx-auto px-4 py-8 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600/30 p-3 rounded-2xl border border-blue-500/30 backdrop-blur-md">
                            <Trophy className="w-8 h-8 text-amber-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                                Rankings & Classificação
                            </h1>
                            <p className="text-xs md:text-sm text-blue-200">
                                Selecione a empresa e o circuito para acompanhar a pontuação
                            </p>
                        </div>
                    </div>

                    {/* Filter Selectors Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
                        {!companyName && companies.length > 0 && (
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-blue-300 mb-1 flex items-center gap-1">
                                    <Building2 className="w-3.5 h-3.5 text-cyan-400" /> Empresa / Organizador
                                </label>
                                <select
                                    value={selectedCompanyId}
                                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white font-medium text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    {companies.map((company) => (
                                        <option key={company.id} value={company.id}>
                                            {company.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-blue-300 mb-1 flex items-center gap-1">
                                <Trophy className="w-3.5 h-3.5 text-amber-400" /> Circuito Ativo
                            </label>
                            <select
                                value={selectedCircuit}
                                onChange={(e) => setSelectedCircuit(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white font-medium text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                {circuits.length === 0 ? (
                                    <option value="">Nenhum circuito cadastrado</option>
                                ) : (
                                    circuits.map((circuit) => (
                                        <option key={circuit.id} value={circuit.id}>
                                            {circuit.name} - {circuit.year}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab("stage")}
                            className={`flex-1 sm:flex-none py-3.5 px-6 font-bold text-sm text-center border-b-2 transition-all ${
                                activeTab === "stage"
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-800"
                            }`}
                        >
                            Ranking da Etapa Finalizada
                        </button>
                        <button
                            onClick={() => setActiveTab("general")}
                            className={`flex-1 sm:flex-none py-3.5 px-6 font-bold text-sm text-center border-b-2 transition-all ${
                                activeTab === "general"
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-800"
                            }`}
                        >
                            Ranking Geral do Circuito
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Container */}
            <div className="max-w-6xl mx-auto px-4 py-6 flex-grow">
                {loading ? (
                    <div className="text-center py-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
                        <p className="mt-4 text-sm font-medium text-gray-600">Carregando classificação...</p>
                    </div>
                ) : activeTab === "stage" ? (
                    <>
                        {/* Stage Selector */}
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                Escolha a Etapa Finalizada
                            </label>
                            <select
                                value={selectedStage}
                                onChange={(e) => setSelectedStage(e.target.value)}
                                className="w-full max-w-md px-4 py-3 bg-white border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 font-medium text-gray-800 text-sm"
                            >
                                {stages.length === 0 ? (
                                    <option value="">Nenhuma etapa disponível</option>
                                ) : (
                                    stages.map((stage) => (
                                        <option key={stage.id} value={stage.id}>
                                            {stage.name} - {stage.location} ({stage.date.toLocaleDateString("pt-BR")})
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>

                        {/* Highlighted Biggest Fish Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="bg-gradient-to-br from-blue-950 to-slate-900 border border-blue-800/50 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                                        🔵 Maior Peixe Azul da Etapa
                                    </span>
                                    <Award className="w-5 h-5 text-cyan-400" />
                                </div>
                                {biggestBlue ? (
                                    <div className="mt-3">
                                        <p className="text-3xl font-extrabold font-mono text-cyan-300">
                                            {biggestBlue.size.toFixed(1)} <span className="text-lg">cm</span>
                                        </p>
                                        <p className="text-sm font-bold text-white mt-1 truncate">{biggestBlue.team}</p>
                                    </div>
                                ) : (
                                    <p className="text-xs text-blue-300/70 mt-3">Nenhum registro de peixe azul</p>
                                )}
                            </div>

                            <div className="bg-gradient-to-br from-amber-950 to-slate-900 border border-amber-800/50 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                                        🟡 Maior Peixe Amarelo da Etapa
                                    </span>
                                    <Award className="w-5 h-5 text-amber-400" />
                                </div>
                                {biggestYellow ? (
                                    <div className="mt-3">
                                        <p className="text-3xl font-extrabold font-mono text-amber-300">
                                            {biggestYellow.size.toFixed(1)} <span className="text-lg">cm</span>
                                        </p>
                                        <p className="text-sm font-bold text-white mt-1 truncate">{biggestYellow.team}</p>
                                    </div>
                                ) : (
                                    <p className="text-xs text-amber-300/70 mt-3">Nenhum registro de peixe amarelo</p>
                                )}
                            </div>
                        </div>

                        {/* Mobile View: Cards */}
                        <div className="block md:hidden space-y-3">
                            {stageRanking.length === 0 ? (
                                <div className="bg-white rounded-2xl p-8 text-center text-gray-500 border border-gray-200">
                                    Nenhum resultado registrado nesta etapa.
                                </div>
                            ) : (
                                stageRanking.map((team, index) => {
                                    const medal = getMedalBadge(index);
                                    return (
                                        <div
                                            key={index}
                                            className={`p-4 rounded-2xl border shadow-sm transition-all active:scale-[0.99] ${medal.bg}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl">{medal.icon}</span>
                                                    <div>
                                                        <h4 className="font-bold text-base text-gray-900 leading-tight">
                                                            {team.teamName}
                                                        </h4>
                                                        <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                            <MapPin className="w-3 h-3" /> {team.city}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs text-gray-500 uppercase block text-[10px]">Média</span>
                                                    <span className="text-lg font-black font-mono text-blue-600">
                                                        {team.score.toFixed(2)} <span className="text-xs font-semibold">cm</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Desktop View: Table */}
                        <div className="hidden md:block bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-slate-900 text-white text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 text-left font-bold">Posição</th>
                                        <th className="px-6 py-4 text-left font-bold">Equipe</th>
                                        <th className="px-6 py-4 text-left font-bold">Cidade</th>
                                        <th className="px-6 py-4 text-right font-bold">Média</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {stageRanking.map((team, index) => (
                                        <tr key={index} className={index < 3 ? "bg-amber-500/5 hover:bg-amber-500/10 font-semibold" : "hover:bg-gray-50"}>
                                            <td className="px-6 py-4 font-bold text-gray-900">
                                                {index + 1}º
                                                {index === 0 && " 🥇"}
                                                {index === 1 && " 🥈"}
                                                {index === 2 && " 🥉"}
                                            </td>
                                            <td className="px-6 py-4 text-gray-900 font-bold">{team.teamName}</td>
                                            <td className="px-6 py-4 text-gray-600">{team.city}</td>
                                            <td className="px-6 py-4 text-right font-black font-mono text-blue-600 text-base">
                                                {team.score.toFixed(2)} cm
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    /* Classificação Geral */
                    <>
                        {/* Mobile View: General Cards */}
                        <div className="block md:hidden space-y-3">
                            {generalRanking.length === 0 ? (
                                <div className="bg-white rounded-2xl p-8 text-center text-gray-500 border border-gray-200">
                                    Nenhum resultado geral disponível.
                                </div>
                            ) : (
                                generalRanking.map((team, index) => {
                                    const medal = getMedalBadge(index);
                                    return (
                                        <div
                                            key={index}
                                            className={`p-4 rounded-2xl border shadow-sm transition-all active:scale-[0.99] ${medal.bg}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl">{medal.icon}</span>
                                                    <div>
                                                        <h4 className="font-bold text-base text-gray-900 leading-tight">
                                                            {team.teamName}
                                                        </h4>
                                                        <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                            <MapPin className="w-3 h-3" /> {team.city} • {team.stagesCount} Etapas
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs text-gray-500 uppercase block text-[10px]">Total Geral</span>
                                                    <span className="text-lg font-black font-mono text-emerald-600">
                                                        {team.score.toFixed(1)} <span className="text-xs font-semibold">cm</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Desktop View: General Table */}
                        <div className="hidden md:block bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-slate-900 text-white text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 text-left font-bold">Posição</th>
                                        <th className="px-6 py-4 text-left font-bold">Equipe</th>
                                        <th className="px-6 py-4 text-left font-bold">Cidade</th>
                                        <th className="px-6 py-4 text-center font-bold">Etapas</th>
                                        <th className="px-6 py-4 text-right font-bold">Total Geral</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {generalRanking.map((team, index) => (
                                        <tr key={index} className={index < 3 ? "bg-amber-500/5 hover:bg-amber-500/10 font-semibold" : "hover:bg-gray-50"}>
                                            <td className="px-6 py-4 font-bold text-gray-900">
                                                {index + 1}º
                                                {index === 0 && " 🥇"}
                                                {index === 1 && " 🥈"}
                                                {index === 2 && " 🥉"}
                                            </td>
                                            <td className="px-6 py-4 text-gray-900 font-bold">{team.teamName}</td>
                                            <td className="px-6 py-4 text-gray-600">{team.city}</td>
                                            <td className="px-6 py-4 text-center text-gray-600 font-medium">{team.stagesCount}</td>
                                            <td className="px-6 py-4 text-right font-black font-mono text-emerald-600 text-base">
                                                {team.score.toFixed(1)} cm
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            <Footer />
        </div>
    );
}


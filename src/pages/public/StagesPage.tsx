import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { parseLocalDate } from "../../lib/dateUtils";
import { Circuit, Stage } from "../../types";
import { Navbar } from "../../components/public/Navbar";
import { Footer } from "../../components/public/Footer";
import { MapPin, Calendar, Users, Trophy } from "lucide-react";

export function StagesPage() {
    const { companyName } = useParams();
    const [circuits, setCircuits] = useState<Circuit[]>([]);
    const [selectedCircuit, setSelectedCircuit] = useState<string>("");
    const [stages, setStages] = useState<Stage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCompanyAndCircuits();
    }, [companyName]);

    useEffect(() => {
        if (selectedCircuit) {
            loadStages();
        }
    }, [selectedCircuit]);

    const loadCompanyAndCircuits = async () => {
        let currentCompanyId: string | null = null;

        if (companyName) {
            const { data: company } = await supabase
                .from("users")
                .select("id")
                .ilike("slug", companyName.trim())
                .maybeSingle();

            if (company) {
                currentCompanyId = company.id;
            }
        } else {
            const { data: masterComp } = await supabase
                .from("users")
                .select("id")
                .eq("email", "sta@stafishing.com.br")
                .maybeSingle();
            if (masterComp) {
                currentCompanyId = masterComp.id;
            }
        }

        let query = supabase.from("circuits").select("*").eq("active", true);

        if (currentCompanyId) {
            query = query.eq("company_id", currentCompanyId);
        }

        const { data } = await query.order("year", { ascending: false });

        if (data) {
            const circuitsData = data.map((item: any) => ({
                id: item.id,
                name: item.name,
                year: item.year,
                description: item.description,
                active: item.active,
                createdAt: parseLocalDate(item.created_at),
            }));
            setCircuits(circuitsData);
            if (circuitsData.length > 0) {
                setSelectedCircuit(circuitsData[0].id);
            }
        }
    };

    const loadStages = async () => {
        setLoading(true);
        const { data } = await supabase
            .from("stages")
            .select("*")
            .eq("circuit_id", selectedCircuit)
            .order("date", { ascending: true });

        if (data) {
            const stagesData = data.map((item: any) => ({
                id: item.id,
                circuitId: item.circuit_id,
                name: item.name,
                location: item.location,
                date: parseLocalDate(item.date),
                registrationDeadline: parseLocalDate(item.registration_deadline),
                registrationFee: item.registration_fee || 0,
                active: item.active,
                status: item.status || "upcoming",
                createdAt: parseLocalDate(item.created_at),
            }));
            setStages(stagesData);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pb-mobile-nav">
            <Navbar />

            <div className="flex-grow container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Etapas do Circuito</h1>
                        <p className="text-xs md:text-sm text-gray-500 mt-1">Confira a programação e inscreva sua equipe</p>
                    </div>

                    <div className="w-full md:w-auto">
                        <select
                            value={selectedCircuit}
                            onChange={(e) => setSelectedCircuit(e.target.value)}
                            className="w-full md:w-auto px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm font-medium text-gray-800 text-sm"
                        >
                            {circuits.map((circuit) => (
                                <option key={circuit.id} value={circuit.id}>
                                    {circuit.name} - {circuit.year}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                    </div>
                ) : stages.length > 0 ? (
                    <div className="grid gap-4 md:gap-6">
                        {stages.map((stage) => (
                            <div
                                key={stage.id}
                                className="bg-white rounded-2xl shadow-sm hover:shadow-md overflow-hidden border border-gray-200/80 transition-all duration-300 flex flex-col md:flex-row"
                            >
                                {/* Date Box */}
                                <div className="bg-slate-900 text-white p-4 md:p-6 flex flex-row md:flex-col items-center justify-between md:justify-center min-w-[120px]">
                                    <div className="flex items-center md:flex-col gap-2 md:gap-0 text-center">
                                        <span className="text-2xl md:text-3xl font-black">{stage.date.getDate()}</span>
                                        <span className="text-xs md:text-sm uppercase tracking-wider font-bold text-blue-400">
                                            {stage.date.toLocaleDateString("pt-BR", { month: "short" })}
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-400 font-mono mt-0 md:mt-1">{stage.date.getFullYear()}</span>
                                </div>

                                {/* Content */}
                                <div className="p-5 md:p-6 flex-grow flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-1.5">{stage.name}</h3>
                                        <div className="flex items-center text-gray-600 text-xs md:text-sm mb-1">
                                            <MapPin className="w-4 h-4 mr-2 text-blue-500 shrink-0" />
                                            {stage.location}
                                        </div>
                                        <div className="flex items-center text-gray-500 text-xs md:text-sm">
                                            <Calendar className="w-4 h-4 mr-2 text-blue-500 shrink-0" />
                                            {stage.date.toLocaleDateString("pt-BR", { weekday: "long" })}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-2 md:mt-0">
                                        {stage.status === "finished" ? (
                                            <Link
                                                to="/ranking"
                                                className="w-full sm:w-auto px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs md:text-sm transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 active:scale-95"
                                            >
                                                <Trophy className="w-4 h-4" />
                                                Ver Classificação
                                            </Link>
                                        ) : (
                                            <Link
                                                to={companyName ? `/${companyName}/register/${stage.id}` : `/register/${stage.id}`}
                                                className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 active:scale-95"
                                            >
                                                <Users className="w-4 h-4" />
                                                Inscrever Equipe
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-200">
                        <p className="text-gray-500 text-sm md:text-base">Nenhuma etapa encontrada para este circuito.</p>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}


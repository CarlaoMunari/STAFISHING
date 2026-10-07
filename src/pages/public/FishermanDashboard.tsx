import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { Navbar } from "../../components/public/Navbar";
import { Footer } from "../../components/public/Footer";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { Anchor, Calendar, Trophy, MapPin, Sparkles, CheckCircle2, AlertCircle, Save, LogOut } from "lucide-react";

export function FishermanDashboard() {
    const { currentUser, signOut } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<"registrations" | "profile" | "gps" | "rankings">("registrations");

    // Profile state
    const [teamName, setTeamName] = useState("");
    const [city, setCity] = useState("");
    const [responsibleName, setResponsibleName] = useState("");
    const [responsibleEmail, setResponsibleEmail] = useState("");
    const [responsiblePhone, setResponsiblePhone] = useState("");
    const [responsiblePhone2, setResponsiblePhone2] = useState("");
    const [members, setMembers] = useState([
        { name: "", nickname: "", rg: "" },
        { name: "", nickname: "", rg: "" },
        { name: "", nickname: "", rg: "" },
        { name: "", nickname: "", rg: "" },
    ]);

    const [savingProfile, setSavingProfile] = useState(false);
    const [profileSavedMsg, setProfileSavedMsg] = useState("");

    // Registrations & GPS Keys
    const [teamRegistrations, setTeamRegistrations] = useState<any[]>([]);
    const [loadingRegistrations, setLoadingRegistrations] = useState(true);
    const [gpsKeysMap, setGpsKeysMap] = useState<Record<string, string>>({});

    const memberLabels = ["Capitão (Você)", "Pescador 1", "Pescador 2", "Reserva"];

    useEffect(() => {
        if (currentUser) {
            loadFishermanData();
        } else {
            setLoadingRegistrations(false);
        }
    }, [currentUser]);

    const loadFishermanData = async () => {
        if (!currentUser) return;
        setLoadingRegistrations(true);

        try {
            setResponsibleName(currentUser.name || "");
            setResponsibleEmail(currentUser.email || "");

            // Load profile from localStorage if exists
            const savedProfile = localStorage.getItem(`fisherman_profile_${currentUser.id}`);
            if (savedProfile) {
                try {
                    const parsed = JSON.parse(savedProfile);
                    setTeamName(parsed.teamName || "");
                    setCity(parsed.city || "");
                    setResponsibleName(parsed.responsibleName || currentUser.name || "");
                    setResponsiblePhone(parsed.responsiblePhone || "");
                    setResponsiblePhone2(parsed.responsiblePhone2 || "");
                    if (parsed.members && parsed.members.length === 4) {
                        setMembers(parsed.members);
                    }
                } catch (e) {
                    console.error("Error parsing saved profile:", e);
                }
            }

            // Search teams registered by user email
            const { data: teamsData } = await supabase
                .from("teams")
                .select(`
                    *,
                    stages (id, name, date, location, circuit_id, company_id, circuits(name, year))
                `)
                .eq("responsible_email", currentUser.email)
                .order("created_at", { ascending: false });

            if (teamsData) {
                setTeamRegistrations(teamsData);

                if (teamsData.length > 0 && (!teamName || !city)) {
                    const latest = teamsData[0];
                    setTeamName(latest.team_name || "");
                    setCity(latest.city || "");
                    setResponsibleName(latest.responsible_name || currentUser.name || "");
                    setResponsiblePhone(latest.responsible_phone || "");
                    setResponsiblePhone2(latest.responsible_phone2 || "");
                    if (latest.members && Array.isArray(latest.members)) {
                        setMembers(latest.members);
                    }
                }

                // Fetch active GPS access keys for paid registrations
                const paidTeamIds = teamsData.filter(t => t.paid).map(t => t.id);
                if (paidTeamIds.length > 0) {
                    const { data: keysData } = await supabase
                        .from("gps_access_keys")
                        .select("team_id, access_key, active")
                        .in("team_id", paidTeamIds)
                        .eq("active", true);

                    if (keysData) {
                        const map: Record<string, string> = {};
                        keysData.forEach((k: any) => {
                            map[k.team_id] = k.access_key;
                        });
                        setGpsKeysMap(map);
                    }
                }
            }
        } catch (error) {
            console.error("Erro ao carregar dados do pescador:", error);
        } finally {
            setLoadingRegistrations(false);
        }
    };

    const handleSaveProfile = () => {
        if (!currentUser) return;
        setSavingProfile(true);
        setProfileSavedMsg("");

        try {
            const profileData = {
                teamName: teamName.trim(),
                city: city.trim(),
                responsibleName: responsibleName.trim(),
                responsibleEmail: responsibleEmail.trim(),
                responsiblePhone: responsiblePhone.trim(),
                responsiblePhone2: responsiblePhone2.trim(),
                members: members
            };

            localStorage.setItem(`fisherman_profile_${currentUser.id}`, JSON.stringify(profileData));
            setProfileSavedMsg("Perfil da equipe salvo com sucesso! Será preenchido automaticamente nas próximas inscrições.");
        } catch (e) {
            console.error("Erro ao salvar perfil:", e);
        } finally {
            setSavingProfile(false);
        }
    };

    const updateMember = (index: number, field: string, value: string) => {
        const updated = [...members];
        updated[index] = { ...updated[index], [field]: value };
        setMembers(updated);
    };

    if (!currentUser) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 text-white">
                <Anchor className="w-16 h-16 text-cyan-400 mb-4 animate-bounce" />
                <h1 className="text-2xl font-bold mb-2">Área do Pescador</h1>
                <p className="text-sm text-gray-400 mb-6 text-center max-w-md">
                    Faça login com sua conta para visualizar suas inscrições, perfil salvo da equipe e chaves de rastreamento GPS.
                </p>
                <Button onClick={() => navigate("/login")} className="bg-blue-600 hover:bg-blue-500">
                    Ir para Login
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col pb-mobile-nav">
            <Navbar />

            {/* Header Banner */}
            <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 text-white py-8 shadow-xl">
                <div className="container mx-auto px-4 max-w-5xl">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600/30 p-3 rounded-2xl border border-blue-500/30 backdrop-blur-md">
                                <Anchor className="w-8 h-8 text-cyan-400" />
                            </div>
                            <div>
                                <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">
                                    Painel do Capitão / Pescador
                                </span>
                                <h1 className="text-2xl font-black text-white">
                                    Bem-vindo, {currentUser.name || "Capitão"}!
                                </h1>
                            </div>
                        </div>

                        <button
                            onClick={() => signOut()}
                            className="flex items-center gap-2 text-xs bg-slate-800/80 hover:bg-rose-600 text-gray-300 hover:text-white px-3.5 py-2 rounded-xl border border-slate-700 transition-colors"
                        >
                            <LogOut className="w-4 h-4" /> Sair
                        </button>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex overflow-x-auto gap-2 mt-6 pt-4 border-t border-slate-800 scrollbar-none">
                        <button
                            onClick={() => setActiveTab("registrations")}
                            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                                activeTab === "registrations" ? "bg-blue-600 text-white shadow-md" : "text-gray-400 hover:text-white"
                            }`}
                        >
                            <Calendar className="w-4 h-4 inline mr-1.5" />
                            Minhas Inscrições ({teamRegistrations.length})
                        </button>
                        <button
                            onClick={() => setActiveTab("profile")}
                            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                                activeTab === "profile" ? "bg-blue-600 text-white shadow-md" : "text-gray-400 hover:text-white"
                            }`}
                        >
                            <Sparkles className="w-4 h-4 inline mr-1.5" />
                            Perfil da Equipe Salvo
                        </button>
                        <button
                            onClick={() => setActiveTab("gps")}
                            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                                activeTab === "gps" ? "bg-blue-600 text-white shadow-md" : "text-gray-400 hover:text-white"
                            }`}
                        >
                            <MapPin className="w-4 h-4 inline mr-1.5" />
                            GPS Tracker
                        </button>
                        <button
                            onClick={() => navigate("/ranking")}
                            className="px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap text-gray-400 hover:text-white transition-all"
                        >
                            <Trophy className="w-4 h-4 inline mr-1.5" />
                            Meus Rankings
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="container mx-auto px-4 py-6 max-w-5xl flex-grow">
                {loadingRegistrations ? (
                    <div className="text-center py-16">
                        <LoadingSpinner />
                        <p className="mt-3 text-xs text-gray-500">Carregando informações do pescador...</p>
                    </div>
                ) : activeTab === "registrations" ? (
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-gray-900">Inscrições Realizadas em Circuitos</h2>

                        {teamRegistrations.length === 0 ? (
                            <Card className="p-8 text-center space-y-3">
                                <AlertCircle className="w-12 h-12 text-blue-500 mx-auto" />
                                <h3 className="text-base font-bold text-gray-800">Nenhuma inscrição encontrada</h3>
                                <p className="text-xs text-gray-500 max-w-md mx-auto">
                                    Sua equipe ainda não se inscreveu em nenhuma etapa. Navegue pelas etapas ativas e inscreva-se com 1 clique!
                                </p>
                                <Button onClick={() => navigate("/inscricao")} className="bg-blue-600 text-xs">
                                    Ver Etapas com Inscrição Aberta
                                </Button>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {teamRegistrations.map((reg) => {
                                    const stage = reg.stages;
                                    const gpsKey = gpsKeysMap[reg.id];

                                    return (
                                        <Card key={reg.id} className="p-5 space-y-3 border border-gray-200">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded">
                                                        {stage?.circuits?.name || "Circuito"}
                                                    </span>
                                                    <h3 className="font-bold text-base text-gray-900 mt-1">
                                                        {stage?.name || "Etapa"}
                                                    </h3>
                                                    <p className="text-xs text-gray-500">
                                                        {stage?.location} • {stage?.date ? new Date(stage.date).toLocaleDateString("pt-BR") : ""}
                                                    </p>
                                                </div>

                                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                                    reg.paid
                                                        ? "bg-emerald-100 text-emerald-800"
                                                        : "bg-amber-100 text-amber-800"
                                                }`}>
                                                    {reg.paid ? "Confirmado" : "Pagamento Pendente"}
                                                </span>
                                            </div>

                                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs space-y-1">
                                                <p className="text-gray-700 font-semibold">Equipe: {reg.team_name} ({reg.city})</p>
                                                <p className="text-gray-500">Responsável: {reg.responsible_name}</p>
                                            </div>

                                            {/* GPS Access Shortcut */}
                                            {reg.paid && gpsKey ? (
                                                <div className="bg-slate-900 text-white p-3 rounded-xl flex items-center justify-between">
                                                    <div>
                                                        <span className="text-[10px] text-cyan-400 font-bold uppercase block">Chave GPS Ativa</span>
                                                        <span className="font-mono text-sm font-bold tracking-wider">{gpsKey}</span>
                                                    </div>
                                                    <Button
                                                        onClick={() => navigate(`/gps?key=${gpsKey}`)}
                                                        className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs py-1.5 px-3"
                                                    >
                                                        Abrir GPS
                                                    </Button>
                                                </div>
                                            ) : null}
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : activeTab === "profile" ? (
                    <Card className="p-6 md:p-8 space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Perfil Salvo da Equipe</h2>
                            <p className="text-xs text-gray-500 mt-1">
                                Preencha estes dados uma vez para reaproveitar automaticamente ao se inscrever em qualquer etapa de qualquer empresa!
                            </p>
                        </div>

                        {profileSavedMsg && (
                            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-semibold flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                <span>{profileSavedMsg}</span>
                            </div>
                        )}

                        <div className="grid gap-4 md:grid-cols-2">
                            <Input
                                label="Nome da Equipe"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                placeholder="Ex: Equipe Tucunaré"
                            />
                            <Input
                                label="Cidade / UF"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="Ex: São Paulo - SP"
                            />
                            <Input
                                label="Nome do Responsável / Capitão"
                                value={responsibleName}
                                onChange={(e) => setResponsibleName(e.target.value)}
                                placeholder="Seu nome completo"
                            />
                            <Input
                                label="WhatsApp Principal"
                                value={responsiblePhone}
                                onChange={(e) => setResponsiblePhone(e.target.value)}
                                placeholder="(11) 99999-9999"
                            />
                        </div>

                        <div className="space-y-4 pt-4 border-t border-gray-200">
                            <h3 className="text-sm font-bold text-gray-900">Integrantes Fixos da Equipe (4 Pescadores)</h3>
                            {members.map((m, idx) => (
                                <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
                                    <span className="text-xs font-extrabold text-blue-700 uppercase tracking-wider">
                                        {memberLabels[idx]}
                                    </span>
                                    <div className="grid gap-3 md:grid-cols-3">
                                        <Input
                                            label="Nome"
                                            value={m.name}
                                            onChange={(e) => updateMember(idx, "name", e.target.value)}
                                            placeholder="Nome completo"
                                        />
                                        <Input
                                            label="Apelido"
                                            value={m.nickname}
                                            onChange={(e) => updateMember(idx, "nickname", e.target.value)}
                                            placeholder="Apelido"
                                        />
                                        <Input
                                            label="RG / CPF"
                                            value={m.rg}
                                            onChange={(e) => updateMember(idx, "rg", e.target.value)}
                                            placeholder="RG ou CPF"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end">
                            <Button
                                onClick={handleSaveProfile}
                                loading={savingProfile}
                                className="bg-blue-600 hover:bg-blue-500 font-bold text-xs py-3 px-6"
                            >
                                <Save className="w-4 h-4 mr-2" /> Salvar Perfil para Próximas Inscrições
                            </Button>
                        </div>
                    </Card>
                ) : (
                    /* GPS Tab */
                    <Card className="p-6 md:p-8 space-y-4">
                        <h2 className="text-lg font-bold text-gray-900">Chaves de Rastreamento GPS</h2>
                        <p className="text-xs text-gray-500">
                            Se a sua inscrição estiver confirmada e paga, sua chave de acesso estará listada abaixo. Clique em "Iniciar Rastreamento" para transmitir a localização do seu celular para a comissão julgadora.
                        </p>

                        <div className="space-y-3">
                            {teamRegistrations.filter(t => t.paid).length === 0 ? (
                                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-800">
                                    Nenhuma etapa com inscrição confirmada e paga até o momento.
                                </div>
                            ) : (
                                teamRegistrations.filter(t => t.paid).map(t => {
                                    const key = gpsKeysMap[t.id];
                                    return (
                                        <div key={t.id} className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between">
                                            <div>
                                                <h4 className="font-bold text-sm text-cyan-300">{t.stages?.name}</h4>
                                                <p className="text-xs text-gray-400">Equipe: {t.team_name}</p>
                                                <p className="font-mono text-xs font-bold text-white mt-1">Chave: {key || "Aguardando geração..."}</p>
                                            </div>
                                            {key && (
                                                <Link
                                                    to={`/gps?key=${key}`}
                                                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs py-2 px-4 rounded-xl"
                                                >
                                                    Iniciar Rastreamento GPS
                                                </Link>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </Card>
                )}
            </div>

            <Footer />
        </div>
    );
}


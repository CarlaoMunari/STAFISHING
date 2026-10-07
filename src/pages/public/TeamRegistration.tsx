import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { parseLocalDate, formatDateBR } from "../../lib/dateUtils";
import { Stage, TeamMember, Team } from "../../types";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { Navbar } from "../../components/public/Navbar";
import { Users, Search, UserPlus, Sparkles } from "lucide-react";

export function TeamRegistration() {
    const { stageId, companyName } = useParams<{ stageId: string; companyName?: string }>();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const [stage, setStage] = useState<Stage | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Team search state
    const [searchMode, setSearchMode] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Team[]>([]);
    const [selectedExistingTeam, setSelectedExistingTeam] = useState<Team | null>(null);
    const [searching, setSearching] = useState(false);
    const [autoFilled, setAutoFilled] = useState(false);

    // Form state - Dados da Equipe
    const [teamName, setTeamName] = useState("");
    const [city, setCity] = useState("");

    // Form state - Dados do Responsável
    const [responsibleName, setResponsibleName] = useState("");
    const [responsibleEmail, setResponsibleEmail] = useState("");
    const [responsiblePhone, setResponsiblePhone] = useState("");
    const [responsiblePhone2, setResponsiblePhone2] = useState("");

    // Form state - Integrantes (4 fixos)
    const [members, setMembers] = useState<TeamMember[]>([
        { name: "", nickname: "", rg: "" }, // Capitão
        { name: "", nickname: "", rg: "" }, // Pescador 1
        { name: "", nickname: "", rg: "" }, // Pescador 2
        { name: "", nickname: "", rg: "" }, // Reserva
    ]);

    const [error, setError] = useState("");

    const memberLabels = ["Capitão", "Pescador 1", "Pescador 2", "Reserva"];

    useEffect(() => {
        loadStage();
    }, [stageId]);

    // Auto-fill logged in fisherman profile if available
    useEffect(() => {
        if (currentUser) {
            loadSavedFishermanProfile();
        }
    }, [currentUser]);

    const loadSavedFishermanProfile = () => {
        try {
            if (!currentUser) return;
            const saved = localStorage.getItem(`fisherman_profile_${currentUser.id}`);
            if (saved) {
                const profile = JSON.parse(saved);
                if (profile.teamName) {
                    setTeamName(profile.teamName || "");
                    setCity(profile.city || "");
                    setResponsibleName(profile.responsibleName || currentUser.name || "");
                    setResponsibleEmail(profile.responsibleEmail || currentUser.email || "");
                    setResponsiblePhone(profile.responsiblePhone || "");
                    setResponsiblePhone2(profile.responsiblePhone2 || "");
                    if (profile.members && profile.members.length === 4) {
                        setMembers(profile.members);
                    }
                    setAutoFilled(true);
                    setSearchMode(false);
                }
            } else if (currentUser.name || currentUser.email) {
                setResponsibleName(currentUser.name || "");
                setResponsibleEmail(currentUser.email || "");
            }
        } catch (e) {
            console.error("Error auto-filling fisherman profile:", e);
        }
    };

    const searchTeams = async () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            const { data, error } = await supabase
                .from("teams")
                .select("*")
                .ilike("team_name", `%${searchQuery}%`)
                .limit(5);

            if (error) throw error;

            if (data) {
                const teams = data.map((item: any) => ({
                    id: item.id,
                    stageId: item.stage_id,
                    teamName: item.team_name,
                    city: item.city,
                    responsibleName: item.responsible_name,
                    responsibleEmail: item.responsible_email,
                    responsiblePhone: item.responsible_phone,
                    responsiblePhone2: item.responsible_phone2,
                    members: item.members,
                    paid: item.paid,
                    registeredAt: parseLocalDate(item.created_at),
                }));
                setSearchResults(teams);
            }
        } catch (error) {
            console.error("Erro ao buscar equipes:", error);
        } finally {
            setSearching(false);
        }
    };

    const selectExistingTeam = (team: Team) => {
        setSelectedExistingTeam(team);
        setTeamName(team.teamName);
        setCity(team.city);
        setResponsibleName(team.responsibleName);
        setResponsibleEmail(team.responsibleEmail);
        setResponsiblePhone(team.responsiblePhone);
        setResponsiblePhone2(team.responsiblePhone2 || "");
        setMembers(team.members);
        setSearchMode(false);
        setSearchResults([]);
    };

    const resetToNewTeam = () => {
        setSelectedExistingTeam(null);
        setSearchMode(false);
        setSearchQuery("");
        setSearchResults([]);
        if (!autoFilled) {
            setTeamName("");
            setCity("");
            setResponsibleName(currentUser?.name || "");
            setResponsibleEmail(currentUser?.email || "");
            setResponsiblePhone("");
            setResponsiblePhone2("");
            setMembers([
                { name: "", nickname: "", rg: "" },
                { name: "", nickname: "", rg: "" },
                { name: "", nickname: "", rg: "" },
                { name: "", nickname: "", rg: "" },
            ]);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchMode && searchQuery) {
                searchTeams();
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, searchMode]);

    const loadStage = async () => {
        if (!stageId) return;
        try {
            const { data, error } = await supabase
                .from("stages")
                .select("*")
                .eq("id", stageId)
                .single();

            if (error) throw error;

            if (data) {
                setStage({
                    id: data.id,
                    circuitId: data.circuit_id,
                    companyId: data.company_id,
                    name: data.name,
                    date: parseLocalDate(data.date),
                    location: data.location,
                    registrationFee: data.registration_fee,
                    imageUrl: data.image_url,
                    createdAt: parseLocalDate(data.created_at),
                } as Stage);

                if (data.company_id) {
                    const { data: comp } = await supabase
                        .from("users")
                        .select("slug")
                        .eq("id", data.company_id)
                        .maybeSingle();

                    if (comp?.slug) {
                        localStorage.setItem("last_company_slug", comp.slug);
                        window.dispatchEvent(new Event("company_slug_updated"));
                    }
                }
            }
        } catch (error) {
            console.error("Erro ao carregar etapa:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateMember = (index: number, field: keyof TeamMember, value: string) => {
        const updated = [...members];
        updated[index] = { ...updated[index], [field]: value };
        setMembers(updated);
    };

    const validateForm = async (): Promise<boolean> => {
        setError("");
        if (!teamName.trim()) {
            setError("O Nome da Equipe é obrigatório.");
            return false;
        }
        if (!city.trim()) {
            setError("A Cidade da Equipe é obrigatória.");
            return false;
        }
        if (!responsibleName.trim()) {
            setError("O Nome do Responsável é obrigatório.");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!(await validateForm())) return;

        setSubmitting(true);
        setError("");

        try {
            const { data: existingTeam } = await supabase
                .from("teams")
                .select("id")
                .eq("stage_id", stageId)
                .ilike("team_name", teamName.trim())
                .maybeSingle();

            let teamId;
            const targetCompanyId = stage?.companyId || (stage as any)?.company_id || null;

            const teamData: any = {
                stage_id: stageId,
                company_id: targetCompanyId,
                team_name: teamName.trim(),
                city: city.trim(),
                responsible_name: responsibleName.trim(),
                responsible_email: responsibleEmail.trim(),
                responsible_phone: responsiblePhone.trim(),
                responsible_phone2: responsiblePhone2.trim() || null,
                members: members,
                payment_method: "direct"
            };

            if (existingTeam) {
                const { error: updateError } = await supabase
                    .from("teams")
                    .update(teamData)
                    .eq("id", existingTeam.id);

                if (updateError) throw updateError;
                teamId = existingTeam.id;
            } else {
                // Atribuir próximo número vago (ex: 28..37, pula 38 ocupado e segue para 39)
                const { data: stageTeams } = await supabase
                    .from("teams")
                    .select("team_number")
                    .eq("stage_id", stageId);

                const taken = new Set((stageTeams || []).map((t: any) => t.team_number).filter(Boolean));
                let nextNum = 1;
                while (taken.has(nextNum)) {
                    nextNum++;
                }
                teamData.team_number = nextNum;

                const { data: newTeam, error: insertError } = await supabase
                    .from("teams")
                    .insert(teamData)
                    .select()
                    .single();

                if (insertError) throw insertError;
                teamId = newTeam.id;
            }

            // Garantir que a equipe SEMPRE tenha um registro de pagamento (default 'direct')
            const { data: existingPayment } = await supabase
                .from("payments")
                .select("id")
                .eq("team_id", teamId)
                .eq("stage_id", stageId)
                .maybeSingle();

            if (!existingPayment) {
                const fee = stage?.registrationFee || (stage as any)?.registration_fee || 0;
                await supabase.from("payments").insert({
                    team_id: teamId,
                    stage_id: stageId,
                    company_id: targetCompanyId,
                    amount: fee,
                    payment_method: "direct",
                    status: "pending"
                });
            }

            if (currentUser) {
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
            }

            const activeSlug = companyName || localStorage.getItem("last_company_slug");
            const checkoutPath = activeSlug ? `/${activeSlug}/checkout` : "/checkout";

            const checkoutStateTeam = {
                id: teamId,
                stageId: stageId,
                teamName: teamName.trim(),
                city: city.trim(),
                responsibleName: responsibleName.trim(),
                responsibleEmail: responsibleEmail.trim(),
                responsiblePhone: responsiblePhone.trim(),
                responsiblePhone2: responsiblePhone2.trim(),
                members: members,
                companyId: targetCompanyId
            };

            navigate(`${checkoutPath}?teamId=${teamId}&stageId=${stageId}`, {
                state: {
                    team: checkoutStateTeam,
                    stage: stage
                }
            });
        } catch (err: any) {
            console.error("Erro ao salvar inscrição:", err);
            setError(err.message || "Erro ao salvar a inscrição. Tente novamente.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50 py-8 px-4 pb-mobile-nav">
                <div className="max-w-4xl mx-auto space-y-6">
                    {stage && (
                        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl text-white p-6 md:p-8 shadow-xl">
                            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                                Formulário de Inscrição
                            </span>
                            <h1 className="text-2xl md:text-3xl font-black mt-1">{stage.name}</h1>
                            <p className="text-xs md:text-sm text-blue-200 mt-1">
                                {stage.location} • {formatDateBR(stage.date)}
                            </p>

                            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                                <span className="text-xs text-gray-400">Valor da Inscrição:</span>
                                <span className="text-2xl font-black font-mono text-cyan-300">
                                    R$ {stage.registrationFee.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    )}

                    {autoFilled && !searchMode && (
                        <div className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-900 rounded-2xl p-4 flex items-center justify-between gap-2 shadow-sm">
                            <div className="flex items-center gap-2 text-xs md:text-sm font-semibold text-cyan-800">
                                <Sparkles className="w-5 h-5 text-cyan-600 shrink-0" />
                                <span>Dados da sua equipe salvos foram preenchidos automaticamente!</span>
                            </div>
                            <span className="text-xs bg-cyan-600 text-white font-bold px-2.5 py-1 rounded-lg">
                                Reuso Ativo
                            </span>
                        </div>
                    )}

                    {searchMode ? (
                        <Card className="p-6 md:p-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Search className="w-5 h-5 text-blue-600" />
                                Identificação da Equipe
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-700 mb-2">
                                        Buscar Equipe Existente
                                    </label>
                                    <div className="relative">
                                        <Input
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Digite o nome da equipe..."
                                            className="w-full pl-10"
                                        />
                                        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    </div>
                                </div>

                                {searching && (
                                    <div className="text-center py-4">
                                        <LoadingSpinner />
                                        <span className="text-xs text-gray-500 block mt-2">Buscando equipes...</span>
                                    </div>
                                )}

                                {searchResults.length > 0 && (
                                    <div className="space-y-2 border border-gray-200 rounded-xl p-3 bg-gray-50">
                                        <p className="text-xs font-bold text-gray-600 mb-2">Equipes encontradas:</p>
                                        {searchResults.map((team) => (
                                            <div
                                                key={team.id}
                                                onClick={() => selectExistingTeam(team)}
                                                className="p-3 bg-white hover:bg-blue-50 rounded-lg border border-gray-200 cursor-pointer flex items-center justify-between transition-colors"
                                            >
                                                <div>
                                                    <h4 className="font-bold text-sm text-gray-900">{team.teamName}</h4>
                                                    <p className="text-xs text-gray-500">{team.city} • Resp: {team.responsibleName}</p>
                                                </div>
                                                <Button variant="outline" className="text-xs py-1 px-3">
                                                    Usar esta Equipe
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3 justify-between items-center">
                                    <span className="text-xs text-gray-500">Sua equipe não apareceu na busca?</span>
                                    <Button
                                        onClick={resetToNewTeam}
                                        variant="primary"
                                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                                    >
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        Cadastrar Nova Equipe
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
                            <p className="text-xs md:text-sm font-semibold text-blue-900">
                                {selectedExistingTeam ? (
                                    <span>Usando dados da equipe: <strong>{selectedExistingTeam.teamName}</strong></span>
                                ) : (
                                    <span>Preenchendo dados para inscrição da equipe</span>
                                )}
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                className="text-xs py-1.5 px-3"
                                onClick={() => {
                                    setSearchMode(true);
                                    setSelectedExistingTeam(null);
                                }}
                            >
                                Trocar Equipe
                            </Button>
                        </div>
                    )}

                    {!searchMode && (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <Card className="p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-blue-600" />
                                    Dados da Equipe
                                </h2>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <Input
                                        label="Nome da Equipe *"
                                        required
                                        value={teamName}
                                        onChange={(e) => setTeamName(e.target.value)}
                                        placeholder="Ex: Equipe Tucunaré"
                                    />
                                    <Input
                                        label="Cidade *"
                                        required
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        placeholder="Ex: São Paulo"
                                    />
                                </div>
                            </Card>

                            <Card className="p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">
                                    Dados do Responsável / Capitão
                                </h2>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <Input
                                        label="Nome Completo do Responsável *"
                                        required
                                        value={responsibleName}
                                        onChange={(e) => setResponsibleName(e.target.value)}
                                        placeholder="Nome do capitão"
                                    />
                                    <Input
                                        label="E-mail"
                                        type="email"
                                        value={responsibleEmail}
                                        onChange={(e) => setResponsibleEmail(e.target.value)}
                                        placeholder="email@exemplo.com"
                                    />
                                    <Input
                                        label="Telefone Principal (WhatsApp)"
                                        value={responsiblePhone}
                                        onChange={(e) => setResponsiblePhone(e.target.value)}
                                        placeholder="(11) 99999-9999"
                                    />
                                    <Input
                                        label="Telefone Secundário (Opcional)"
                                        value={responsiblePhone2}
                                        onChange={(e) => setResponsiblePhone2(e.target.value)}
                                        placeholder="(11) 99999-9999"
                                    />
                                </div>
                            </Card>

                            <Card className="p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">
                                    Integrantes da Equipe (4 Pescadores)
                                </h2>
                                <div className="space-y-4">
                                    {members.map((member, index) => (
                                        <div key={index} className="border-b border-gray-100 pb-4 last:border-0">
                                            <h3 className="text-xs font-extrabold text-blue-700 uppercase tracking-wider mb-2">
                                                {memberLabels[index]}
                                            </h3>
                                            <div className="grid gap-3 md:grid-cols-3">
                                                <Input
                                                    label="Nome Completo"
                                                    value={member.name}
                                                    onChange={(e) => updateMember(index, "name", e.target.value)}
                                                    placeholder="Nome completo"
                                                />
                                                <Input
                                                    label="Apelido"
                                                    value={member.nickname}
                                                    onChange={(e) => updateMember(index, "nickname", e.target.value)}
                                                    placeholder="Apelido"
                                                />
                                                <Input
                                                    label="RG ou CPF"
                                                    value={member.rg}
                                                    onChange={(e) => updateMember(index, "rg", e.target.value)}
                                                    placeholder="RG ou CPF"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-semibold">
                                    {error}
                                </div>
                            )}

                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    loading={submitting}
                                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl shadow-lg hover:from-blue-500 hover:to-cyan-500"
                                >
                                    Ir para Pagamento
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </>
    );
}


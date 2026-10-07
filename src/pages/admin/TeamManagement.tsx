import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Users, CheckCircle, XCircle, Clock, DollarSign, Trash2, Edit2, Save, X, UserCheck, ShieldCheck, PlusCircle } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';

interface TeamMember {
    name: string;
    nickname?: string;
    rg?: string;
}

const MEMBER_ROLES = ['Capitão', 'Pescador 1', 'Pescador 2', 'Reserva / Pescador 3'];

interface TeamWithPayment {
    id: string;
    teamNumber: number;
    stageId: string;
    companyId: string;
    teamName: string;
    city: string;
    responsibleName: string;
    responsibleEmail: string;
    responsiblePhone: string;
    responsiblePhone2: string;
    members: TeamMember[];
    paid: boolean;
    exemptRegistration: boolean;
    stageName: string;
    paymentStatus: 'pending' | 'paid' | 'rejected' | 'none';
    paymentMethod: string;
    registeredAt: Date;
}

export function TeamManagement() {
    const { companyId } = useCompany();
    const navigate = useNavigate();
    const [teams, setTeams] = useState<TeamWithPayment[]>([]);
    const [circuits, setCircuits] = useState<any[]>([]);
    const [stages, setStages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [teamToDelete, setTeamToDelete] = useState<{ id: string, name: string } | null>(null);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState<TeamWithPayment | null>(null);
    const [editForm, setEditForm] = useState({
        teamNumber: '' as number | string,
        teamName: '',
        city: '',
        responsibleName: '',
        responsibleEmail: '',
        phone: '',
        phone2: '',
        members: [
            { name: '', nickname: '', rg: '' },
            { name: '', nickname: '', rg: '' },
            { name: '', nickname: '', rg: '' },
            { name: '', nickname: '', rg: '' }
        ] as TeamMember[],
        paymentMethod: 'direct',
        paymentStatus: 'pending',
        exemptRegistration: false
    });

    // Quick Registration Modal State
    const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
    const [quickNumber, setQuickNumber] = useState<number | ''>('');
    const [quickName, setQuickName] = useState('');
    const [quickCity, setQuickCity] = useState('');
    const [quickRespName, setQuickRespName] = useState('');
    const [quickPhone, setQuickPhone] = useState('');
    const [quickPaid, setQuickPaid] = useState(true);
    const [quickLoading, setQuickLoading] = useState(false);

    const [selectedCircuit, setSelectedCircuit] = useState('');
    const [selectedStage, setSelectedStage] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    useEffect(() => {
        loadCircuits();
    }, [companyId]);

    useEffect(() => {
        if (selectedCircuit) {
            loadStages(selectedCircuit);
        } else {
            setStages([]);
            setSelectedStage('');
        }
    }, [selectedCircuit]);

    useEffect(() => {
        if (selectedStage) {
            loadTeams();
        } else {
            setTeams([]);
        }
    }, [selectedStage, filterStatus]);

    const loadCircuits = async () => {
        try {
            let query = supabase
                .from('circuits')
                .select('id, name, year')
                .eq('active', true)
                .order('year', { ascending: false });

            if (companyId) {
                query = query.eq('company_id', companyId);
            }

            const { data, error } = await query;
            if (error) throw error;

            setCircuits(data || []);
            if (data && data.length > 0) {
                setSelectedCircuit(data[0].id);
            }
        } catch (error) {
            console.error('Erro ao carregar circuitos:', error);
        }
    };

    const loadStages = async (circuitId: string) => {
        try {
            const { data, error } = await supabase
                .from('stages')
                .select('id, name, date')
                .eq('circuit_id', circuitId)
                .order('date', { ascending: false });

            if (error) throw error;

            setStages(data || []);
            if (data && data.length > 0) {
                setSelectedStage(data[0].id);
            }
        } catch (error) {
            console.error('Erro ao carregar etapas:', error);
        }
    };

    const loadTeams = async () => {
        setLoading(true);
        try {
            // Buscar equipes e seus pagamentos
            const { data: teamsData, error: teamsError } = await supabase
                .from('teams')
                .select(`
                    id,
                    stage_id,
                    company_id,
                    team_number,
                    team_name,
                    city,
                    responsible_name,
                    responsible_email,
                    responsible_phone,
                    responsible_phone2,
                    members,
                    paid,
                    exempt_registration,
                    payment_method,
                    created_at,
                    stages (name)
                `)
                .eq('stage_id', selectedStage);

            if (teamsError) throw teamsError;

            // Buscar pagamentos
            const { data: paymentsData, error: paymentsError } = await supabase
                .from('payments')
                .select('team_id, status, payment_method')
                .eq('stage_id', selectedStage);

            if (paymentsError) throw paymentsError;

            // Mapear pagamentos por team_id
            const paymentMap = new Map();
            paymentsData?.forEach(p => {
                paymentMap.set(p.team_id, {
                    status: p.status,
                    method: p.payment_method
                });
            });

            // Combinar dados
            const teamsWithPayment: TeamWithPayment[] = (teamsData || []).map((team: any) => {
                const payment = paymentMap.get(team.id);
                return {
                    id: team.id,
                    teamNumber: team.team_number || 0,
                    stageId: team.stage_id,
                    companyId: team.company_id,
                    teamName: team.team_name || '',
                    city: team.city || '',
                    responsibleName: team.responsible_name || '',
                    responsibleEmail: team.responsible_email || '',
                    responsiblePhone: team.responsible_phone || '',
                    responsiblePhone2: team.responsible_phone2 || '',
                    members: Array.isArray(team.members) ? team.members : [],
                    paid: !!team.paid,
                    exemptRegistration: !!team.exempt_registration,
                    stageName: team.stages?.name || '',
                    paymentStatus: payment?.status || (team.paid ? 'paid' : 'pending'),
                    paymentMethod: payment?.method || team.payment_method || 'direct',
                    registeredAt: new Date(team.created_at)
                };
            });

            // Aplicar filtro de status
            let filtered = teamsWithPayment;
            if (filterStatus !== 'all') {
                filtered = teamsWithPayment.filter(t => t.paymentStatus === filterStatus);
            }

            setTeams(filtered);
        } catch (error) {
            console.error('Erro ao carregar equipes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (teamId: string, teamName: string) => {
        setTeamToDelete({ id: teamId, name: teamName });
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteTeam = async () => {
        if (!teamToDelete) return;

        try {
            // Delete payments first (foreign key constraint)
            const { error: paymentError } = await supabase
                .from('payments')
                .delete()
                .eq('team_id', teamToDelete.id);

            if (paymentError) throw paymentError;

            // Delete team
            const { error: teamError } = await supabase
                .from('teams')
                .delete()
                .eq('id', teamToDelete.id);

            if (teamError) throw teamError;

            // Refresh list
            loadTeams();
            setIsDeleteModalOpen(false);
            setTeamToDelete(null);
        } catch (error) {
            console.error('Erro ao deletar equipe:', error);
            alert('Erro ao deletar equipe.');
        }
    };

    const handleEditClick = (team: TeamWithPayment) => {
        setEditingTeam(team);
        const existingMembers = Array.isArray(team.members) && team.members.length > 0 ? team.members : [];
        const fullMembers = [0, 1, 2, 3].map(i => ({
            name: existingMembers[i]?.name || '',
            nickname: existingMembers[i]?.nickname || '',
            rg: existingMembers[i]?.rg || ''
        }));

        setEditForm({
            teamNumber: team.teamNumber || '',
            teamName: team.teamName || '',
            city: team.city || '',
            responsibleName: team.responsibleName || '',
            responsibleEmail: team.responsibleEmail || '',
            phone: team.responsiblePhone || '',
            phone2: team.responsiblePhone2 || '',
            members: fullMembers,
            paymentMethod: team.paymentMethod !== '-' ? team.paymentMethod : 'direct',
            paymentStatus: team.paymentStatus !== 'none' ? team.paymentStatus : 'pending',
            exemptRegistration: !!team.exemptRegistration
        });
        setIsEditModalOpen(true);
    };

    const handleMemberChange = (index: number, field: keyof TeamMember, value: string) => {
        const updatedMembers = [...editForm.members];
        updatedMembers[index] = {
            ...updatedMembers[index],
            [field]: value
        };
        setEditForm({ ...editForm, members: updatedMembers });
    };

    const handleSaveEdit = async () => {
        if (!editingTeam) return;

        try {
            const isPaid = editForm.paymentStatus === 'paid' || editForm.exemptRegistration;

            const { error: teamError } = await supabase
                .from('teams')
                .update({
                    team_number: Number(editForm.teamNumber) || editingTeam.teamNumber,
                    team_name: editForm.teamName,
                    city: editForm.city,
                    responsible_name: editForm.responsibleName,
                    responsible_email: editForm.responsibleEmail,
                    responsible_phone: editForm.phone,
                    responsible_phone2: editForm.phone2 || null,
                    members: editForm.members,
                    payment_method: editForm.paymentMethod,
                    paid: isPaid,
                    exempt_registration: editForm.exemptRegistration
                })
                .eq('id', editingTeam.id);

            if (teamError) throw teamError;

            const { data: existingPay } = await supabase
                .from('payments')
                .select('id')
                .eq('team_id', editingTeam.id)
                .eq('stage_id', editingTeam.stageId)
                .maybeSingle();

            const paymentPayload = {
                team_id: editingTeam.id,
                stage_id: editingTeam.stageId,
                company_id: editingTeam.companyId,
                payment_method: editForm.paymentMethod,
                status: editForm.paymentStatus,
                paid_at: isPaid ? new Date().toISOString() : null
            };

            if (existingPay) {
                await supabase.from('payments').update(paymentPayload).eq('id', existingPay.id);
            } else {
                const { data: stage } = await supabase.from('stages').select('registration_fee').eq('id', editingTeam.stageId).maybeSingle();
                await supabase.from('payments').insert({
                    ...paymentPayload,
                    amount: stage?.registration_fee || 350
                });
            }

            setIsEditModalOpen(false);
            setEditingTeam(null);
            loadTeams();
        } catch (error: any) {
            console.error('Erro ao atualizar equipe:', error);
            alert(error.message || 'Erro ao atualizar a ficha da equipe.');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: 'Pendente' },
            paid: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Pago' },
            rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, label: 'Rejeitado' },
            none: { bg: 'bg-gray-100', text: 'text-gray-800', icon: DollarSign, label: 'Sem Pagamento' }
        };

        const style = styles[status as keyof typeof styles] || styles.none;
        const Icon = style.icon;



    return (
            <div className={`flex items-center gap-1 px-2 py-1 ${style.bg} ${style.text} rounded-full text-xs font-semibold`}>
                <Icon className="w-3 h-3" />
                {style.label}
            </div>
        );
    };

    const handleOpenQuickRegister = () => {
        if (!selectedStage) {
            alert('Selecione uma etapa primeiro.');
            return;
        }
        // Calcular próximo número vago (ex: 28..37, pula 38 ocupado e segue para 39)
        const taken = new Set(teams.map(t => t.teamNumber).filter(Boolean));
        let nextNum = 1;
        while (taken.has(nextNum)) {
            nextNum++;
        }
        setQuickNumber(nextNum);
        setQuickName('');
        setQuickCity('');
        setQuickRespName('');
        setQuickPhone('');
        setQuickPaid(true);
        setIsQuickModalOpen(true);
    };

    const handleSaveQuickRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quickName.trim()) {
            alert('Informe o nome da equipe.');
            return;
        }
        if (!selectedStage) {
            alert('Selecione uma etapa.');
            return;
        }

        try {
            setQuickLoading(true);
            const num = Number(quickNumber) || 1;
            const stageObj = stages.find(s => s.id === selectedStage);
            const targetCompanyId = stageObj?.companyId || stageObj?.company_id || companyId;

            const { data: newTeam, error: teamErr } = await supabase
                .from('teams')
                .insert({
                    stage_id: selectedStage,
                    company_id: targetCompanyId,
                    team_number: num,
                    team_name: quickName.trim(),
                    city: quickCity.trim() || 'A definir',
                    responsible_name: quickRespName.trim() || quickName.trim(),
                    responsible_email: '',
                    responsible_phone: quickPhone.trim() || '',
                    responsible_phone2: null,
                    members: [],
                    paid: quickPaid,
                    payment_method: 'direct',
                    exempt_registration: false,
                    cancelled: false
                })
                .select()
                .single();

            if (teamErr) throw teamErr;

            if (newTeam?.id) {
                await supabase.from('payments').insert({
                    team_id: newTeam.id,
                    stage_id: selectedStage,
                    company_id: targetCompanyId,
                    amount: stageObj?.registrationFee || stageObj?.registration_fee || 350,
                    payment_method: 'direct',
                    status: quickPaid ? 'paid' : 'pending',
                    paid_at: quickPaid ? new Date().toISOString() : null
                });
            }

            setIsQuickModalOpen(false);
            await loadTeams();
        } catch (err: any) {
            console.error('Erro ao cadastrar equipe rápida:', err);
            alert(err.message || 'Erro ao cadastrar equipe.');
        } finally {
            setQuickLoading(false);
        }
    };

    const handleNewRegistration = () => {
        if (selectedStage) {
            navigate(`/register/${selectedStage}`);
        } else {
            alert('Selecione uma etapa primeiro');
        }
    };


    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Inscrições de Equipes</h1>
                        <p className="text-gray-600 mt-1">Gerencie as equipes inscritas e seus pagamentos</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-600" />
                            <span className="text-sm text-gray-600">
                                {teams.length} {teams.length === 1 ? 'equipe' : 'equipes'}
                            </span>
                        </div>
                        <button
                            onClick={handleOpenQuickRegister}
                            disabled={!selectedStage}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-black shadow-sm text-sm"
                            title={!selectedStage ? "Selecione uma etapa primeiro" : "Cadastro Rápido (Apenas Nome da Equipe)"}
                        >
                            <PlusCircle className="w-4 h-4" />
                            Inscrição Rápida (Apenas Nome)
                        </button>
                        <button
                            onClick={handleNewRegistration}
                            disabled={!selectedStage}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
                            title={!selectedStage ? "Selecione uma etapa primeiro" : "Criar nova inscrição"}
                        >
                            <PlusCircle className="w-4 h-4" />
                            Nova Inscrição
                        </button>
                    </div>
                </div>

                {/* Filtros */}
                <Card className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Circuito
                            </label>
                            <select
                                value={selectedCircuit}
                                onChange={(e) => setSelectedCircuit(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                                {circuits.map(circuit => (
                                    <option key={circuit.id} value={circuit.id}>
                                        {circuit.name} - {circuit.year}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Etapa
                            </label>
                            <select
                                value={selectedStage}
                                onChange={(e) => setSelectedStage(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                disabled={!selectedCircuit}
                            >
                                {stages.map(stage => (
                                    <option key={stage.id} value={stage.id}>
                                        {stage.name} - {new Date(stage.date).toLocaleDateString('pt-BR')}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status Pagamento
                            </label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">Todos</option>
                                <option value="pending">Pendentes</option>
                                <option value="paid">Pagos</option>
                                <option value="rejected">Rejeitados</option>
                                <option value="none">Sem Pagamento</option>
                            </select>
                        </div>
                    </div>
                </Card>

                {/* Lista de Equipes */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <LoadingSpinner />
                    </div>
                ) : teams.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-xl text-gray-500">
                            {selectedStage ? 'Nenhuma equipe inscrita nesta etapa' : 'Selecione uma etapa para ver as inscrições'}
                        </p>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {teams.map((team) => (
                            <Card key={team.id} className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white font-black text-sm px-2.5 py-0.5 rounded shadow-sm">
                                                Nº {team.teamNumber || 'S/N'}
                                            </span>
                                            <h3 className="text-lg font-bold text-gray-900">{team.teamName}</h3>
                                            {getStatusBadge(team.paymentStatus)}
                                        </div>
                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                            {team.exemptRegistration && (
                                                <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                                                    Isenta
                                                </span>
                                            )}
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                                            <p><strong>Cidade:</strong> {team.city || 'Não informada'}</p>
                                            <p><strong>Responsável:</strong> {team.responsibleName || 'Não informado'}</p>
                                            <p><strong>Email:</strong> {team.responsibleEmail || 'Não informado'}</p>
                                            <p><strong>Telefone:</strong> {team.responsiblePhone || 'Não informado'}</p>
                                            <p><strong>Método:</strong> {team.paymentMethod}</p>
                                        </div>

                                        {/* Integrantes */}
                                        {team.members && team.members.length > 0 && (
                                            <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                                                    Integrantes da Equipe ({team.members.filter(m => m.name).length}):
                                                </span>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                                    {team.members.map((m, idx) => (
                                                        m.name ? (
                                                            <div key={idx} className="bg-white p-2 rounded border border-gray-200">
                                                                <span className="font-semibold text-blue-600 block">{MEMBER_ROLES[idx] || 'Integrante ' + (idx + 1)}</span>
                                                                <span className="font-medium text-gray-800 block truncate">{m.name}</span>
                                                                {m.nickname && <span className="text-gray-500 block">Apelido: {m.nickname}</span>}
                                                                {m.rg && <span className="text-gray-400 text-[10px] block">RG/CPF: {m.rg}</span>}
                                                            </div>
                                                        ) : null
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2 ml-4">
                                        <button
                                            onClick={() => handleEditClick(team)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Editar Equipe"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(team.id, team.teamName)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Excluir Equipe"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <p className="text-xs text-gray-500">
                                        Inscrito em: {team.registeredAt.toLocaleString('pt-BR')}
                                    </p>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                            {/* Modal de Inscrição Rápida (Apenas Nome) */}
            {isQuickModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-wide">Inscrição Rápida de Equipe</h3>
                                <p className="text-xs font-bold text-slate-800 mt-0.5">Cadastre agora apenas o nome. Complete os outros dados depois.</p>
                            </div>
                            <button
                                onClick={() => setIsQuickModalOpen(false)}
                                className="text-slate-900 hover:bg-black/10 p-1.5 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveQuickRegister} className="p-6 space-y-4">
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
                                <strong>💡 Regra de Numeração Automática:</strong> O número atribuído é o próximo vago na etapa (ex: 28..37, pula o 38 ocupado e segue para 39). Você também pode alterar manualmente se desejar.
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                        Número *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        value={quickNumber}
                                        onChange={(e) => setQuickNumber(e.target.value === '' ? '' : Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-black text-blue-900 focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                        Nome da Equipe *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        autoFocus
                                        placeholder="Ex: Tucunaré Masters"
                                        value={quickName}
                                        onChange={(e) => setQuickName(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                    Cidade (Opcional - padrão "A definir")
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ex: Guaraci - SP"
                                    value={quickCity}
                                    onChange={(e) => setQuickCity(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                        Capitão / Responsável
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Nome do capitão"
                                        value={quickRespName}
                                        onChange={(e) => setQuickRespName(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                        Telefone
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="(00) 00000-0000"
                                        value={quickPhone}
                                        onChange={(e) => setQuickPhone(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <label className="flex items-center gap-2 cursor-pointer bg-green-50 border border-green-200 p-3 rounded-xl">
                                    <input
                                        type="checkbox"
                                        checked={quickPaid}
                                        onChange={(e) => setQuickPaid(e.target.checked)}
                                        className="w-4 h-4 text-green-600 rounded"
                                    />
                                    <span className="text-xs font-bold text-green-900">
                                        Confirmar inscrição como Paga (Método Direto / Direct)
                                    </span>
                                </label>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsQuickModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={quickLoading}
                                    className="px-5 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 text-sm font-black rounded-lg shadow-md disabled:opacity-50"
                                >
                                    {quickLoading ? 'Salvando...' : 'Cadastrar Equipe'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal (Ficha Completa) */}
                {isEditModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 overflow-y-auto">
                        <div className="bg-white rounded-xl p-6 max-w-3xl w-full my-8 max-h-[90vh] flex flex-col shadow-2xl border border-gray-200">
                            {/* Header */}
                            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                                <div className="flex items-center gap-2">
                                    <Edit2 className="w-6 h-6 text-blue-600" />
                                    <h3 className="text-xl font-bold text-gray-900">Editar Ficha Completa da Equipe</h3>
                                </div>
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Body Scrollable */}
                            <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-2">
                                {/* 1. Dados da Equipe */}
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                                        <Users className="w-4 h-4 text-blue-600" /> Dados da Equipe
                                    </h4>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Nome da Equipe *</label>
                                            <input
                                                type="text"
                                                value={editForm.teamName}
                                                onChange={e => setEditForm({ ...editForm, teamName: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Cidade / Estado *</label>
                                            <input
                                                type="text"
                                                value={editForm.city}
                                                onChange={e => setEditForm({ ...editForm, city: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Dados do Responsável */}
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                                        <UserCheck className="w-4 h-4 text-blue-600" /> Dados do Responsável
                                    </h4>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Nome do Responsável *</label>
                                            <input
                                                type="text"
                                                value={editForm.responsibleName}
                                                onChange={e => setEditForm({ ...editForm, responsibleName: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">E-mail *</label>
                                            <input
                                                type="email"
                                                value={editForm.responsibleEmail}
                                                onChange={e => setEditForm({ ...editForm, responsibleEmail: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Telefone Principal *</label>
                                            <input
                                                type="text"
                                                value={editForm.phone}
                                                onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Telefone Secundário / Recado</label>
                                            <input
                                                type="text"
                                                value={editForm.phone2}
                                                onChange={e => setEditForm({ ...editForm, phone2: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Integrantes da Equipe */}
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                                        <Users className="w-4 h-4 text-blue-600" /> Integrantes da Equipe (Pescadores)
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {editForm.members.map((member, index) => (
                                            <div key={index} className="bg-white p-3 rounded-lg border border-gray-200 space-y-2">
                                                <span className="text-xs font-bold text-blue-600 block">
                                                    {MEMBER_ROLES[index]}
                                                </span>
                                                <div>
                                                    <label className="block text-[11px] text-gray-500">Nome Completo</label>
                                                    <input
                                                        type="text"
                                                        value={member.name}
                                                        onChange={e => handleMemberChange(index, 'name', e.target.value)}
                                                        placeholder="Nome do integrante"
                                                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="block text-[11px] text-gray-500">Apelido</label>
                                                        <input
                                                            type="text"
                                                            value={member.nickname || ''}
                                                            onChange={e => handleMemberChange(index, 'nickname', e.target.value)}
                                                            placeholder="Apelido"
                                                            className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] text-gray-500">RG ou CPF</label>
                                                        <input
                                                            type="text"
                                                            value={member.rg || ''}
                                                            onChange={e => handleMemberChange(index, 'rg', e.target.value)}
                                                            placeholder="RG / CPF"
                                                            className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 4. Pagamento e Isenção */}
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-blue-600" /> Situação de Pagamento
                                    </h4>
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Método de Pagamento</label>
                                            <select
                                                value={editForm.paymentMethod}
                                                onChange={e => setEditForm({ ...editForm, paymentMethod: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                            >
                                                <option value="direct">Direto</option>
                                                <option value="pix_manual">PIX Manual</option>
                                                <option value="mercado_pago">Mercado Pago</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Status do Pagamento</label>
                                            <select
                                                value={editForm.paymentStatus}
                                                onChange={e => setEditForm({ ...editForm, paymentStatus: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                            >
                                                <option value="pending">Pendente</option>
                                                <option value="paid">Pago (Aprovado)</option>
                                                <option value="rejected">Rejeitado</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center pt-5">
                                            <label className="inline-flex items-center cursor-pointer gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={editForm.exemptRegistration}
                                                    onChange={e => setEditForm({ ...editForm, exemptRegistration: e.target.checked })}
                                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                />
                                                <span className="text-xs font-bold text-gray-800">Inscrição Isenta</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex gap-3 pt-4 border-t border-gray-200 mt-2">
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 text-sm"
                                >
                                    <Save className="w-4 h-4" />
                                    Salvar Alterações Ficha
                                </button>
                            </div>
                        </div>
                    </div>
                )}


                {/* Delete Confirmation Modal */}
                {isDeleteModalOpen && teamToDelete && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center">
                            <div className="bg-red-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Equipe?</h3>
                            <p className="text-gray-600 mb-6">
                                Tem certeza que deseja excluir a equipe <strong>{teamToDelete.name}</strong>?
                                <br />Essa ação não pode ser desfeita.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDeleteTeam}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                                >
                                    Excluir
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

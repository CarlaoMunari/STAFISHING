import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, XCircle, Eye, Clock, FileText, Gift, Ban, ExternalLink } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Payment {
    id: string;
    teamName: string;
    stageName: string;
    amount: number;
    paymentMethod: string;
    status: string;
    proofUrl: string;
    createdAt: Date;
    teamId: string;
    stageId: string;
    exemptRegistration: boolean;
    cancelled: boolean;
    cancelledAt: Date | null;
    cancellationReason: string | null;
}

export function PaymentManagement() {
    const { companyId } = useCompany();
    const { currentUser } = useAuth();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [showProofModal, setShowProofModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [paymentToApprove, setPaymentToApprove] = useState<Payment | null>(null);
    const [processing, setProcessing] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [paymentToCancel, setPaymentToCancel] = useState<Payment | null>(null);
    const [cancellationReasonInput, setCancellationReasonInput] = useState('');

    // Filtros de circuito e etapa
    const [circuits, setCircuits] = useState<any[]>([]);
    const [stages, setStages] = useState<any[]>([]);
    const [selectedCircuit, setSelectedCircuit] = useState('');
    const [selectedStage, setSelectedStage] = useState('');

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
        loadPayments();
    }, [companyId, filterStatus, selectedStage]);

    const loadCircuits = async () => {
        try {
            let query = supabase
                .from('circuits')
                .select('*')
                .order('name');

            // Super admin vê todos, company vê apenas os seus
            if (currentUser?.role !== 'super_admin') {
                query = query.eq('company_id', companyId);
            }

            const { data, error } = await query;

            if (error) throw error;
            setCircuits(data || []);
        } catch (error) {
            console.error('Erro ao carregar circuitos:', error);
        }
    };

    const loadStages = async (circuitId: string) => {
        try {
            const { data, error } = await supabase
                .from('stages')
                .select('*')
                .eq('circuit_id', circuitId)
                .order('date');

            if (error) throw error;
            setStages(data || []);
        } catch (error) {
            console.error('Erro ao carregar etapas:', error);
        }
    };

    const loadPayments = async () => {
        try {
            let query = supabase
                .from('payments')
                .select(`
                    id,
                    amount,
                    payment_method,
                    status,
                    proof_url,
                    created_at,
                    team_id,
                    stage_id,
                    teams (team_name, exempt_registration, cancelled, cancelled_at, cancellation_reason),
                    stages (name)
                `)
                .order('created_at', { ascending: false });

            // Super admin vê todos os pagamentos, company vê apenas os seus
            if (currentUser?.role !== 'super_admin') {
                query = query.eq('company_id', companyId);
            }

            if (filterStatus !== 'all') {
                query = query.eq('status', filterStatus);
            }

            if (selectedStage) {
                query = query.eq('stage_id', selectedStage);
            }

            console.log('🔍 Fetching payments...', { companyId, filterStatus, selectedStage, userRole: currentUser?.role });

            const { data, error } = await query;

            console.log('🔍 Raw Payments Data:', data);
            console.log('🔍 Error:', error);

            if (error) throw error;

            const formattedPayments = data.map((p: any) => ({
                id: p.id,
                teamName: p.teams?.team_name || 'Equipe não encontrada',
                stageName: p.stages?.name || 'Etapa não encontrada',
                amount: p.amount,
                paymentMethod: p.payment_method,
                status: p.status,
                proofUrl: p.proof_url,
                createdAt: new Date(p.created_at),
                teamId: p.team_id,
                stageId: p.stage_id,
                exemptRegistration: p.teams?.exempt_registration || false,
                cancelled: p.teams?.cancelled || false,
                cancelledAt: p.teams?.cancelled_at ? new Date(p.teams.cancelled_at) : null,
                cancellationReason: p.teams?.cancellation_reason || null
            }));

            setPayments(formattedPayments);
        } catch (error) {
            console.error('Erro ao carregar pagamentos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveClick = (payment: Payment) => {
        setPaymentToApprove(payment);
    };

    const handleConfirmApprove = async () => {
        if (!paymentToApprove) return;

        setProcessing(true);
        try {
            // Atualizar pagamento
            const { error: paymentError } = await supabase
                .from('payments')
                .update({
                    status: 'paid',
                    paid_at: new Date().toISOString()
                })
                .eq('id', paymentToApprove.id);

            if (paymentError) throw paymentError;

            // Marcar equipe como paga
            const { error: teamError } = await supabase
                .from('teams')
                .update({ paid: true })
                .eq('id', paymentToApprove.teamId);

            if (teamError) throw teamError;

            alert('Pagamento aprovado com sucesso!');
            setPaymentToApprove(null);
            loadPayments();
        } catch (error) {
            console.error('Erro ao aprovar pagamento:', error);
            alert('Erro ao aprovar pagamento');
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async (payment: Payment) => {
        if (!rejectionReason.trim()) {
            alert('Por favor, informe o motivo da rejeição');
            return;
        }

        setProcessing(true);
        try {
            const { error } = await supabase
                .from('payments')
                .update({
                    status: 'rejected',
                    rejection_reason: rejectionReason
                })
                .eq('id', payment.id);

            if (error) throw error;

            alert('Pagamento rejeitado');
            setRejectionReason('');
            setSelectedPayment(null);
            loadPayments();
        } catch (error) {
            console.error('Erro ao rejeitar pagamento:', error);
            alert('Erro ao rejeitar pagamento');
        } finally {
            setProcessing(false);
        }
    };

    const toggleExemptRegistration = async (payment: Payment) => {
        const newExemptStatus = !payment.exemptRegistration;
        const confirmMessage = newExemptStatus
            ? `Marcar a equipe "${payment.teamName}" como ISENTA de pagamento?\n\nO valor da inscrição será R$ 0,00 e será automaticamente aprovada.`
            : `Remover isenção da equipe "${payment.teamName}"?\n\nA equipe voltará ao status normal de pagamento.`;

        if (!confirm(confirmMessage)) return;

        setProcessing(true);
        try {
            // Atualizar status de isenção na equipe
            const { error: teamError } = await supabase
                .from('teams')
                .update({ exempt_registration: newExemptStatus })
                .eq('id', payment.teamId);

            if (teamError) throw teamError;

            // Se marcando como isento, aprovar pagamento automaticamente
            if (newExemptStatus) {
                const { error: paymentError } = await supabase
                    .from('payments')
                    .update({
                        status: 'paid',
                        amount: 0,
                        paid_at: new Date().toISOString()
                    })
                    .eq('id', payment.id);

                if (paymentError) throw paymentError;

                // Marcar equipe como paga
                const { error: paidError } = await supabase
                    .from('teams')
                    .update({ paid: true })
                    .eq('id', payment.teamId);

                if (paidError) throw paidError;

                alert('✅ Equipe marcada como ISENTA!\n\nPagamento aprovado automaticamente com valor R$ 0,00.');
            } else {
                alert('✅ Isenção removida!\n\nA equipe voltou ao status normal.');
            }

            loadPayments();
        } catch (error) {
            console.error('Erro ao alterar isenção:', error);
            alert('Erro ao alterar status de isenção');
        } finally {
            setProcessing(false);
        }
    };

    const handleCancelRegistration = async (payment: Payment) => {
        const newCancelledStatus = !payment.cancelled;

        if (newCancelledStatus) {
            // Abrindo modal para pedir motivo
            setPaymentToCancel(payment);
            setShowCancelModal(true);
            setCancellationReasonInput('');
        } else {
            // Reativando inscrição
            if (!confirm(`Reativar a inscrição da equipe "${payment.teamName}"?\n\nA equipe voltará ao status ativo.`)) return;

            setProcessing(true);
            try {
                const { error } = await supabase
                    .from('teams')
                    .update({
                        cancelled: false,
                        cancelled_at: null,
                        cancellation_reason: null
                    })
                    .eq('id', payment.teamId);

                if (error) throw error;

                alert('✅ Inscrição reativada com sucesso!');
                loadPayments();
            } catch (error) {
                console.error('Erro ao reativar inscrição:', error);
                alert('Erro ao reativar inscrição');
            } finally {
                setProcessing(false);
            }
        }
    };

    const confirmCancellation = async () => {
        if (!paymentToCancel) return;

        if (!cancellationReasonInput.trim()) {
            alert('Por favor, informe o motivo do cancelamento');
            return;
        }

        setProcessing(true);
        try {
            const { error } = await supabase
                .from('teams')
                .update({
                    cancelled: true,
                    cancelled_at: new Date().toISOString(),
                    cancellation_reason: cancellationReasonInput.trim()
                })
                .eq('id', paymentToCancel.teamId);

            if (error) throw error;

            alert('✅ Inscrição cancelada com sucesso!');
            setShowCancelModal(false);
            setPaymentToCancel(null);
            setCancellationReasonInput('');
            loadPayments();
        } catch (error) {
            console.error('Erro ao cancelar inscrição:', error);
            alert('Erro ao cancelar inscrição');
        } finally {
            setProcessing(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800',
            paid: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800'
        };
        const labels = {
            pending: 'Pendente',
            paid: 'Aprovado',
            rejected: 'Rejeitado'
        };
        return (
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status as keyof typeof styles]}`}>
                {labels[status as keyof typeof labels]}
            </span>
        );
    };

    const generateReport = () => {
        try {
            // Filtrar pagamentos aprovados E não cancelados
            const paidPayments = payments.filter(p => p.status === 'paid' && !p.cancelled);
            const cancelledPayments = payments.filter(p => p.cancelled);

            if (paidPayments.length === 0 && cancelledPayments.length === 0) {
                alert('Nenhum dado para gerar relatório!');
                return;
            }

            const doc = new jsPDF('portrait', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth(); // 210mm

            // Cabeçalho
            doc.setFillColor(41, 128, 185); // Azul
            doc.rect(0, 0, pageWidth, 40, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('RELATÓRIO FINANCEIRO', 14, 20);

            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 30);

            // Resumo Contábil Card
            const totalArrecadado = paidPayments.reduce((sum, p) => sum + p.amount, 0);
            const totalPix = paidPayments.filter(p => p.paymentMethod === 'pix_manual').reduce((sum, p) => sum + p.amount, 0);
            const totalDireto = paidPayments.filter(p => p.paymentMethod === 'direct').reduce((sum, p) => sum + p.amount, 0);
            const totalIsentas = paidPayments.filter(p => p.exemptRegistration).length;

            let currentY = 50;

            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.text('RESUMO CONTÁBIL', 14, currentY);
            currentY += 8;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Total Arrecadado: R$ ${totalArrecadado.toFixed(2)}`, 14, currentY);
            doc.text(`Total via PIX: R$ ${totalPix.toFixed(2)}`, 14, currentY + 5);
            doc.text(`Total Direto: R$ ${totalDireto.toFixed(2)}`, 14, currentY + 10);
            doc.text(`Pagamentos: ${paidPayments.length}`, 100, currentY);
            doc.text(`Inscrições Isentas: ${totalIsentas}`, 100, currentY + 5);
            doc.text(`Cancelamentos: ${cancelledPayments.length}`, 100, currentY + 10);

            currentY += 20;

            // Tabela Detalhada
            const tableData = paidPayments.map((p, index) => [
                (index + 1).toString(),
                p.teamName.substring(0, 25) + (p.teamName.length > 25 ? '...' : ''),
                p.stageName.substring(0, 20),
                p.paymentMethod === 'pix_manual' ? 'PIX' :
                    p.paymentMethod === 'direct' ? 'Direto' : p.paymentMethod,
                p.createdAt.toLocaleDateString('pt-BR'),
                `R$ ${p.amount.toFixed(2)}`
            ]);

            autoTable(doc, {
                head: [['#', 'Equipe', 'Etapa', 'Método', 'Data', 'Valor']],
                body: tableData,
                startY: currentY,
                styles: {
                    fontSize: 9,
                    cellPadding: 3,
                    lineColor: [200, 200, 200],
                    lineWidth: 0.1
                },
                headStyles: {
                    fillColor: [41, 128, 185],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    halign: 'center'
                },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 10 }, // #
                    1: { cellWidth: 60 }, // Equipe (Wider)
                    2: { cellWidth: 45 }, // Etapa
                    3: { halign: 'center', cellWidth: 20 }, // Método
                    4: { halign: 'center', cellWidth: 25 }, // Data
                    5: { halign: 'right', cellWidth: 25, fontStyle: 'bold' } // Valor
                },
                alternateRowStyles: { fillColor: [248, 248, 248] },
                margin: { top: 40, left: 14, right: 14 }
            });

            // Tabela de Cancelamentos (se houver)
            if (cancelledPayments.length > 0) {
                currentY = (doc as any).lastAutoTable.finalY + 15;

                doc.setTextColor(0, 0, 0);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.text('CANCELAMENTOS E DESISTÊNCIAS', 14, currentY);
                currentY += 8;

                const cancelledTableData = cancelledPayments.map((p, index) => [
                    (index + 1).toString(),
                    p.teamName.substring(0, 30) + (p.teamName.length > 30 ? '...' : ''),
                    p.stageName.substring(0, 20),
                    p.cancelledAt ? p.cancelledAt.toLocaleDateString('pt-BR') : '-',
                    p.cancellationReason?.substring(0, 35) || 'Sem motivo informado'
                ]);

                autoTable(doc, {
                    head: [['#', 'Equipe', 'Etapa', 'Data Cancelamento', 'Motivo']],
                    body: cancelledTableData,
                    startY: currentY,
                    styles: {
                        fontSize: 8,
                        cellPadding: 2,
                        lineColor: [200, 200, 200],
                        lineWidth: 0.1
                    },
                    headStyles: {
                        fillColor: [220, 53, 69], // Vermelho
                        textColor: [255, 255, 255],
                        fontStyle: 'bold',
                        halign: 'center'
                    },
                    columnStyles: {
                        0: { halign: 'center', cellWidth: 10 },
                        1: { cellWidth: 45 },
                        2: { cellWidth: 30 },
                        3: { halign: 'center', cellWidth: 25 },
                        4: { cellWidth: 65 }
                    },
                    alternateRowStyles: { fillColor: [255, 248, 248] },
                    margin: { top: 40, left: 14, right: 14 }
                });
            }

            // Footer
            const pageCount = (doc as any).internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(`Página ${i} de ${pageCount} - STA FISHING`, pageWidth / 2, 290, { align: 'center' });
            }

            console.log('✅ PDF gerado, tentando salvar...');
            console.log('✅ PDF gerado, abrindo para impressão...');
            window.open(doc.output('bloburl'), '_blank');

        } catch (error) {
            console.error('❌ Erro ao gerar PDF:', error);
            alert('Ocorreu um erro ao gerar o relatório. Tente novamente.');
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex justify-center items-center h-64">
                    <LoadingSpinner />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Gestão de Pagamentos</h1>
                        <p className="text-gray-600 mt-1">Aprove ou rejeite os pagamentos das equipes</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-center">
                            <p className="text-xs text-gray-500 uppercase">Pendentes</p>
                            <p className="text-lg font-bold text-yellow-600">
                                R$ {payments.filter(p => p.status === 'pending' && !p.cancelled).reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">
                                ({payments.filter(p => p.status === 'pending' && !p.cancelled).length} pagamentos)
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-gray-500 uppercase">Arrecadado</p>
                            <p className="text-lg font-bold text-green-600">
                                R$ {payments.filter(p => p.status === 'paid' && !p.cancelled).reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">
                                ({payments.filter(p => p.status === 'paid' && !p.cancelled).length} aprovados)
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-gray-500 uppercase">Cancelamentos</p>
                            <p className="text-lg font-bold text-red-600">
                                {payments.filter(p => p.cancelled).length}
                            </p>
                            <p className="text-xs text-gray-500">
                                desistências
                            </p>
                        </div>
                        <Button variant="outline" onClick={generateReport}>
                            <FileText className="w-4 h-4 mr-2" />
                            Relatório
                        </Button>
                    </div>
                </div>

                {/* Filtros */}
                <Card className="p-4">
                    {/* Filtros de Circuito e Etapa */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Circuito
                            </label>
                            <select
                                value={selectedCircuit}
                                onChange={(e) => setSelectedCircuit(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Todos os circuitos</option>
                                {circuits.map((circuit) => (
                                    <option key={circuit.id} value={circuit.id}>
                                        {circuit.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Etapa
                            </label>
                            <select
                                value={selectedStage}
                                onChange={(e) => setSelectedStage(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={!selectedCircuit}
                            >
                                <option value="">Todas as etapas</option>
                                {stages.map((stage) => (
                                    <option key={stage.id} value={stage.id}>
                                        {stage.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Filtros de Status */}
                    <div className="flex gap-2">
                        {['all', 'pending', 'paid', 'rejected'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filterStatus === status
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {status === 'all' && 'Todos'}
                                {status === 'pending' && 'Pendentes'}
                                {status === 'paid' && 'Aprovados'}
                                {status === 'rejected' && 'Rejeitados'}
                            </button>
                        ))}
                    </div>
                </Card>

                {/* Lista de Pagamentos */}
                {payments.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-xl text-gray-500">Nenhum pagamento encontrado</p>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {payments.map((payment) => (
                            <Card key={payment.id} className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-bold text-gray-900">{payment.teamName}</h3>
                                            {getStatusBadge(payment.status)}
                                            {payment.exemptRegistration && (
                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 flex items-center gap-1">
                                                    <Gift className="w-3 h-3" />
                                                    ISENTA
                                                </span>
                                            )}
                                            {payment.cancelled && (
                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 flex items-center gap-1">
                                                    <Ban className="w-3 h-3" />
                                                    CANCELADA
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 mb-1">
                                            <strong>Etapa:</strong> {payment.stageName}
                                        </p>
                                        <p className="text-sm text-gray-600 mb-1">
                                            <strong>Valor:</strong> R$ {payment.amount.toFixed(2)}
                                            {payment.exemptRegistration && <span className="ml-2 text-purple-600 font-semibold">(Isenta)</span>}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            <strong>Data:</strong> {payment.createdAt.toLocaleDateString('pt-BR')} às {payment.createdAt.toLocaleTimeString('pt-BR')}
                                        </p>
                                        {payment.cancelled && payment.cancellationReason && (
                                            <p className="text-sm text-red-600 mt-2">
                                                <strong>Motivo do cancelamento:</strong> {payment.cancellationReason}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* Botão Cancelar/Reativar Inscrição */}
                                        <Button
                                            variant={payment.cancelled ? "secondary" : "outline"}
                                            onClick={() => handleCancelRegistration(payment)}
                                            disabled={processing}
                                            className={payment.cancelled ? "bg-green-100 text-green-700 hover:bg-green-200 border-green-300" : "border-red-300 text-red-700 hover:bg-red-50"}
                                        >
                                            <Ban className="w-4 h-4 mr-1" />
                                            {payment.cancelled ? 'Reativar Inscrição' : 'Cancelar Inscrição'}
                                        </Button>

                                        {/* Botão Inscrição Isenta */}
                                        <Button
                                            variant={payment.exemptRegistration ? "secondary" : "outline"}
                                            onClick={() => toggleExemptRegistration(payment)}
                                            disabled={processing}
                                            className={payment.exemptRegistration ? "bg-purple-100 text-purple-700 hover:bg-purple-200" : ""}
                                        >
                                            <Gift className="w-4 h-4 mr-1" />
                                            {payment.exemptRegistration ? 'Remover Isenção' : 'Inscrição Isenta'}
                                        </Button>

                                        <Button
                                            variant="secondary"
                                            onClick={() => {
                                                setSelectedPayment(payment);
                                                setShowProofModal(true);
                                            }}
                                        >
                                            <Eye className="w-4 h-4 mr-1" />
                                            Ver Comprovante
                                        </Button>

                                        {payment.status === 'pending' && (
                                            <>
                                                <Button
                                                    onClick={() => handleApproveClick(payment)}
                                                    disabled={processing}
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                    Aprovar
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => {
                                                        setSelectedPayment(payment);
                                                        setRejectionReason('');
                                                    }}
                                                    disabled={processing}
                                                >
                                                    <XCircle className="w-4 h-4 mr-1" />
                                                    Rejeitar
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Modal de Comprovante */}
                <Modal
                    isOpen={showProofModal}
                    onClose={() => {
                        setShowProofModal(false);
                        setSelectedPayment(null);
                    }}
                    title="Comprovante de Pagamento"
                >
                    {selectedPayment?.proofUrl ? (
                        <div className="space-y-4">
                            {/\.(jpe?g|png|webp|gif|bmp|svg)(\?.*)?$/i.test(selectedPayment.proofUrl) ? (
                                <div className="space-y-3">
                                    <img
                                        src={selectedPayment.proofUrl}
                                        alt="Comprovante"
                                        className="w-full max-h-[60vh] object-contain rounded-lg border bg-gray-50"
                                    />
                                    <div className="flex justify-end">
                                        <a
                                            href={selectedPayment.proofUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            Abrir imagem em nova aba
                                        </a>
                                    </div>
                                </div>
                            ) : /\.(pdf)(\?.*)?$/i.test(selectedPayment.proofUrl) ? (
                                <div className="space-y-3">
                                    <iframe
                                        src={selectedPayment.proofUrl}
                                        title="Comprovante PDF"
                                        className="w-full h-[60vh] rounded-lg border bg-gray-50"
                                    />
                                    <div className="flex justify-end">
                                        <a
                                            href={selectedPayment.proofUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            Abrir PDF em nova aba
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <iframe
                                        src={selectedPayment.proofUrl}
                                        title="Comprovante"
                                        className="w-full h-[50vh] rounded-lg border bg-gray-50"
                                    />
                                    <div className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg border">
                                        <p className="text-sm text-gray-600">Visualizar/Baixar comprovante anexado:</p>
                                        <a
                                            href={selectedPayment.proofUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            Abrir / Baixar arquivo em nova aba
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-gray-500">
                            Nenhum comprovante anexado a este pagamento.
                        </div>
                    )}
                </Modal>

                {/* Modal de Rejeição */}
                <Modal
                    isOpen={!!selectedPayment && !showProofModal}
                    onClose={() => {
                        setSelectedPayment(null);
                        setRejectionReason('');
                    }}
                    title="Rejeitar Pagamento"
                >
                    <div className="space-y-4">
                        <p className="text-gray-700">
                            Rejeitar pagamento de <strong>{selectedPayment?.teamName}</strong>?
                        </p>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Motivo da Rejeição
                            </label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                rows={4}
                                placeholder="Ex: Comprovante ilegível, valor incorreto..."
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setSelectedPayment(null);
                                    setRejectionReason('');
                                }}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={() => selectedPayment && handleReject(selectedPayment)}
                                disabled={processing || !rejectionReason.trim()}
                            >
                                Confirmar Rejeição
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* Modal de Aprovação */}
                <Modal
                    isOpen={!!paymentToApprove}
                    onClose={() => setPaymentToApprove(null)}
                    title="Aprovar Pagamento"
                >
                    <div className="space-y-4">
                        <p className="text-gray-700">
                            Tem certeza que deseja aprovar o pagamento da equipe <strong>{paymentToApprove?.teamName}</strong>?
                        </p>
                        <p className="text-sm text-gray-500">
                            Valor: R$ {paymentToApprove?.amount.toFixed(2)}
                        </p>
                        <div className="flex gap-2 justify-end">
                            <Button
                                variant="secondary"
                                onClick={() => setPaymentToApprove(null)}
                                disabled={processing}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleConfirmApprove}
                                disabled={processing}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                Confirmar Aprovação
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* Modal de Cancelamento */}
                <Modal
                    isOpen={showCancelModal}
                    onClose={() => {
                        setShowCancelModal(false);
                        setPaymentToCancel(null);
                        setCancellationReasonInput('');
                    }}
                    title="Cancelar Inscrição"
                >
                    <div className="space-y-4">
                        <p className="text-gray-700">
                            Cancelar inscrição da equipe <strong>{paymentToCancel?.teamName}</strong>?
                        </p>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-sm text-yellow-800">
                                ⚠️ Esta ação marcará a inscrição como cancelada. O motivo ficará registrado no histórico.
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Motivo do Cancelamento *
                            </label>
                            <textarea
                                value={cancellationReasonInput}
                                onChange={(e) => setCancellationReasonInput(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                rows={4}
                                placeholder="Ex: Desistência da equipe, duplicação de inscrição, etc..."
                                required
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setShowCancelModal(false);
                                    setPaymentToCancel(null);
                                    setCancellationReasonInput('');
                                }}
                                disabled={processing}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={confirmCancellation}
                                disabled={processing || !cancellationReasonInput.trim()}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                Confirmar Cancelamento
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </AdminLayout>
    );
}

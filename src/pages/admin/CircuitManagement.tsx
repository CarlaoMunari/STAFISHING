import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Circuit } from '@/types';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';

export function CircuitManagement() {
    const navigate = useNavigate();
    const { companyId } = useCompany();
    const { currentUser } = useAuth();
    const [circuits, setCircuits] = useState<Circuit[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCircuit, setEditingCircuit] = useState<Circuit | null>(null);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [circuitToDelete, setCircuitToDelete] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [year, setYear] = useState(new Date().getFullYear());
    const [active, setActive] = useState(true);
    const [regulation, setRegulation] = useState('');
    const [fishCount, setFishCount] = useState(6);

    useEffect(() => {
        loadCircuits();
    }, []);

    const loadCircuits = async () => {
        try {
            let query = supabase
                .from('circuits')
                .select('*');

            // Se não for super_admin, filtrar por company_id
            if (companyId) {
                query = query.eq('company_id', companyId);
            }
            // Se for super_admin, carrega todos os circuitos

            const { data, error } = await query.order('year', { ascending: false });

            if (error) throw error;

            const loadedCircuits = data.map((item: any) => ({
                ...item,
                createdAt: new Date(item.created_at),
            })) as Circuit[];
            setCircuits(loadedCircuits);
        } catch (error) {
            console.error('Erro ao carregar circuitos:', error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (circuit?: Circuit) => {
        if (circuit) {
            setEditingCircuit(circuit);
            setName(circuit.name);
            setYear(circuit.year);
            setActive(circuit.active);
            setRegulation(circuit.regulation || '');
            setFishCount(circuit.fishCount || 6);
        } else {
            setEditingCircuit(null);
            setName('');
            setYear(new Date().getFullYear());
            setActive(true);
            setRegulation('');
            setFishCount(6);
        }
        setModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const circuitData = {
                name,
                year,
                active,
                regulation,
                fish_count: fishCount, // Usar snake_case para o banco
            };

            if (editingCircuit) {
                const { error } = await supabase
                    .from('circuits')
                    .update(circuitData)
                    .eq('id', editingCircuit.id);
                if (error) throw error;
            } else {
                // Adicionar company_id ao criar novo circuito
                const insertData = {
                    ...circuitData,
                    company_id: companyId || currentUser?.id // Usar companyId ou currentUser.id
                };
                const { error } = await supabase
                    .from('circuits')
                    .insert(insertData);
                if (error) throw error;
            }
            setModalOpen(false);
            loadCircuits();
        } catch (error) {
            console.error('Erro ao salvar circuito:', error);
            alert('Erro ao salvar circuito');
        }
    };

    const handleDeleteClick = (id: string) => {
        setCircuitToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteCircuit = async () => {
        if (!circuitToDelete) return;

        try {
            const { error } = await supabase
                .from('circuits')
                .delete()
                .eq('id', circuitToDelete);

            if (error) throw error;

            loadCircuits();
            setIsDeleteModalOpen(false);
            setCircuitToDelete(null);
        } catch (error) {
            console.error('Erro ao excluir circuito:', error);
            alert('Erro ao excluir circuito');
        }
    };

    const toggleActive = async (circuit: Circuit) => {
        try {
            const { error } = await supabase
                .from('circuits')
                .update({ active: !circuit.active })
                .eq('id', circuit.id);
            if (error) throw error;
            loadCircuits();
        } catch (error) {
            console.error('Erro ao alternar circuito:', error);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <LoadingSpinner size="lg" />
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div>
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Gerenciar Circuitos</h1>
                    <Button variant="primary" onClick={() => openModal()}>
                        <Plus className="w-4 h-4" />
                        Novo Circuito
                    </Button>
                </div>

                {circuits.length === 0 ? (
                    <Card>
                        <p className="text-center text-gray-600">
                            Nenhum circuito cadastrado. Crie o primeiro!
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {circuits.map((circuit) => (
                            <Card key={circuit.id}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900">
                                            {circuit.name}
                                        </h3>
                                        <p className="text-gray-600">Ano: {circuit.year}</p>
                                        <p className={`text-sm font-medium ${circuit.active ? 'text-fishing-600' : 'text-gray-500'}`}>
                                            {circuit.active ? 'Ativo' : 'Inativo'}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => toggleActive(circuit)}
                                        >
                                            {circuit.active ? (
                                                <ToggleRight className="w-5 h-5" />
                                            ) : (
                                                <ToggleLeft className="w-5 h-5" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="primary"
                                            onClick={() => navigate(`/admin/circuits/editar/${circuit.id}`)}
                                        >
                                            <Edit className="w-4 h-4" />
                                            Editar
                                        </Button>
                                        <Button
                                            variant="danger"
                                            onClick={() => handleDeleteClick(circuit.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                <Modal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    title={editingCircuit ? 'Editar Circuito' : 'Novo Circuito'}
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Nome do Circuito"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Circuito Tucunaré 2025"
                            required
                        />
                        <Input
                            label="Ano"
                            type="number"
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            required
                        />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quantidade de Peixes Válidos
                            </label>
                            <select
                                value={fishCount}
                                onChange={(e) => setFishCount(Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value={1}>1 Peixe</option>
                                <option value={2}>2 Peixes</option>
                                <option value={3}>3 Peixes</option>
                                <option value={4}>4 Peixes</option>
                                <option value={5}>5 Peixes</option>
                                <option value={6}>6 Peixes</option>
                                <option value={7}>7 Peixes</option>
                                <option value={8}>8 Peixes</option>
                                <option value={9}>9 Peixes</option>
                                <option value={10}>10 Peixes</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Define quantos peixes contam para a pontuação nas etapas deste circuito.
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Regulamento do Circuito (Ferramentas de Formatação Estilo Word / Download .doc)
                            </label>
                            <RichTextEditor
                                value={regulation}
                                onChange={setRegulation}
                                placeholder="Digite ou cole aqui o regulamento completo do circuito..."
                            />
                            <p className="text-xs text-gray-500 mt-1.5">
                                Suporta títulos, listas, tabelas, alinhamentos, cores, negrito, itálico e exportação para arquivo .doc.
                            </p>
                        </div>
                        <div>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={active}
                                    onChange={(e) => setActive(e.target.checked)}
                                    className="w-4 h-4 text-ocean-600 rounded"
                                />
                                <span className="text-sm font-medium text-gray-700">Circuito Ativo</span>
                            </label>
                        </div>
                        <Button type="submit" variant="primary" className="w-full">
                            {editingCircuit ? 'Salvar Alterações' : 'Criar Circuito'}
                        </Button>

                    </form>
                </Modal>

                {/* Delete Confirmation Modal */}
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center">
                            <div className="bg-red-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Circuito?</h3>
                            <p className="text-gray-600 mb-6">
                                Tem certeza que deseja excluir este circuito?
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
                                    onClick={confirmDeleteCircuit}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                                >
                                    Excluir
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout >
    );
}

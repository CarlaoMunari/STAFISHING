import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { SponsorLogo } from '@/types';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { 
    Award, 
    Star, 
    Trash2, 
    ExternalLink, 
    CheckCircle2, 
    ArrowRight,
Edit,
ShieldCheck, 
    Sparkles 
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';

export function SponsorManagement() {
    const { currentUser } = useAuth();

    const [sponsors, setSponsors] = useState<SponsorLogo[]>([]);
    const [, setLoading] = useState(true);
    const [actionMessage, setActionMessage] = useState<string | null>(null);

    // Form states
    const [editingId, setEditingId] = useState<string | null>(null);
    const [sponsorName, setSponsorName] = useState('');
    const [sponsorLink, setSponsorLink] = useState('');
    const [uploadedLogoUrl, setUploadedLogoUrl] = useState('');
    const [displayOrder, setDisplayOrder] = useState<number>(1);
    const [selectedTier, setSelectedTier] = useState<'master' | 'ouro' | 'apoio'>('master');
    const [sponsorDescription, setSponsorDescription] = useState('');

    // Delete Modal
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string, imageUrl: string } | null>(null);

    useEffect(() => {
        loadSponsors();
    }, []);

    const loadSponsors = async () => {
        try {
            setLoading(true);
            let query = supabase.from('sponsor_logos').select('*');
            if (currentUser?.role === 'company' && currentUser?.id) {
                query = query.eq('company_id', currentUser.id);
            }
            const { data, error } = await query.order('display_order', { ascending: true });

            if (error) {
                console.error('Erro ao carregar patrocinadores:', error);
                return;
            }

            setSponsors((data || []).map((item: any) => ({
                id: item.id,
                name: item.name,
                imageUrl: item.image_url,
                linkUrl: item.link_url,
                displayOrder: item.display_order ?? 0,
                active: item.active ?? true,
                createdAt: new Date(item.created_at),
                updatedAt: item.updated_at ? new Date(item.updated_at) : undefined
            })));
        } catch (err) {
            console.error('Erro:', err);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setSponsorName('');
        setSponsorLink('');
        setUploadedLogoUrl('');
        setSponsorDescription('');
        setDisplayOrder(sponsors.length + 1);
        setSelectedTier('master');
    };

    const handleEditClick = (s: SponsorLogo) => {
        setEditingId(s.id);
        setSponsorName(s.name);
        setSponsorLink(s.linkUrl || '');
        setUploadedLogoUrl(s.imageUrl);
        setDisplayOrder(s.displayOrder);
        setSelectedTier(s.displayOrder <= 3 ? 'master' : s.displayOrder <= 6 ? 'ouro' : 'apoio');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSaveSponsor = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!sponsorName.trim()) {
            alert('Por favor, informe o nome do patrocinador.');
            return;
        }

        if (!uploadedLogoUrl.trim()) {
            alert('Por favor, faça o upload da logomarca ou informe uma imagem.');
            return;
        }

        try {
            // Determine display_order from selected tier if not custom
            let finalOrder = Number(displayOrder) || 1;
            if (selectedTier === 'master' && finalOrder > 3) finalOrder = 1;
            if (selectedTier === 'ouro' && (finalOrder < 4 || finalOrder > 6)) finalOrder = 4;
            if (selectedTier === 'apoio' && finalOrder < 7) finalOrder = 7;

            const payload: any = {
                name: sponsorName.trim(),
                image_url: uploadedLogoUrl.trim(),
                link_url: sponsorLink.trim() || null,
                display_order: finalOrder,
                active: true,
                updated_at: new Date().toISOString()
            };

            if (currentUser?.role === 'company' && currentUser?.id) {
                payload.company_id = currentUser.id;
            }

            if (editingId) {
                // Update
                const { error } = await supabase
                    .from('sponsor_logos')
                    .update(payload)
                    .eq('id', editingId);

                if (error) throw error;
                setActionMessage(`Logomarca de "${sponsorName}" atualizada com sucesso!`);
            } else {
                // Insert
                payload.created_at = new Date().toISOString();
                const { error } = await supabase
                    .from('sponsor_logos')
                    .insert(payload);

                if (error) throw error;
                setActionMessage(`Novo patrocinador "${sponsorName}" cadastrado com sucesso!`);
            }

            resetForm();
            loadSponsors();
            setTimeout(() => setActionMessage(null), 4000);
        } catch (err: any) {
            console.error('Erro ao salvar patrocinador:', err);
            alert('Erro ao salvar patrocinador: ' + (err.message || 'Erro desconhecido'));
        }
    };

    const handleToggleActive = async (s: SponsorLogo) => {
        try {
            const nextActive = !s.active;
            const { error } = await supabase
                .from('sponsor_logos')
                .update({ active: nextActive })
                .eq('id', s.id);

            if (error) throw error;

            setSponsors(prev => prev.map(item => item.id === s.id ? { ...item, active: nextActive } : item));
            setActionMessage(`Status de "${s.name}" alterado para ${nextActive ? 'ATIVO' : 'OCULTO'}.`);
            setTimeout(() => setActionMessage(null), 3000);
        } catch (err: any) {
            console.error('Erro ao alternar status:', err);
            alert('Erro ao alterar status');
        }
    };

    const handleDeleteClick = (s: SponsorLogo) => {
        setItemToDelete({ id: s.id, name: s.name, imageUrl: s.imageUrl });
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            const path = itemToDelete.imageUrl.split('/').pop();
            if (path) {
                await supabase.storage.from('sponsor-logos').remove([path]);
            }
            const { error } = await supabase.from('sponsor_logos').delete().eq('id', itemToDelete.id);
            if (error) throw error;

            setDeleteModalOpen(false);
            setItemToDelete(null);
            setActionMessage('Patrocinador removido com sucesso.');
            loadSponsors();
            setTimeout(() => setActionMessage(null), 3000);
        } catch (err: any) {
            console.error('Erro ao excluir:', err);
            alert('Erro ao excluir patrocinador.');
        }
    };

    return (
        <AdminLayout>
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 text-xs font-black uppercase tracking-wider mb-2">
                            <Sparkles className="w-3.5 h-3.5" />
                            DESTAQUE MÁXIMO NA PÁGINA INICIAL
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                            Patrocinadores & Logomarcas
                        </h1>
                        <p className="text-gray-600 text-sm mt-1">
                            Cadastre as logomarcas dos patrocinadores que aparecem na vitrine VIP e no carrossel oficial da Home.
                        </p>
                    </div>

                    <a
                        href="/#patrocinadores"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-lg transition-all w-fit"
                    >
                        <span>Ver Vitrine no Site</span>
                        <ArrowRight className="w-4 h-4 text-amber-400" />
                    </a>
                </div>

                {actionMessage && (
                    <div className="mt-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm animate-fadeIn">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        <span>{actionMessage}</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* ========================================================= */}
                {/* FORM CADASTRO DE LOGOMARCA (5 COLUNAS) */}
                {/* ========================================================= */}
                <div className="lg:col-span-5 space-y-6">
                    <Card className="border border-slate-200 shadow-md">
                        <div className="pb-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Award className="w-5 h-5 text-amber-500" />
                                <h2 className="text-lg font-black text-gray-900">
                                    {editingId ? 'Editar Patrocinador' : 'Cadastrar Nova Logomarca'}
                                </h2>
                            </div>
                            {editingId && (
                                <button
                                    onClick={resetForm}
                                    className="text-xs text-gray-500 hover:text-gray-800 font-bold underline"
                                >
                                    Cancelar Edição
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleSaveSponsor} className="space-y-5 mt-4">
                            {/* Nome */}
                            <Input
                                label="Nome da Marca / Patrocinador *"
                                value={sponsorName}
                                onChange={(e) => setSponsorName(e.target.value)}
                                placeholder="Ex: Mercury Marine, EMG Barcos, Marine Sports..."
                                required
                            />

                            {/* Cota / Nível de Destaque */}
                            <div>
                                <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">
                                    Nível de Destaque / Cota no Site
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedTier('master')}
                                        className={`p-3 rounded-xl border text-center transition-all ${
                                            selectedTier === 'master'
                                                ? 'border-amber-500 bg-amber-500/10 text-amber-800 font-black shadow-sm ring-2 ring-amber-400/40'
                                                : 'border-gray-200 text-gray-600 hover:bg-gray-50 font-bold text-xs'
                                        }`}
                                    >
                                        <Star className="w-4 h-4 mx-auto mb-1 text-amber-500 fill-amber-400" />
                                        <span className="text-[11px] block">MASTER</span>
                                        <span className="text-[9px] text-gray-500">Super Destaque</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSelectedTier('ouro')}
                                        className={`p-3 rounded-xl border text-center transition-all ${
                                            selectedTier === 'ouro'
                                                ? 'border-amber-500 bg-amber-500/10 text-amber-800 font-black shadow-sm ring-2 ring-amber-400/40'
                                                : 'border-gray-200 text-gray-600 hover:bg-gray-50 font-bold text-xs'
                                        }`}
                                    >
                                        <Award className="w-4 h-4 mx-auto mb-1 text-yellow-500" />
                                        <span className="text-[11px] block">OURO</span>
                                        <span className="text-[9px] text-gray-500">Destaque</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSelectedTier('apoio')}
                                        className={`p-3 rounded-xl border text-center transition-all ${
                                            selectedTier === 'apoio'
                                                ? 'border-amber-500 bg-amber-500/10 text-amber-800 font-black shadow-sm ring-2 ring-amber-400/40'
                                                : 'border-gray-200 text-gray-600 hover:bg-gray-50 font-bold text-xs'
                                        }`}
                                    >
                                        <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                                        <span className="text-[11px] block">APOIADOR</span>
                                        <span className="text-[9px] text-gray-500">Carrossel</span>
                                    </button>
                                </div>
                            </div>

                            {/* Link do Site ou Instagram */}
                            <Input
                                label="Segmento / Descrição Curta (opcional)"
                                value={sponsorDescription}
                                onChange={(e) => setSponsorDescription(e.target.value)}
                                placeholder="Ex: Motores Náuticos, Embarcações de Competição, Iscas..."
                            />
                            <Input
                                label="Link do Site ou Instagram (opcional)"
                                value={sponsorLink}
                                onChange={(e) => setSponsorLink(e.target.value)}
                                placeholder="https://mercurymarine.com ou https://instagram.com/marca"
                            />

                            {/* UPLOAD DA LOGOMARCA */}
                            <div className="space-y-2">
                                <label className="block text-xs font-black text-gray-700 uppercase tracking-wider">
                                    Logomarca Oficial * (PNG com Fundo Transparente Recomendado)
                                </label>
                                
                                {uploadedLogoUrl ? (
                                    <div className="space-y-2">
                                        {/* Dual Preview: Dark & Light Mode */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center flex flex-col items-center justify-center">
                                                <span className="text-[10px] text-gray-400 font-bold mb-2">Visualização no Fundo Escuro</span>
                                                <img
                                                    src={uploadedLogoUrl}
                                                    alt="Preview Dark"
                                                    className="max-h-16 max-w-full object-contain filter"
                                                />
                                            </div>
                                            <div className="p-3 bg-white rounded-xl border border-gray-200 text-center flex flex-col items-center justify-center">
                                                <span className="text-[10px] text-gray-500 font-bold mb-2">Visualização no Fundo Claro</span>
                                                <img
                                                    src={uploadedLogoUrl}
                                                    alt="Preview Light"
                                                    className="max-h-16 max-w-full object-contain"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setUploadedLogoUrl('')}
                                            className="text-xs text-red-600 hover:underline font-bold block"
                                        >
                                            Trocar logomarca
                                        </button>
                                    </div>
                                ) : (
                                    <ImageUploader
                                        bucket="sponsor-logos"
                                        onUploadComplete={(url) => setUploadedLogoUrl(url)}
                                        recommendedSize={{ width: 400, height: 160 }}
                                        label="Clique para enviar a Logomarca (PNG, SVG, JPG)"
                                    />
                                )}
                            </div>

                            {/* Ordem de Exibição */}
                            <div>
                                <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1">
                                    Ordem de Exibição (Prioridade)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={displayOrder}
                                    onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 1)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500"
                                />
                                <span className="text-[10px] text-gray-500 mt-1 block">
                                    Quanto menor o número, maior a prioridade e destaque na página inicial.
                                </span>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20"
                            >
                                {editingId ? 'Salvar Alterações da Logomarca' : '+ Cadastrar Patrocinador'}
                            </Button>
                        </form>
                    </Card>
                </div>

                {/* ========================================================= */}
                {/* LISTA DE PATROCINADORES CADASTRADOS (7 COLUNAS) */}
                {/* ========================================================= */}
                <div className="lg:col-span-7 space-y-6">
                    <Card className="border border-slate-200 shadow-md">
                        <div className="pb-4 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-black text-gray-900">
                                    Marcas Cadastradas ({sponsors.length})
                                </h2>
                                <p className="text-xs text-gray-500">
                                    Logomarcas ativas sendo exibidas para todos os visitantes do site.
                                </p>
                            </div>
                        </div>

                        {sponsors.length === 0 ? (
                            <div className="py-12 text-center text-gray-400">
                                <Award className="w-12 h-12 mx-auto mb-2 opacity-40 text-amber-500" />
                                <p className="font-bold text-gray-700 text-sm">Nenhum patrocinador cadastrado ainda.</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Utilize o formulário ao lado para cadastrar a primeira logomarca com destaque VIP!
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                {sponsors.map(sponsor => {
                                    const isMaster = sponsor.displayOrder <= 3;
                                    const isOuro = sponsor.displayOrder > 3 && sponsor.displayOrder <= 6;

                                    return (
                                        <div
                                            key={sponsor.id}
                                            className={`rounded-xl border p-4 bg-white flex flex-col justify-between space-y-3 transition-all duration-200 ${
                                                sponsor.active 
                                                    ? 'border-gray-200 hover:border-amber-400 hover:shadow-md' 
                                                    : 'border-dashed border-gray-300 opacity-60 bg-gray-50'
                                            }`}
                                        >
                                            {/* Top Tier Badge & Order */}
                                            <div className="flex items-center justify-between">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                                    isMaster 
                                                        ? 'bg-amber-500 text-slate-950' 
                                                        : isOuro 
                                                            ? 'bg-yellow-100 text-yellow-800' 
                                                            : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                    {isMaster ? '⭐ MASTER' : isOuro ? 'OURO' : 'APOIADOR'}
                                                </span>
                                                
                                                <span className="text-[11px] font-bold text-gray-400">
                                                    Ordem #{sponsor.displayOrder}
                                                </span>
                                            </div>

                                            {/* Logo Preview Container */}
                                            <div className="h-24 w-full bg-slate-950 rounded-lg p-3 flex items-center justify-center border border-slate-800">
                                                <img
                                                    src={sponsor.imageUrl}
                                                    alt={sponsor.name}
                                                    className="max-h-full max-w-full object-contain filter hover:brightness-110 transition-all"
                                                />
                                            </div>

                                            {/* Details */}
                                            <div>
                                                <h3 className="font-black text-sm text-gray-900 uppercase truncate">
                                                    {sponsor.name}
                                                </h3>
                                                {sponsor.linkUrl ? (
                                                    <a
                                                        href={sponsor.linkUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-xs text-amber-600 hover:underline flex items-center gap-1 font-semibold truncate mt-0.5"
                                                    >
                                                        <ExternalLink className="w-3 h-3" />
                                                        <span className="truncate">{sponsor.linkUrl}</span>
                                                    </a>
                                                ) : (
                                                    <span className="text-[11px] text-gray-400 italic">Sem link externo</span>
                                                )}
                                            </div>

                                            {/* Action buttons */}
                                            <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                                                <button
                                                    onClick={() => handleToggleActive(sponsor)}
                                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                                        sponsor.active
                                                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                    }`}
                                                >
                                                    {sponsor.active ? 'Ativo' : 'Oculto'}
                                                </button>

                                                <button
                                                    onClick={() => handleEditClick(sponsor)}
                                                    className="p-1.5 text-gray-600 hover:text-ocean-600 hover:bg-ocean-50 rounded-lg transition-colors ml-auto"
                                                    title="Editar"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>

                                                <button
                                                    onClick={() => handleDeleteClick(sponsor)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            {/* Delete Modal */}
            {deleteModalOpen && itemToDelete && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
                        <div className="bg-red-100 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-7 h-7 text-red-600" />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 mb-2">Excluir Patrocinador?</h3>
                        <p className="text-gray-600 text-xs mb-6">
                            Tem certeza de que deseja remover permanentemente <strong>{itemToDelete.name}</strong> da vitrine de patrocinadores?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteModalOpen(false)}
                                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-200"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold text-xs rounded-xl hover:bg-red-700"
                            >
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

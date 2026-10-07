import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { SponsorLogo, StageImage, ChampionGallery, Stage } from '@/types';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { Award, Star, MapPin, Trash2, Camera, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

type TabId = 'stage-images' | 'sponsors' | 'champions';

export function ImageManagement() {
    const { currentUser } = useAuth();
    
    // Default to stage-images tab
    const [activeTab, setActiveTab] = useState<TabId>('stage-images');

    // Sponsor Logos
    const [sponsorLogos, setSponsorLogos] = useState<SponsorLogo[]>([]);
    const [sponsorName, setSponsorName] = useState('');
    const [sponsorLink, setSponsorLink] = useState('');

    // Stage Images & Cover
    const [stages, setStages] = useState<Stage[]>([]);
    const [selectedStageId, setSelectedStageId] = useState('');
    const [stageImages, setStageImages] = useState<StageImage[]>([]);
    const [stageImageDesc, setStageImageDesc] = useState('');
    const [setAsCoverOnUpload, setSetAsCoverOnUpload] = useState(false);
    const [actionMessage, setActionMessage] = useState<string | null>(null);

    // Champion Gallery
    const [championImages, setChampionImages] = useState<ChampionGallery[]>([]);
    const [championCaption, setChampionCaption] = useState('');
    const [championStageId, setChampionStageId] = useState('');

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: string, type: string, imageUrl: string } | null>(null);

    useEffect(() => {
        loadSponsorLogos();
        loadStages();
        loadChampionImages();
    }, []);

    useEffect(() => {
        if (selectedStageId) {
            loadStageImages(selectedStageId);
        } else {
            setStageImages([]);
        }
    }, [selectedStageId]);

    // Automatically select first stage if available and none selected
    useEffect(() => {
        if (stages.length > 0 && !selectedStageId) {
            setSelectedStageId(stages[0].id);
        }
    }, [stages]);

    // ============================================
    // LOAD FUNCTIONS
    // ============================================

    const loadSponsorLogos = async () => {
        let query = supabase.from('sponsor_logos').select('*');
        if (currentUser?.role === 'company' && currentUser?.id) {
            query = query.eq('company_id', currentUser.id);
        }
        const { data, error } = await query.order('display_order', { ascending: true });

        if (error) {
            console.error('Erro ao carregar patrocinadores:', error);
            return;
        }

        setSponsorLogos(data.map((item: any) => ({
            id: item.id,
            name: item.name,
            imageUrl: item.image_url,
            linkUrl: item.link_url,
            displayOrder: item.display_order,
            active: item.active,
            createdAt: new Date(item.created_at),
            updatedAt: item.updated_at ? new Date(item.updated_at) : undefined
        })));
    };

    const loadStages = async () => {
        let query = supabase.from('stages').select('*');
        if (currentUser?.role === 'company' && currentUser?.id) {
            query = query.eq('company_id', currentUser.id);
        }
        const { data, error } = await query.order('date', { ascending: false });

        if (error) {
            console.error('Erro ao carregar etapas:', error);
            return;
        }

        setStages(data.map((item: any) => ({
            id: item.id,
            circuitId: item.circuit_id,
            name: item.name,
            date: new Date(item.date),
            location: item.location,
            registrationFee: item.registration_fee,
            imageUrl: item.image_url,
            status: item.status,
            createdAt: new Date(item.created_at)
        })));
    };

    const loadStageImages = async (stageId: string) => {
        const { data, error } = await supabase
            .from('stage_images')
            .select('*')
            .eq('stage_id', stageId)
            .order('display_order', { ascending: true });

        if (error) {
            console.error('Erro ao carregar imagens da etapa:', error);
            return;
        }

        setStageImages(data.map((item: any) => ({
            id: item.id,
            stageId: item.stage_id,
            imageUrl: item.image_url,
            description: item.description,
            displayOrder: item.display_order,
            createdAt: new Date(item.created_at)
        })));
    };

    const loadChampionImages = async () => {
        const { data, error } = await supabase
            .from('champion_gallery')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) {
            console.error('Erro ao carregar galeria de campeões:', error);
            return;
        }

        setChampionImages(data.map((item: any) => ({
            id: item.id,
            stageId: item.stage_id,
            teamId: item.team_id,
            imageUrl: item.image_url,
            caption: item.caption,
            displayOrder: item.display_order,
            createdAt: new Date(item.created_at)
        })));
    };

    // ============================================
    // COVER MANAGEMENT
    // ============================================

    const handleSetAsCover = async (imageUrl: string) => {
        if (!selectedStageId) return;

        try {
            const { error } = await supabase
                .from('stages')
                .update({ image_url: imageUrl })
                .eq('id', selectedStageId);

            if (error) {
                console.error('Erro ao definir foto de capa:', error);
                alert('Erro ao definir capa da etapa: ' + error.message);
                return;
            }

            // Update local state immediately
            setStages(prev => prev.map(s => s.id === selectedStageId ? { ...s, imageUrl } : s));

            setActionMessage('⭐ Foto definida como CAPA da galeria com sucesso!');
            setTimeout(() => setActionMessage(null), 4000);
        } catch (err: any) {
            console.error('Erro ao atualizar capa:', err);
            alert('Erro ao atualizar foto de capa');
        }
    };

    // ============================================
    // SAVE FUNCTIONS
    // ============================================

    const handleSponsorUpload = async (url: string) => {
        if (!sponsorName.trim()) {
            alert('Digite o nome do patrocinador');
            return;
        }

        const insertData: any = {
            name: sponsorName,
            image_url: url,
            link_url: sponsorLink || null,
            display_order: sponsorLogos.length,
            active: true
        };
        if (currentUser?.role === 'company' && currentUser?.id) {
            insertData.company_id = currentUser.id;
        }

        const { error } = await supabase
            .from('sponsor_logos')
            .insert(insertData);

        if (error) {
            console.error('Erro ao salvar patrocinador:', error);
            alert('Erro ao salvar patrocinador');
            return;
        }

        setSponsorName('');
        setSponsorLink('');
        loadSponsorLogos();
        setActionMessage('Patrocinador adicionado com sucesso!');
        setTimeout(() => setActionMessage(null), 3000);
    };

    const handleStageImageUpload = async (url: string) => {
        if (!selectedStageId) {
            alert('Selecione uma etapa');
            return;
        }

        const currentStage = stages.find(s => s.id === selectedStageId);

        // Save image to stage_images
        const { error } = await supabase
            .from('stage_images')
            .insert({
                stage_id: selectedStageId,
                image_url: url,
                description: stageImageDesc.trim() || null,
                display_order: stageImages.length
            });

        if (error) {
            console.error('Erro ao salvar imagem da etapa:', error);
            alert('Erro ao salvar imagem');
            return;
        }

        // Check if we should set this as stage cover
        // (if explicit checkbox is checked OR if stage currently has no cover image)
        if (setAsCoverOnUpload || !currentStage?.imageUrl) {
            await supabase
                .from('stages')
                .update({ image_url: url })
                .eq('id', selectedStageId);

            setStages(prev => prev.map(s => s.id === selectedStageId ? { ...s, imageUrl: url } : s));
            setActionMessage('Foto adicionada e marcada como CAPA da etapa!');
        } else {
            setActionMessage('Foto adicionada à galeria com sucesso!');
        }

        setStageImageDesc('');
        setSetAsCoverOnUpload(false);
        loadStageImages(selectedStageId);
        setTimeout(() => setActionMessage(null), 4000);
    };

    const handleChampionUpload = async (url: string) => {
        const { error } = await supabase
            .from('champion_gallery')
            .insert({
                stage_id: championStageId || null,
                image_url: url,
                caption: championCaption || null,
                display_order: championImages.length
            });

        if (error) {
            console.error('Erro ao salvar foto de campeão:', error);
            alert('Erro ao salvar foto');
            return;
        }

        setChampionCaption('');
        setChampionStageId('');
        loadChampionImages();
        setActionMessage('Foto de campeão adicionada com sucesso!');
        setTimeout(() => setActionMessage(null), 3000);
    };

    // ============================================
    // DELETE FUNCTIONS
    // ============================================

    const handleDeleteClick = (id: string, type: string, imageUrl: string) => {
        setItemToDelete({ id, type, imageUrl });
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        const { id, type, imageUrl } = itemToDelete;

        const path = imageUrl.split('/').pop();

        try {
            if (type === 'sponsor') {
                if (path) await supabase.storage.from('sponsor-logos').remove([path]);
                await supabase.from('sponsor_logos').delete().eq('id', id);
                loadSponsorLogos();
            } else if (type === 'stage-image') {
                if (path) await supabase.storage.from('stage-images').remove([path]);
                await supabase.from('stage_images').delete().eq('id', id);

                // If deleted image was the cover of this stage, reassign cover or clear it
                const currentStage = stages.find(s => s.id === selectedStageId);
                if (currentStage?.imageUrl === imageUrl) {
                    const remaining = stageImages.filter(img => img.id !== id);
                    const newCover = remaining.length > 0 ? remaining[0].imageUrl : null;

                    await supabase
                        .from('stages')
                        .update({ image_url: newCover })
                        .eq('id', selectedStageId);

                    setStages(prev => prev.map(s => s.id === selectedStageId ? { ...s, imageUrl: newCover || undefined } : s));
                }

                if (selectedStageId) loadStageImages(selectedStageId);
            } else if (type === 'champion') {
                if (path) await supabase.storage.from('champion-gallery').remove([path]);
                await supabase.from('champion_gallery').delete().eq('id', id);
                loadChampionImages();
            }

            setDeleteModalOpen(false);
            setItemToDelete(null);
            setActionMessage('Item excluído com sucesso.');
            setTimeout(() => setActionMessage(null), 3000);
        } catch (error) {
            console.error('Erro ao excluir item:', error);
            alert('Erro ao excluir item.');
        }
    };

    // Current selected stage object
    const currentSelectedStage = stages.find(s => s.id === selectedStageId);

    const tabs = [
        { id: 'stage-images' as TabId, label: 'Fotos das Etapas & Capas', icon: <Camera className="w-5 h-5" /> },
        { id: 'sponsors' as TabId, label: 'Patrocinadores', icon: <Award className="w-5 h-5" /> },
        { id: 'champions' as TabId, label: 'Galeria de Campeões', icon: <Star className="w-5 h-5" /> },
    ];

    return (
        <AdminLayout>
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                            <span>Gerenciar Galerias & Fotos</span>
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Adicione fotos das etapas, marque a <strong>Capa da Galeria</strong> que desfila na página principal e gerencie patrocinadores.
                        </p>
                    </div>

                    {/* Quick navigation link to homepage */}
                    <a
                        href="/"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-ocean-50 text-ocean-700 hover:bg-ocean-100 border border-ocean-200 text-xs font-bold transition-colors w-fit"
                    >
                        Ver Galeria no Site <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                </div>

                {/* Floating Action Feedback Notification */}
                {actionMessage && (
                    <div className="mt-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg text-sm font-bold flex items-center gap-2 animate-fadeIn shadow-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        <span>{actionMessage}</span>
                    </div>
                )}
            </div>

            {/* TAB SELECTOR */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="flex space-x-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 py-4 px-4 border-b-2 font-bold text-sm transition-all ${
                                activeTab === tab.id
                                    ? 'border-amber-500 text-amber-600 bg-amber-50/50 rounded-t-lg'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* CONTENT */}
            <div className="space-y-6">
                {/* ========================================================= */}
                {/* STAGE IMAGES & COVER MANAGEMENT TAB */}
                {/* ========================================================= */}
                {activeTab === 'stage-images' && (
                    <>
                        {/* Stage Selector Card */}
                        <Card className="border border-slate-200 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
                                <div>
                                    <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-amber-500" />
                                        1. Selecionar Etapa
                                    </h2>
                                    <p className="text-xs text-gray-500">
                                        Escolha a etapa para adicionar fotos e definir a imagem de capa.
                                    </p>
                                </div>

                                {stages.length === 0 && (
                                    <Link
                                        to="/admin/stages"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-black hover:bg-amber-400 transition-colors"
                                    >
                                        + Cadastrar Etapa
                                    </Link>
                                )}
                            </div>

                            {stages.length === 0 ? (
                                <div className="p-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                    <Camera className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                    <p className="font-bold text-gray-700 text-sm">Nenhuma etapa cadastrada no momento.</p>
                                    <p className="text-xs text-gray-500 mt-1 mb-4">
                                        Para gerenciar fotos da galeria, primeiro cadastre suas etapas no painel.
                                    </p>
                                    <Link
                                        to="/admin/stages"
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-ocean-600 text-white font-bold text-xs hover:bg-ocean-700"
                                    >
                                        Ir para Cadastro de Etapas
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <select
                                        value={selectedStageId}
                                        onChange={(e) => setSelectedStageId(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl font-bold text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
                                    >
                                        <option value="">-- Selecione uma etapa --</option>
                                        {stages.map(stage => (
                                            <option key={stage.id} value={stage.id}>
                                                {stage.name} · {stage.date.toLocaleDateString('pt-BR')} {stage.location ? `(${stage.location})` : ''}
                                            </option>
                                        ))}
                                    </select>

                                    {/* Current Stage Cover Spotlight Banner */}
                                    {currentSelectedStage && (
                                        <div className="p-4 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 via-yellow-50/50 to-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                {currentSelectedStage.imageUrl ? (
                                                    <div className="relative w-20 h-14 rounded-lg overflow-hidden border-2 border-amber-500 shadow-md flex-shrink-0">
                                                        <img
                                                            src={currentSelectedStage.imageUrl}
                                                            alt="Capa Atual"
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute top-0 right-0 p-0.5 bg-amber-500 text-slate-950">
                                                            <Star className="w-3 h-3 fill-slate-950" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="w-20 h-14 rounded-lg bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-400 flex-shrink-0 text-[10px] font-bold text-center px-1">
                                                        Sem Capa
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded">
                                                            Capa Atual da Galeria
                                                        </span>
                                                        <span className="text-xs font-bold text-gray-800 truncate">
                                                            {currentSelectedStage.name}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-600 mt-0.5">
                                                        {currentSelectedStage.imageUrl 
                                                            ? 'Esta foto é a capa exibida no carrossel animado da página inicial.'
                                                            : 'Nenhuma foto definida como capa ainda. Envie fotos abaixo e marque uma como capa.'}
                                                    </p>
                                                </div>
                                            </div>

                                            <span className="text-xs font-extrabold text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded-md border border-amber-300">
                                                {stageImages.length} fotos nesta etapa
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>

                        {/* Upload Photos to Selected Stage */}
                        {selectedStageId && (
                            <Card className="border border-slate-200 shadow-sm">
                                <h2 className="text-lg font-black text-gray-900 mb-2 flex items-center gap-2">
                                    <Camera className="w-5 h-5 text-ocean-600" />
                                    2. Adicionar Fotos à Galeria
                                </h2>
                                <p className="text-xs text-gray-500 mb-4">
                                    Envie fotos dos barcos, capturas, largada, pesagem e entrega de troféus.
                                </p>

                                <div className="space-y-4">
                                    <Input
                                        label="Legenda / Descrição da foto (opcional)"
                                        value={stageImageDesc}
                                        onChange={(e) => setStageImageDesc(e.target.value)}
                                        placeholder="Ex: Largada da prova, Pódio dos campeões, Tucunaré de 62cm..."
                                    />

                                    {/* Checkbox to set as cover automatically on upload */}
                                    <label className="flex items-center gap-2.5 text-xs font-bold text-gray-700 cursor-pointer p-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-amber-50 hover:border-amber-200 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={setAsCoverOnUpload || !currentSelectedStage?.imageUrl}
                                            onChange={(e) => setSetAsCoverOnUpload(e.target.checked)}
                                            className="w-4 h-4 text-amber-500 rounded border-gray-300 focus:ring-amber-400"
                                        />
                                        <span className="flex items-center gap-1.5">
                                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                            Marcar esta foto automaticamente como a <strong>CAPA DA GALERIA</strong> desta etapa
                                        </span>
                                    </label>

                                    <ImageUploader
                                        bucket="stage-images"
                                        onUploadComplete={handleStageImageUpload}
                                        recommendedSize={{ width: 1200, height: 800 }}
                                        label="Clique ou arraste a foto para enviar (JPEG, PNG, WebP)"
                                    />
                                </div>
                            </Card>
                        )}

                        {/* Existing Photos List & Cover Selection */}
                        {selectedStageId && (
                            <Card className="border border-slate-200 shadow-sm">
                                <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
                                    <div>
                                        <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-amber-500" />
                                            3. Fotos da Etapa ({stageImages.length})
                                        </h2>
                                        <p className="text-xs text-gray-500">
                                            Clique em <strong>"Definir como Capa"</strong> para escolher a imagem que representa esta etapa na vitrine da Home.
                                        </p>
                                    </div>
                                </div>

                                {stageImages.length === 0 ? (
                                    <div className="py-8 text-center text-gray-400">
                                        <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm font-medium">Nenhuma foto adicionada para esta etapa ainda.</p>
                                        <p className="text-xs text-gray-500 mt-1">Use a área de upload acima para adicionar a primeira foto.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {stageImages.map(img => {
                                            const isCover = currentSelectedStage?.imageUrl === img.imageUrl;

                                            return (
                                                <div 
                                                    key={img.id} 
                                                    className={`group relative rounded-xl overflow-hidden border-2 transition-all p-2.5 flex flex-col justify-between space-y-2 bg-white ${
                                                        isCover 
                                                            ? 'border-amber-500 bg-amber-50/20 shadow-md ring-2 ring-amber-400/20' 
                                                            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                                    }`}
                                                >
                                                    {/* Image Box */}
                                                    <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-gray-100">
                                                        <img 
                                                            src={img.imageUrl} 
                                                            alt={img.description || 'Foto da etapa'} 
                                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                                                        />

                                                        {/* Cover badge overlay if cover */}
                                                        {isCover && (
                                                            <div className="absolute top-2 left-2 bg-amber-500 text-slate-950 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1">
                                                                <Star className="w-3 h-3 fill-slate-950" />
                                                                CAPA ATUAL
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Description */}
                                                    <div className="min-h-[2.5rem]">
                                                        {img.description ? (
                                                            <p className="text-xs text-gray-700 font-medium line-clamp-2" title={img.description}>
                                                                {img.description}
                                                            </p>
                                                        ) : (
                                                            <span className="text-[11px] text-gray-400 italic">Sem legenda</span>
                                                        )}
                                                    </div>

                                                    {/* Actions: Set as Cover & Delete */}
                                                    <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                                                        {isCover ? (
                                                            <div className="flex-1 py-1.5 px-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-800 text-[11px] font-black text-center flex items-center justify-center gap-1">
                                                                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                                                CAPA DA GALERIA
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleSetAsCover(img.imageUrl)}
                                                                className="flex-1 py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-amber-500 hover:text-slate-950 text-slate-700 border border-slate-200 hover:border-amber-500 text-[11px] font-black transition-all flex items-center justify-center gap-1"
                                                                title="Definir esta foto como capa da galeria na Home"
                                                            >
                                                                <Star className="w-3 h-3 text-amber-500" />
                                                                Definir como Capa
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={() => handleDeleteClick(img.id, 'stage-image', img.imageUrl)}
                                                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                                                            title="Excluir foto"
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
                        )}
                    </>
                )}

                {/* ========================================================= */}
                {/* SPONSORS TAB */}
                {/* ========================================================= */}
                {activeTab === 'sponsors' && (
                    <>
                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="font-black text-amber-800 text-sm flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-amber-500" />
                                    Painel Exclusivo de Patrocinadores & Logomarcas
                                </h3>
                                <p className="text-xs text-amber-700 mt-0.5">
                                    Você também pode gerenciar cotas VIP (Master, Ouro e Apoio) e pré-visualizar a logomarca no painel dedicado.
                                </p>
                            </div>
                            <Link to="/admin/sponsors" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg transition-colors whitespace-nowrap">
                                Abrir Painel Completo →
                            </Link>
                        </div>
                        <Card>
                            <h2 className="text-xl font-bold mb-4">Novo Patrocinador</h2>
                            <div className="space-y-4">
                                <Input
                                    label="Nome do Patrocinador"
                                    value={sponsorName}
                                    onChange={(e) => setSponsorName(e.target.value)}
                                    placeholder="Ex: Mercury Marine, EMG Barcos..."
                                    required
                                />
                                <Input
                                    label="Link do Site (opcional)"
                                    value={sponsorLink}
                                    onChange={(e) => setSponsorLink(e.target.value)}
                                    placeholder="https://exemplo.com.br"
                                />
                                <ImageUploader
                                    bucket="sponsor-logos"
                                    onUploadComplete={handleSponsorUpload}
                                    recommendedSize={{ width: 200, height: 80 }}
                                    label="Logo do Patrocinador (PNG com fundo transparente)"
                                />
                            </div>
                        </Card>

                        <Card>
                            <h2 className="text-xl font-bold mb-4">Patrocinadores Cadastrados ({sponsorLogos.length})</h2>
                            {sponsorLogos.length === 0 ? (
                                <p className="text-gray-400 text-sm">Nenhum patrocinador cadastrado ainda.</p>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {sponsorLogos.map(sponsor => (
                                        <div key={sponsor.id} className="border rounded-lg p-3 space-y-2 bg-white flex flex-col justify-between">
                                            <div className="h-24 flex items-center justify-center bg-gray-50 rounded p-2">
                                                <img src={sponsor.imageUrl} alt={sponsor.name} className="max-h-full max-w-full object-contain" />
                                            </div>
                                            <p className="font-bold text-xs truncate text-center">{sponsor.name}</p>
                                            <Button
                                                variant="outline"
                                                onClick={() => handleDeleteClick(sponsor.id, 'sponsor', sponsor.imageUrl)}
                                                className="w-full text-xs text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </>
                )}

                {/* ========================================================= */}
                {/* CHAMPIONS TAB */}
                {/* ========================================================= */}
                {activeTab === 'champions' && (
                    <>
                        <Card>
                            <h2 className="text-xl font-bold mb-4">Nova Foto de Campeão</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Etapa (opcional)
                                    </label>
                                    <select
                                        value={championStageId}
                                        onChange={(e) => setChampionStageId(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean-500 text-sm"
                                    >
                                        <option value="">-- Nenhuma / Geral --</option>
                                        {stages.map(stage => (
                                            <option key={stage.id} value={stage.id}>
                                                {stage.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <Input
                                    label="Legenda (opcional)"
                                    value={championCaption}
                                    onChange={(e) => setChampionCaption(e.target.value)}
                                    placeholder="Ex: Campeão Etapa 1 - Equipe Tucuna Master"
                                />
                                <ImageUploader
                                    bucket="champion-gallery"
                                    onUploadComplete={handleChampionUpload}
                                    recommendedSize={{ width: 800, height: 600 }}
                                    maxSizeMB={8}
                                    label="Foto do Campeão / Cerimônia"
                                />
                            </div>
                        </Card>

                        <Card>
                            <h2 className="text-xl font-bold mb-4">Galeria de Campeões ({championImages.length})</h2>
                            {championImages.length === 0 ? (
                                <p className="text-gray-400 text-sm">Nenhuma foto de campeão adicionada ainda.</p>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {championImages.map(img => (
                                        <div key={img.id} className="border rounded-lg p-3 space-y-2 bg-white">
                                            <img src={img.imageUrl} alt={img.caption || ''} className="w-full h-40 object-cover rounded" />
                                            {img.caption && (
                                                <p className="text-xs text-gray-600 truncate">{img.caption}</p>
                                            )}
                                            <Button
                                                variant="outline"
                                                onClick={() => handleDeleteClick(img.id, 'champion', img.imageUrl)}
                                                className="w-full text-xs text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </>
                )}

                {/* ========================================================= */}
                {/* DELETE CONFIRMATION MODAL */}
                {/* ========================================================= */}
                {deleteModalOpen && itemToDelete && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
                            <div className="bg-red-100 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-7 h-7 text-red-600" />
                            </div>
                            <h3 className="text-lg font-black text-gray-900 mb-2">Excluir Item?</h3>
                            <p className="text-gray-600 text-xs mb-6">
                                Tem certeza de que deseja excluir permanentemente esta imagem? Essa ação não pode ser desfeita.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold text-xs rounded-xl hover:bg-red-700 transition-colors shadow-lg"
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

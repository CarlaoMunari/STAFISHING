import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CarouselImage } from '@/types';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { Plus, Trash2, Upload, Save, Globe, Image as ImageIcon, Phone, Mail, MapPin, Instagram, Facebook, Youtube, Layout, Monitor, Smartphone } from 'lucide-react';
import { ImageUploader } from '@/components/admin/ImageUploader';


export function CarouselManagement() {
    const { companyId } = useCompany();
    const { currentUser } = useAuth();
    const [images, setImages] = useState<CarouselImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [companies, setCompanies] = useState<any[]>([]);

    // Logo & Site Text Settings State
    const [logoUrl, setLogoUrl] = useState('');
    const [heroTitle, setHeroTitle] = useState('PESCA ESPORTIVA COM CONSCIÊNCIA');
    const [heroSubtitle, setHeroSubtitle] = useState('Unindo esporte, técnica e paixão pela natureza. Pratique a pesca esportiva com responsabilidade e contribua para a preservação dos nossos rios e peixes.');
    const [footerDescription, setFooterDescription] = useState('Circuito Pesca Promovendo a pesca esportiva e a preservação ambiental através de competições organizadas e profissionais.');
    const [contactEmail, setContactEmail] = useState('contato@circuitopesca.com.br');
    const [contactPhone, setContactPhone] = useState('(11) 99999-9999');
    const [contactAddress, setContactAddress] = useState('Av. da Pesca, 1000\nSão Paulo - SP');
    const [socialInstagram, setSocialInstagram] = useState('');
    const [socialFacebook, setSocialFacebook] = useState('');
    const [socialYoutube, setSocialYoutube] = useState('');

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [imageToDelete, setImageToDelete] = useState<{ id: string, url: string } | null>(null);

    // Form state
    const [altText, setAltText] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [selectedMobileFile, setSelectedMobileFile] = useState<File | null>(null);
    const [mobilePreviewUrl, setMobilePreviewUrl] = useState('');
    const [selectedCompanyId, setSelectedCompanyId] = useState('');

    useEffect(() => {
        loadData();
        if (currentUser?.role === 'super_admin') {
            loadCompanies();
        }
    }, [currentUser, companyId]);

    const loadCompanies = async () => {
        const { data } = await supabase
            .from('users')
            .select('*')
            .eq('role', 'company')
            .order('name');
        if (data) setCompanies(data);
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const targetCompanyId = companyId || currentUser?.id;

            // Load Carousel Images
            let query = supabase.from('carousel_images').select('*');
            if (targetCompanyId) {
                query = query.eq('company_id', targetCompanyId);
            }
            const { data: imagesData } = await query.order('order', { ascending: true });

            if (imagesData) {
                const loadedImages = imagesData.map((item: any) => ({
                    ...item,
                    createdAt: new Date(item.created_at),
                })) as CarouselImage[];
                setImages(loadedImages);
            }

            // Load Company Settings
            if (targetCompanyId) {
                const { data: settingsData } = await supabase
                    .from('company_settings')
                    .select('*')
                    .eq('company_id', targetCompanyId)
                    .maybeSingle();

                if (settingsData) {
                    if (settingsData.logo_url) setLogoUrl(settingsData.logo_url);
                    if (settingsData.hero_title || settingsData.title) {
                        setHeroTitle(settingsData.hero_title || settingsData.title);
                    }
                    if (settingsData.hero_subtitle || settingsData.subtitle) {
                        setHeroSubtitle(settingsData.hero_subtitle || settingsData.subtitle);
                    }
                    if (settingsData.footer_description) {
                        setFooterDescription(settingsData.footer_description);
                    }
                    if (settingsData.contact_email) setContactEmail(settingsData.contact_email);
                    if (settingsData.contact_phone) setContactPhone(settingsData.contact_phone);
                    if (settingsData.contact_address) setContactAddress(settingsData.contact_address);
                    if (settingsData.social_instagram) setSocialInstagram(settingsData.social_instagram);
                    if (settingsData.social_facebook) setSocialFacebook(settingsData.social_facebook);
                    if (settingsData.social_youtube) setSocialYoutube(settingsData.social_youtube);
                }
            }
        } catch (error) {
            console.error('Erro ao carregar dados do site:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        const targetCompanyId = companyId || currentUser?.id;
        if (!targetCompanyId) return;

        setSavingSettings(true);
        try {
            const settings = {
                company_id: targetCompanyId,
                logo_url: logoUrl,
                hero_title: heroTitle,
                hero_subtitle: heroSubtitle,
                title: heroTitle,
                subtitle: heroSubtitle,
                footer_description: footerDescription,
                contact_email: contactEmail,
                contact_phone: contactPhone,
                contact_address: contactAddress,
                social_instagram: socialInstagram,
                social_facebook: socialFacebook,
                social_youtube: socialYoutube,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('company_settings')
                .upsert(settings, { onConflict: 'company_id' });

            if (error) throw error;

            alert('✅ Configurações do site salvas com sucesso!');
        } catch (error: any) {
            console.error('Erro ao salvar configurações do site:', error);
            alert(`❌ Erro ao salvar configurações: ${error.message}`);
        } finally {
            setSavingSettings(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleMobileFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedMobileFile(file);
            setMobilePreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleAddImage = async () => {
        if (!selectedFile || !altText) return;

        setSaving(true);
        try {
            // 1. Upload Desktop
            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `carousel/desktop_${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(fileName, selectedFile, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(fileName);

            // 2. Upload Mobile (se fornecido)
            let mobilePublicUrl = null;
            if (selectedMobileFile) {
                const mobileExt = selectedMobileFile.name.split('.').pop();
                const mobileFileName = `carousel/mobile_${Date.now()}.${mobileExt}`;
                const { error: mobileUploadError } = await supabase.storage
                    .from('images')
                    .upload(mobileFileName, selectedMobileFile, { upsert: true });

                if (!mobileUploadError) {
                    const { data: { publicUrl: mUrl } } = supabase.storage
                        .from('images')
                        .getPublicUrl(mobileFileName);
                    mobilePublicUrl = mUrl;
                }
            }

            // 3. Salvar no banco
            const { error: dbError } = await supabase
                .from('carousel_images')
                .insert({
                    url: publicUrl,
                    mobile_url: mobilePublicUrl,
                    alt: altText,
                    link_url: linkUrl || null,
                    order: images.length,
                    company_id: selectedCompanyId || companyId || currentUser?.id,
                });

            if (dbError) throw dbError;

            setModalOpen(false);
            setSelectedFile(null);
            setPreviewUrl('');
            setSelectedMobileFile(null);
            setMobilePreviewUrl('');
            setAltText('');
            setLinkUrl('');
            setSelectedCompanyId('');
            loadData();
        } catch (error) {
            console.error('Erro ao adicionar imagem:', error);
            alert('Erro ao adicionar imagem');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (id: string, url: string) => {
        setImageToDelete({ id, url });
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteImage = async () => {
        if (!imageToDelete) return;

        try {
            const { error: dbError } = await supabase
                .from('carousel_images')
                .delete()
                .eq('id', imageToDelete.id);

            if (dbError) throw dbError;

            const path = imageToDelete.url.includes('/storage/v1/object/public/images/') ? imageToDelete.url.split('/storage/v1/object/public/images/')[1] : null;
            if (path) {
                await supabase.storage.from('images').remove([path]);
            }

            loadData();
            setIsDeleteModalOpen(false);
            setImageToDelete(null);
        } catch (error) {
            console.error('Erro ao excluir imagem:', error);
            alert('Erro ao excluir imagem');
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
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                            <Globe className="w-8 h-8 text-blue-600" />
                            Gerenciar Site
                        </h1>
                        <p className="text-gray-500 mt-1">Personalize a Logo, Banner Principal, Rodapé e Imagens do Carrossel do seu Site</p>
                    </div>
                    <Button variant="primary" onClick={handleSaveSettings} loading={savingSettings}>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Alterações do Site
                    </Button>
                </div>

                {/* 1. SEÇÃO: LOGO DA EMPRESA */}
                <Card className="p-6">
                    <div className="flex items-center gap-2 mb-4 border-b pb-4">
                        <ImageIcon className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-bold text-gray-900">Logo da Empresa</h2>
                    </div>
                    <div>
                        <ImageUploader
                            bucket="company-logos"
                            onUploadComplete={(url) => setLogoUrl(url)}
                            maxSizeMB={2}
                            allowedTypes={['image/png', 'image/jpeg', 'image/svg+xml']}
                            recommendedSize={{ width: 200, height: 200 }}
                            label="Selecionar Logo da Empresa"
                        />
                        <p className="text-xs text-gray-500 mt-2">Recomendado: PNG transparente, 200x200px (máx. 2MB). Exibido no cabeçalho do site.</p>
                        {logoUrl && (
                            <div className="mt-4 p-4 bg-gray-50 border rounded-lg flex items-center gap-4">
                                <img src={logoUrl} alt="Logo da empresa" className="h-16 w-16 object-contain border p-1 rounded bg-white" />
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Logo atual cadastrada</p>
                                    <p className="text-xs text-gray-500 break-all">{logoUrl}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>

                {/* 2. SEÇÃO: TEXTOS DO BANNER PRINCIPAL (HERO) */}
                <Card className="p-6">
                    <div className="flex items-center gap-2 mb-6 border-b pb-4">
                        <Layout className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-bold text-gray-900">Banner Principal (Hero Banner)</h2>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Título do Banner Principal
                            </label>
                            <Input
                                value={heroTitle}
                                onChange={(e) => setHeroTitle(e.target.value)}
                                placeholder="Ex: PESCA ESPORTIVA COM CONSCIÊNCIA"
                            />
                            <p className="text-xs text-gray-500 mt-1">Exibido em destaque no topo da página inicial do site.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Subtítulo / Descrição do Banner
                            </label>
                            <textarea
                                value={heroSubtitle}
                                onChange={(e) => setHeroSubtitle(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Unindo esporte, técnica e paixão pela natureza..."
                            />
                            <p className="text-xs text-gray-500 mt-1">Texto explicativo exibido logo abaixo do título do banner.</p>
                        </div>
                    </div>
                </Card>

                {/* 3. SEÇÃO: RODAPÉ DO SITE (FOOTER) */}
                <Card className="p-6">
                    <div className="flex items-center gap-2 mb-6 border-b pb-4">
                        <Phone className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-bold text-gray-900">Informações e Contato do Rodapé (Footer)</h2>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Texto de Descrição do Rodapé
                            </label>
                            <textarea
                                value={footerDescription}
                                onChange={(e) => setFooterDescription(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Circuito Pesca Promovendo a pesca esportiva..."
                            />
                            <p className="text-xs text-gray-500 mt-1">Descrição institucional exibida na primeira coluna do rodapé.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-500" />
                                    Telefone / WhatsApp
                                </label>
                                <Input
                                    value={contactPhone}
                                    onChange={(e) => setContactPhone(e.target.value)}
                                    placeholder="(11) 99999-9999"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-500" />
                                    E-mail de Contato
                                </label>
                                <Input
                                    type="email"
                                    value={contactEmail}
                                    onChange={(e) => setContactEmail(e.target.value)}
                                    placeholder="contato@empresa.com.br"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-500" />
                                Endereço
                            </label>
                            <textarea
                                value={contactAddress}
                                onChange={(e) => setContactAddress(e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Av. da Pesca, 1000 - São Paulo - SP"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                    <Instagram className="w-4 h-4 text-pink-600" />
                                    Instagram (URL)
                                </label>
                                <Input
                                    value={socialInstagram}
                                    onChange={(e) => setSocialInstagram(e.target.value)}
                                    placeholder="https://instagram.com/seuPerfil"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                    <Facebook className="w-4 h-4 text-blue-600" />
                                    Facebook (URL)
                                </label>
                                <Input
                                    value={socialFacebook}
                                    onChange={(e) => setSocialFacebook(e.target.value)}
                                    placeholder="https://facebook.com/seuPerfil"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                    <Youtube className="w-4 h-4 text-red-600" />
                                    YouTube (URL)
                                </label>
                                <Input
                                    value={socialYoutube}
                                    onChange={(e) => setSocialYoutube(e.target.value)}
                                    placeholder="https://youtube.com/c/seuCanal"
                                />
                            </div>
                        </div>
                    </div>
                </Card>

                {/* 4. SEÇÃO: IMAGENS DO CARROSSEL */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-6 border-b pb-4">
                        <div className="flex items-center gap-2">
                            <ImageIcon className="w-5 h-5 text-blue-600" />
                            <h2 className="text-lg font-bold text-gray-900">Imagens do Carrossel (Banner Superior)</h2>
                        </div>
                        <Button variant="primary" onClick={() => setModalOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar Imagem
                        </Button>
                    </div>

                    {images.length === 0 ? (
                        <div className="p-8 text-center bg-gray-50 rounded-lg border border-dashed">
                            <p className="text-gray-600 mb-4">Nenhuma imagem cadastrada no carrossel. Adicione a primeira imagem!</p>
                            <Button variant="outline" onClick={() => setModalOpen(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Adicionar Primeira Imagem
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {images.map((image) => {
                                const mUrl = (image as any).mobile_url || (image as any).mobileUrl;
                                return (
                                    <Card key={image.id} className="overflow-hidden border hover:shadow-md transition-shadow">
                                        <div className="relative">
                                            <img
                                                src={image.url}
                                                alt={image.alt}
                                                className="w-full h-44 object-cover rounded-t-lg"
                                            />
                                            <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-xs font-semibold px-2.5 py-1 rounded flex items-center gap-1">
                                                <Monitor className="w-3.5 h-3.5 text-blue-400" /> Desktop
                                            </span>
                                            {mUrl && (
                                                <span className="absolute top-2 right-2 bg-emerald-600/90 text-white text-xs font-semibold px-2.5 py-1 rounded flex items-center gap-1">
                                                    <Smartphone className="w-3.5 h-3.5" /> Mobile Ativo
                                                </span>
                                            )}
                                        </div>

                                        <div className="p-4 space-y-3">
                                            <p className="text-sm font-bold text-gray-900 truncate">{image.alt}</p>
                                            {mUrl ? (
                                                <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded">
                                                    <img src={mUrl} alt="Mobile preview" className="w-8 h-10 object-cover rounded border" />
                                                    <span className="text-xs text-emerald-800 font-medium">Imagem exclusiva para Celular ativa</span>
                                                </div>
                                            ) : (
                                                <div className="p-2 bg-gray-50 border rounded text-xs text-gray-500">
                                                    Sem versão celular específica (usa a versão desktop)
                                                </div>
                                            )}
                                            {image.link_url && (
                                                <p className="text-xs text-blue-600 truncate">{image.link_url}</p>
                                            )}
                                            <Button
                                                variant="danger"
                                                onClick={() => handleDeleteClick(image.id, image.url)}
                                                className="w-full mt-2"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Excluir Imagem
                                            </Button>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </Card>

                {/* Modal Upload Imagem */}
                <Modal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    title="Adicionar Imagem ao Carrossel"
                >
                    <div className="space-y-6">
                        {/* 🖥️ UPLOAD DESKTOP */}
                        <div className="p-4 bg-slate-50 border rounded-lg space-y-3">
                            <label className="block text-sm font-bold text-slate-800 flex items-center gap-2">
                                <Monitor className="w-4 h-4 text-blue-600" />
                                1. Imagem para Computador / Desktop (Obrigatória)
                            </label>
                            <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center bg-white">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    id="carousel-image-upload"
                                />
                                <label htmlFor="carousel-image-upload" className="cursor-pointer flex flex-col items-center gap-1">
                                    <Upload className="w-6 h-6 text-slate-400" />
                                    <span className="text-sm text-slate-700 font-medium">Clique para escolher a imagem do Computador</span>
                                    <span className="text-xs text-slate-500">Ideal: Formato Horizontal (ex: 1600x600px ou 1920x600px)</span>
                                </label>
                            </div>
                            {previewUrl && (
                                <div className="mt-2">
                                    <span className="text-xs font-semibold text-slate-600 block mb-1">Preview Desktop:</span>
                                    <img src={previewUrl} alt="Preview Desktop" className="w-full h-32 object-cover rounded border" />
                                </div>
                            )}
                        </div>

                        {/* 📱 UPLOAD MOBILE */}
                        <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-3">
                            <label className="block text-sm font-bold text-emerald-900 flex items-center gap-2">
                                <Smartphone className="w-4 h-4 text-emerald-600" />
                                2. Imagem para Celular / Mobile (Recomendada)
                            </label>
                            <p className="text-xs text-emerald-700">
                                Envie uma imagem com formato <strong>Vertical / Quadrado (ex: 800x1000px ou 600x800px)</strong> formatada especialmente para telas de celulares.
                            </p>
                            <div className="border-2 border-dashed border-emerald-300 rounded-lg p-4 text-center bg-white">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleMobileFileSelect}
                                    className="hidden"
                                    id="carousel-mobile-image-upload"
                                />
                                <label htmlFor="carousel-mobile-image-upload" className="cursor-pointer flex flex-col items-center gap-1">
                                    <Upload className="w-6 h-6 text-emerald-500" />
                                    <span className="text-sm text-emerald-800 font-medium">Clique para escolher a arte do Celular</span>
                                    <span className="text-xs text-emerald-600 font-medium">Formato ideal: 800x1000px ou 600x800px (Vertical)</span>
                                </label>
                            </div>
                            {mobilePreviewUrl && (
                                <div className="mt-2">
                                    <span className="text-xs font-semibold text-emerald-700 block mb-1">Preview Celular:</span>
                                    <img src={mobilePreviewUrl} alt="Preview Mobile" className="h-40 w-auto max-w-[200px] object-cover rounded border mx-auto" />
                                </div>
                            )}
                        </div>

                        {currentUser?.role === 'super_admin' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                                <select
                                    value={selectedCompanyId}
                                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Minha conta (Super Admin)</option>
                                    {companies.map(company => (
                                        <option key={company.id} value={company.id}>
                                            {company.name} ({company.slug})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <Input
                            label="Texto Alternativo (Alt)"
                            value={altText}
                            onChange={(e) => setAltText(e.target.value)}
                            placeholder="Descrição da imagem"
                            required
                        />

                        <Input
                            label="Link (URL) - Opcional"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            placeholder="https://exemplo.com (deixe vazio se não quiser link)"
                        />

                        <Button
                            variant="primary"
                            onClick={handleAddImage}
                            loading={saving}
                            disabled={!selectedFile || !altText}
                            className="w-full"
                        >
                            Fazer Upload e Salvar
                        </Button>
                    </div>
                </Modal>

                {/* Modal Exclusão */}
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center">
                            <div className="bg-red-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Imagem?</h3>
                            <p className="text-gray-600 mb-6">
                                Tem certeza que deseja excluir esta imagem?
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
                                    onClick={confirmDeleteImage}
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

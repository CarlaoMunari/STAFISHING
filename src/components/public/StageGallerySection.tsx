import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams } from 'react-router-dom';
import { 
    Camera, 
    Image as ImageIcon, 
    ChevronLeft, 
    ChevronRight, 
    X, 
    Calendar, 
    MapPin, 
    Sparkles, 
    Eye
} from 'lucide-react';

export interface StagePhoto {
    id: string;
    imageUrl: string;
    description?: string;
}

export interface StageGalleryItem {
    id: string;
    name: string;
    location: string;
    date: string;
    coverImageUrl: string;
    photos: StagePhoto[];
}

// Fallback high-impact galleries if no stages/photos exist yet in database
const FALLBACK_STAGE_GALLERIES: StageGalleryItem[] = [
    {
        id: 'fallback-guaraci',
        name: '1ª ETAPA GUARACI - SP',
        location: 'Represa de Marimbondo · Guaraci, SP',
        date: '15/03/2026',
        coverImageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1200&auto=format&fit=crop',
        photos: [
            {
                id: 'g1',
                imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1200&auto=format&fit=crop',
                description: 'Largada emocionante com mais de 70 embarcações cortando as águas de Guaraci.'
            },
            {
                id: 'g2',
                imageUrl: 'https://images.unsplash.com/photo-1516683037151-9a17603a8dc7?q=80&w=1200&auto=format&fit=crop',
                description: 'Belo exemplar de Tucunaré Azul fisgado na primeira hora de prova.'
            },
            {
                id: 'g3',
                imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
                description: 'Pôr do sol cinematográfico durante o encerramento da medição oficial.'
            },
            {
                id: 'g4',
                imageUrl: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?q=80&w=1200&auto=format&fit=crop',
                description: 'Pódio dos campeões com entrega dos troféus STA Fishing.'
            }
        ]
    },
    {
        id: 'fallback-mira-estrela',
        name: '2ª ETAPA MIRA ESTRELA - SP',
        location: 'Prainha de Mira Estrela · Rio Grande',
        date: '12/04/2026',
        coverImageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
        photos: [
            {
                id: 'm1',
                imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
                description: 'Vista panorâmica da prainha de Mira Estrela na concentração dos pescadores.'
            },
            {
                id: 'm2',
                imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1200&auto=format&fit=crop',
                description: 'Equipes alinhadas para a vistoria oficial e entrega das réguas STA.'
            },
            {
                id: 'm3',
                imageUrl: 'https://images.unsplash.com/photo-1516683037151-9a17603a8dc7?q=80&w=1200&auto=format&fit=crop',
                description: 'Medição em tempo real pelo aplicativo oficial STA FISHING.'
            }
        ]
    },
    {
        id: 'fallback-pereira-barreto',
        name: '3ª ETAPA PEREIRA BARRETO - SP',
        location: 'Canal de Pereira Barreto · Rio Tietê/Paraná',
        date: '17/05/2026',
        coverImageUrl: 'https://images.unsplash.com/photo-1516683037151-9a17603a8dc7?q=80&w=1200&auto=format&fit=crop',
        photos: [
            {
                id: 'p1',
                imageUrl: 'https://images.unsplash.com/photo-1516683037151-9a17603a8dc7?q=80&w=1200&auto=format&fit=crop',
                description: 'Troféu Maior Peixe da etapa: gigante de 64cm solto com vida!'
            },
            {
                id: 'p2',
                imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1200&auto=format&fit=crop',
                description: 'Adrenalina pura na navegação pelo canal rumo aos melhores pontos de pesca.'
            },
            {
                id: 'p3',
                imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
                description: 'Confraternização entre atletas e famílias no encerramento da prova.'
            }
        ]
    },
    {
        id: 'fallback-santa-clara',
        name: '4ª ETAPA SANTA CLARA D\'OESTE - SP',
        location: 'Grande Lago · Santa Clara d\'Oeste, SP',
        date: '21/06/2026',
        coverImageUrl: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?q=80&w=1200&auto=format&fit=crop',
        photos: [
            {
                id: 's1',
                imageUrl: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?q=80&w=1200&auto=format&fit=crop',
                description: 'Pódio completo com os troféus exclusivos banhados e estilizados.'
            },
            {
                id: 's2',
                imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1200&auto=format&fit=crop',
                description: 'Vistoria das lanchas e motores pela comissão de arbitragem.'
            },
            {
                id: 's3',
                imageUrl: 'https://images.unsplash.com/photo-1516683037151-9a17603a8dc7?q=80&w=1200&auto=format&fit=crop',
                description: 'Pesca e solte garantido: respeito absoluto à preservação dos nossos rios.'
            }
        ]
    },
    {
        id: 'fallback-epitacio',
        name: '5ª ETAPA PRESIDENTE EPITÁCIO - SP',
        location: 'Parque Figueiral · Rio Paraná',
        date: '19/07/2026',
        coverImageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
        photos: [
            {
                id: 'e1',
                imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
                description: 'O famoso pôr do sol mais bonito do Brasil recebendo os atletas no Rio Paraná.'
            },
            {
                id: 'e2',
                imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1200&auto=format&fit=crop',
                description: 'Encontro de gigantes: as melhores equipes de pesca esportiva do país.'
            }
        ]
    }
];

export function StageGallerySection() {
    const { companyName } = useParams();
    const [galleries, setGalleries] = useState<StageGalleryItem[]>([]);
    const [, setLoading] = useState(true);

    // Lightbox / Modal state
    const [selectedStage, setSelectedStage] = useState<StageGalleryItem | null>(null);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadStageGalleries();
    }, [companyName]);

    // Keyboard navigation in modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selectedStage) return;
            if (e.key === 'Escape') {
                setSelectedStage(null);
            } else if (e.key === 'ArrowLeft') {
                handlePrevPhoto();
            } else if (e.key === 'ArrowRight') {
                handleNextPhoto();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedStage, currentPhotoIndex]);

    const loadStageGalleries = async () => {
        try {
            setLoading(true);

            let cId: string | null = null;
            if (companyName) {
                const { data: comp } = await supabase
                    .from('users')
                    .select('id')
                    .ilike('slug', companyName.trim())
                    .maybeSingle();
                if (comp) cId = comp.id;
            } else {
                const { data: masterComp } = await supabase
                    .from('users')
                    .select('id')
                    .eq('email', 'sta@stafishing.com.br')
                    .maybeSingle();
                if (masterComp) cId = masterComp.id;
            }

            // Fetch stages
            let stagesQuery = supabase
                .from('stages')
                .select('id, name, location, date, image_url, company_id')
                .order('date', { ascending: false });

            if (cId) {
                stagesQuery = stagesQuery.eq('company_id', cId);
            }

            const { data: stagesData, error: stagesError } = await stagesQuery;

            if (stagesError || !stagesData || stagesData.length === 0) {
                // If no stages in DB, use high-quality fallbacks
                setGalleries(FALLBACK_STAGE_GALLERIES);
                return;
            }

            // Fetch photos from stage_images
            const stageIds = stagesData.map(s => s.id);
            const { data: imagesData } = await supabase
                .from('stage_images')
                .select('id, stage_id, image_url, description, display_order')
                .in('stage_id', stageIds)
                .order('display_order', { ascending: true });

            const formattedGalleries: StageGalleryItem[] = stagesData.map(stage => {
                const stagePhotos: StagePhoto[] = (imagesData || [])
                    .filter(img => img.stage_id === stage.id)
                    .map(img => ({
                        id: img.id,
                        imageUrl: img.image_url,
                        description: img.description || undefined
                    }));

                // If cover is defined on stage, prioritize it
                const cover = stage.image_url || (stagePhotos.length > 0 ? stagePhotos[0].imageUrl : '');

                // Ensure at least cover is in the photos list if photos is empty but cover exists
                let finalPhotos = stagePhotos;
                if (finalPhotos.length === 0 && cover) {
                    finalPhotos = [{
                        id: `cover-${stage.id}`,
                        imageUrl: cover,
                        description: stage.name
                    }];
                }

                // If no photos at all, supply fallback action images
                if (finalPhotos.length === 0) {
                    finalPhotos = [
                        {
                            id: `fb-1-${stage.id}`,
                            imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1200&auto=format&fit=crop',
                            description: `${stage.name} - Largada Oficial`
                        },
                        {
                            id: `fb-2-${stage.id}`,
                            imageUrl: 'https://images.unsplash.com/photo-1516683037151-9a17603a8dc7?q=80&w=1200&auto=format&fit=crop',
                            description: `${stage.name} - Capturas e Medição`
                        }
                    ];
                }

                const dateFormatted = stage.date 
                    ? new Date(stage.date).toLocaleDateString('pt-BR') 
                    : '2026';

                return {
                    id: stage.id,
                    name: stage.name,
                    location: stage.location || 'Local a definir',
                    date: dateFormatted,
                    coverImageUrl: cover || finalPhotos[0].imageUrl,
                    photos: finalPhotos
                };
            });

            // If we have fewer than 3 stages, append fallbacks so the marquee looks rich and continuous
            if (formattedGalleries.length < 3) {
                const combined = [...formattedGalleries, ...FALLBACK_STAGE_GALLERIES.slice(0, 4 - formattedGalleries.length)];
                setGalleries(combined);
            } else {
                setGalleries(formattedGalleries);
            }

        } catch (err) {
            console.error('Erro ao carregar galerias das etapas:', err);
            setGalleries(FALLBACK_STAGE_GALLERIES);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenGallery = (stage: StageGalleryItem) => {
        setSelectedStage(stage);
        setCurrentPhotoIndex(0);
    };

    const handlePrevPhoto = () => {
        if (!selectedStage) return;
        setCurrentPhotoIndex(prev => (prev === 0 ? selectedStage.photos.length - 1 : prev - 1));
    };

    const handleNextPhoto = () => {
        if (!selectedStage) return;
        setCurrentPhotoIndex(prev => (prev === selectedStage.photos.length - 1 ? 0 : prev + 1));
    };

    // Manual scroll buttons
    const handleScroll = (direction: 'left' | 'right') => {
        if (!scrollContainerRef.current) return;
        const scrollAmount = 400;
        scrollContainerRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    };

    // Duplicate list for infinite right-to-left seamless marquee
    const marqueeItems = [...galleries, ...galleries, ...galleries];

    return (
        <section className="relative py-20 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-b border-amber-500/20 overflow-hidden select-none">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black tracking-widest uppercase mb-3">
                            <Camera className="w-3.5 h-3.5" />
                            STA FISHING EM AÇÃO
                        </div>
                        <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight italic">
                            GALERIA DE FOTOS <br />
                            <span className="bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                                DAS ETAPAS
                            </span>
                        </h2>
                        <p className="text-sm text-gray-400 mt-2 max-w-xl font-medium">
                            Reviva as emoções, a adrenalina da largada, os gigantes capturados e a festa dos campeões. 
                            <span className="text-amber-400 font-semibold"> Clique em qualquer etapa para abrir a galeria completa.</span>
                        </p>
                    </div>

                    {/* Navigation Controls & Hint */}
                    <div className="flex items-center gap-3">
                        <span className="text-[11px] text-gray-400 uppercase tracking-wider font-bold hidden sm:inline-block bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
                            ⏸ Passe o mouse para pausar
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleScroll('left')}
                                aria-label="Rolar para a esquerda"
                                className="w-10 h-10 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 hover:bg-amber-500/10 text-white hover:text-amber-400 transition-all flex items-center justify-center shadow-lg active:scale-95"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => handleScroll('right')}
                                aria-label="Rolar para a direita"
                                className="w-10 h-10 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 hover:bg-amber-500/10 text-white hover:text-amber-400 transition-all flex items-center justify-center shadow-lg active:scale-95"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MARQUEE CAROUSEL CONTAINER (Caminhando da Direita para a Esquerda) */}
            <div 
                ref={scrollContainerRef}
                className="relative w-full overflow-x-hidden group py-4"
            >
                {/* Lateral Fade Gradients */}
                <div className="absolute top-0 bottom-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
                <div className="absolute top-0 bottom-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />

                {/* Animated Track - moves right to left via CSS marquee */}
                <div className="flex gap-6 w-max animate-stage-gallery hover:[animation-play-state:paused] px-4">
                    {marqueeItems.map((stage, idx) => (
                        <div
                            key={`${stage.id}-${idx}`}
                            onClick={() => handleOpenGallery(stage)}
                            className="relative flex-shrink-0 w-72 sm:w-80 md:w-96 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-amber-500/60 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(245,158,11,0.2)] cursor-pointer group/card"
                        >
                            {/* Card Image Cover */}
                            <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
                                <img
                                    src={stage.coverImageUrl}
                                    alt={stage.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110"
                                    loading="lazy"
                                />

                                {/* Ambient Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                                {/* Top Badges */}
                                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                                    <span className="px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 font-black text-[11px] tracking-wider uppercase shadow-md flex items-center gap-1">
                                        <Sparkles className="w-3 h-3 fill-slate-950" />
                                        CAPA DA ETAPA
                                    </span>
                                    <span className="px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur-md text-gray-200 border border-white/10 font-bold text-[11px] flex items-center gap-1">
                                        <ImageIcon className="w-3 h-3 text-amber-400" />
                                        {stage.photos.length} Fotos
                                    </span>
                                </div>

                                {/* Hover Action Overlay Pill */}
                                <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px] opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                    <div className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-2xl flex items-center gap-2 transform translate-y-2 group-hover/card:translate-y-0 transition-transform">
                                        <Eye className="w-4 h-4" />
                                        Abrir Galeria Completa
                                    </div>
                                </div>
                            </div>

                            {/* Card Details */}
                            <div className="p-5 space-y-2.5 bg-gradient-to-b from-slate-900 to-slate-950">
                                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight group-hover/card:text-amber-400 transition-colors line-clamp-1">
                                    {stage.name}
                                </h3>

                                <div className="space-y-1.5 text-xs text-gray-400">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                                        <span className="truncate">{stage.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                                        <span>{stage.date}</span>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                                    <span className="text-gray-400 font-semibold group-hover/card:text-gray-200 transition-colors">
                                        Clique para ver fotos
                                    </span>
                                    <span className="text-amber-400 font-black group-hover/card:translate-x-1 transition-transform inline-flex items-center gap-1">
                                        Explorar →
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* LIGHTBOX / FULLSCREEN GALLERY MODAL */}
            {selectedStage && (
                <div 
                    className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 animate-fadeIn"
                    role="dialog"
                    aria-modal="true"
                >
                    {/* Modal Header */}
                    <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10 max-w-7xl w-full mx-auto">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                                    Galeria da Etapa
                                </span>
                                <span className="text-xs text-gray-400 font-bold">
                                    Foto {currentPhotoIndex + 1} de {selectedStage.photos.length}
                                </span>
                            </div>
                            <h2 className="text-lg sm:text-2xl font-black text-white uppercase tracking-tight">
                                {selectedStage.name}
                            </h2>
                            <p className="text-xs text-gray-400 hidden sm:block">
                                {selectedStage.location} · {selectedStage.date}
                            </p>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedStage(null)}
                            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:rotate-90"
                            aria-label="Fechar galeria"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Modal Main Image & Nav Controls */}
                    <div className="relative flex-1 flex items-center justify-center max-w-7xl w-full mx-auto my-4 overflow-hidden">
                        {/* Prev Button */}
                        <button
                            onClick={handlePrevPhoto}
                            aria-label="Foto anterior"
                            className="absolute left-2 sm:left-4 z-20 p-3 sm:p-4 rounded-full bg-black/60 hover:bg-amber-500 hover:text-slate-950 text-white border border-white/10 transition-all backdrop-blur-md active:scale-95"
                        >
                            <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
                        </button>

                        {/* Active Image */}
                        <div className="relative max-h-[65vh] sm:max-h-[70vh] flex flex-col items-center justify-center">
                            <img
                                src={selectedStage.photos[currentPhotoIndex]?.imageUrl}
                                alt={selectedStage.photos[currentPhotoIndex]?.description || selectedStage.name}
                                className="max-h-[60vh] sm:max-h-[65vh] w-auto max-w-full object-contain rounded-xl shadow-2xl transition-all duration-300"
                            />
                            {/* Photo Description */}
                            {selectedStage.photos[currentPhotoIndex]?.description && (
                                <p className="mt-3 text-xs sm:text-sm text-gray-300 bg-slate-900/90 border border-white/10 px-4 py-2 rounded-lg max-w-2xl text-center">
                                    {selectedStage.photos[currentPhotoIndex].description}
                                </p>
                            )}
                        </div>

                        {/* Next Button */}
                        <button
                            onClick={handleNextPhoto}
                            aria-label="Próxima foto"
                            className="absolute right-2 sm:right-4 z-20 p-3 sm:p-4 rounded-full bg-black/60 hover:bg-amber-500 hover:text-slate-950 text-white border border-white/10 transition-all backdrop-blur-md active:scale-95"
                        >
                            <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
                        </button>
                    </div>

                    {/* Modal Bottom Thumbnail Strip */}
                    <div className="max-w-7xl w-full mx-auto pt-3 border-t border-white/10">
                        <div className="flex items-center justify-center gap-2 sm:gap-3 overflow-x-auto py-2 px-2 scrollbar-none">
                            {selectedStage.photos.map((photo, pIdx) => (
                                <button
                                    key={photo.id || pIdx}
                                    onClick={() => setCurrentPhotoIndex(pIdx)}
                                    className={`relative flex-shrink-0 w-16 h-12 sm:w-24 sm:h-16 rounded-lg overflow-hidden transition-all ${
                                        currentPhotoIndex === pIdx
                                            ? 'ring-2 ring-amber-400 scale-105 opacity-100 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                                            : 'opacity-50 hover:opacity-80'
                                    }`}
                                >
                                    <img
                                        src={photo.imageUrl}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                    {photo.imageUrl === selectedStage.coverImageUrl && (
                                        <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-amber-400" title="Capa" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Custom CSS for seamless right-to-left marquee animation */}
            <style>{`
                @keyframes stageGalleryMarquee {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(-33.333333%);
                    }
                }
                .animate-stage-gallery {
                    display: flex;
                    width: max-content;
                    animation: stageGalleryMarquee 45s linear infinite;
                }
                .animate-stage-gallery:hover {
                    animation-play-state: paused;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out;
                }
            `}</style>
        </section>
    );
}

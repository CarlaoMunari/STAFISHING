import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Award, ExternalLink, Sparkles, CheckCircle2, MessageCircle, Star, ShieldCheck } from 'lucide-react';
import { useParams } from 'react-router-dom';

export interface SponsorItem {
    id: string;
    name: string;
    imageUrl: string;
    linkUrl?: string;
    tier: 'master' | 'ouro' | 'apoio';
    description?: string;
    displayOrder: number;
}

// Fallback high-impact sponsors if database is empty
const FALLBACK_SPONSORS: SponsorItem[] = [
    {
        id: 'fb-mercury',
        name: 'MERCURY MARINE',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Mercury_Marine_Logo.svg/1200px-Mercury_Marine_Logo.svg.png',
        linkUrl: 'https://www.mercurymarine.com/pt/br/',
        tier: 'master',
        description: 'Motores Náuticos e Propulsão de Alta Performance Oficial do Circuito.',
        displayOrder: 1
    },
    {
        id: 'fb-emg',
        name: 'EMG BARCOS',
        imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=400&auto=format&fit=crop',
        linkUrl: 'https://www.instagram.com/emgbarcos/',
        tier: 'master',
        description: 'Embarcações e Lanchas de Competição Projetadas para Alta Navegabilidade.',
        displayOrder: 2
    },
    {
        id: 'fb-marine',
        name: 'MARINE SPORTS',
        imageUrl: 'https://images.unsplash.com/photo-1516683037151-9a17603a8dc7?q=80&w=400&auto=format&fit=crop',
        linkUrl: 'https://www.marinesports.com.br/',
        tier: 'master',
        description: 'Varas, Carretilhas e Iscas Consagradas pelos Maiores Campeões da Pesca.',
        displayOrder: 3
    },
    {
        id: 'fb-pescao',
        name: 'PESCÃO NÁUTICA',
        imageUrl: '',
        linkUrl: 'https://pescaonautica.com.br/',
        tier: 'ouro',
        description: 'Concessionária Náutica e Assistência Autorizada Especializada.',
        displayOrder: 4
    },
    {
        id: 'fb-s90',
        name: 'S90 PESCA',
        imageUrl: '',
        linkUrl: 'https://www.s90pesca.com.br/',
        tier: 'ouro',
        description: 'Vestuário Esportivo Técnico com Proteção Solar UV50+.',
        displayOrder: 5
    },
    {
        id: 'fb-casa',
        name: 'CASA DO PESCADOR',
        imageUrl: '',
        linkUrl: 'https://casadopescador.com.br/',
        tier: 'apoio',
        description: 'Artigos Completos de Pesca, Camping e Aventura ao Ar Livre.',
        displayOrder: 6
    },
    {
        id: 'fb-alfa',
        name: 'ALFA NÁUTICA',
        imageUrl: '',
        linkUrl: 'https://alfanautica.com.br/',
        tier: 'apoio',
        description: 'Acessórios Náuticos de Precisão e Tecnologia Embarcada.',
        displayOrder: 7
    }
];

export function SponsorsSection() {
    const { companyName } = useParams();
    const [sponsors, setSponsors] = useState<SponsorItem[]>([]);

    useEffect(() => {
        loadSponsors();
    }, [companyName]);

    const loadSponsors = async () => {
        try {
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

            let query = supabase
                .from('sponsor_logos')
                .select('*')
                .eq('active', true)
                .order('display_order', { ascending: true });

            if (cId) {
                query = query.eq('company_id', cId);
            }

            const { data, error } = await query;

            if (error || !data || data.length === 0) {
                setSponsors(FALLBACK_SPONSORS);
                return;
            }

            const formatted: SponsorItem[] = data.map((item, idx) => {
                // Determine tier based on display_order or metadata
                let tier: 'master' | 'ouro' | 'apoio' = 'apoio';
                if (item.display_order <= 3 || idx < 3) {
                    tier = 'master';
                } else if (item.display_order <= 6 || idx < 6) {
                    tier = 'ouro';
                }

                return {
                    id: item.id,
                    name: item.name,
                    imageUrl: item.image_url,
                    linkUrl: item.link_url || undefined,
                    tier,
                    displayOrder: item.display_order || idx
                };
            });

            setSponsors(formatted);
        } catch (err) {
            console.error('Erro ao carregar patrocinadores:', err);
            setSponsors(FALLBACK_SPONSORS);
        }
    };

    const masterSponsors = sponsors.filter(s => s.tier === 'master');
        // Ensure all sponsors can be displayed in continuous marquee
    const marqueeList = [...sponsors, ...sponsors, ...sponsors];

    return (
        <section id="patrocinadores" className="py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-t border-amber-500/20 relative overflow-hidden select-none">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
                
                {/* SECTION HEADER */}
                <div className="text-center max-w-3xl mx-auto space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black tracking-widest uppercase shadow-lg">
                        <Sparkles className="w-3.5 h-3.5 fill-amber-400" />
                        PARCERIAS QUE FORTALECEM O ESPORTE
                    </div>
                    
                    <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight italic">
                        NOSSOS PATROCINADORES <br />
                        <span className="bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                            & MARCAS OFICIAIS
                        </span>
                    </h2>

                    <p className="text-sm sm:text-base text-gray-400 leading-relaxed font-medium">
                        As maiores marcas do segmento náutico, pesca esportiva e vestuário técnico que acreditam e impulsionam o sucesso do Circuito STA FISHING.
                    </p>
                </div>

                {/* ======================================================== */}
                {/* COTA MASTER / DIAMANTE - SUPER DESTAQUE VIP */}
                {/* ======================================================== */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
                        <div className="flex items-center gap-2">
                            <span className="p-1 rounded bg-amber-500 text-slate-950 font-black text-xs">
                                <Award className="w-4 h-4 fill-slate-950" />
                            </span>
                            <h3 className="text-sm sm:text-base font-black text-amber-300 uppercase tracking-wider">
                                PATROCINADORES MASTER • COTA DIAMANTE
                            </h3>
                        </div>
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest hidden sm:inline-block">
                            DESTAQUE MÁXIMO DO CIRCUITO
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {(masterSponsors.length > 0 ? masterSponsors : FALLBACK_SPONSORS.slice(0, 3)).map((sponsor, index) => (
                            <div
                                key={sponsor.id || index}
                                className="group relative rounded-2xl p-[1px] bg-gradient-to-b from-amber-500/50 via-amber-500/20 to-slate-800 hover:from-amber-400 hover:to-amber-500 transition-all duration-500 hover:shadow-[0_0_35px_rgba(245,158,11,0.25)] hover:-translate-y-1.5"
                            >
                                <div className="h-full rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-6 flex flex-col justify-between space-y-6">
                                    {/* Top Badge & Tier */}
                                    <div className="flex items-center justify-between">
                                        <span className="px-2.5 py-1 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-[10px] tracking-wider uppercase flex items-center gap-1.5">
                                            <Star className="w-3 h-3 fill-amber-400" />
                                            PATROCINADOR MASTER
                                        </span>
                                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                    </div>

                                    {/* Logo Display Area */}
                                    <div className="relative h-28 w-full bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-center p-4 group-hover:border-amber-500/40 transition-colors overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                                        
                                        {sponsor.imageUrl ? (
                                            <img
                                                src={sponsor.imageUrl}
                                                alt={sponsor.name}
                                                className="max-h-16 max-w-[85%] object-contain filter group-hover:brightness-110 group-hover:scale-105 transition-all duration-300"
                                            />
                                        ) : (
                                            <div className="text-xl sm:text-2xl font-black text-amber-400 tracking-wider text-center">
                                                {sponsor.name}
                                            </div>
                                        )}
                                    </div>

                                    {/* Sponsor Details */}
                                    <div className="space-y-2 text-center">
                                        <h4 className="text-lg font-black text-white uppercase tracking-tight group-hover:text-amber-400 transition-colors">
                                            {sponsor.name}
                                        </h4>
                                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                                            {sponsor.description || 'Marca Oficial Homologada no Circuito STA FISHING.'}
                                        </p>
                                    </div>

                                    {/* Action Link Button */}
                                    {sponsor.linkUrl ? (
                                        <a
                                            href={sponsor.linkUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95"
                                        >
                                            <span>Visitar Marca Oficial</span>
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    ) : (
                                        <div className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 text-gray-400 font-bold text-xs uppercase tracking-wider text-center flex items-center justify-center gap-1.5">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                                            Marca Oficial Homologada
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ======================================================== */}
                {/* MARQUEE CONTINUO DE LOGOMARCAS (DIREITA PARA ESQUERDA) */}
                {/* ======================================================== */}
                <div className="space-y-4 pt-6">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <h3 className="text-xs sm:text-sm font-black text-gray-300 uppercase tracking-wider flex items-center gap-2">
                            <span>TODAS AS MARCAS & PARCEIROS OFICIAIS</span>
                        </h3>
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                            EM TODAS AS ETAPAS
                        </span>
                    </div>

                    <div className="relative w-full overflow-hidden py-4 group">
                        {/* Lateral Fading Overlays */}
                        <div className="absolute top-0 bottom-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
                        <div className="absolute top-0 bottom-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />

                        {/* Continuous Marquee Track */}
                        <div className="flex gap-6 w-max animate-sponsors-marquee hover:[animation-play-state:paused] px-4">
                            {marqueeList.map((sponsor, idx) => (
                                <a
                                    key={`${sponsor.id}-${idx}`}
                                    href={sponsor.linkUrl || '#'}
                                    target={sponsor.linkUrl ? '_blank' : '_self'}
                                    rel="noreferrer"
                                    className="flex-shrink-0 w-52 sm:w-60 h-24 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/60 p-4 flex items-center justify-center transition-all duration-300 hover:scale-105 hover:bg-slate-900 hover:shadow-[0_5px_20px_rgba(245,158,11,0.15)] group/card"
                                >
                                    {sponsor.imageUrl ? (
                                        <img
                                            src={sponsor.imageUrl}
                                            alt={sponsor.name}
                                            className="max-h-12 max-w-[80%] object-contain filter grayscale group-hover/card:grayscale-0 group-hover/card:brightness-110 transition-all duration-300"
                                        />
                                    ) : (
                                        <div className="text-center">
                                            <span className="text-sm font-black text-gray-300 group-hover/card:text-amber-400 uppercase tracking-wider block transition-colors">
                                                {sponsor.name}
                                            </span>
                                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">
                                                STA FISHING
                                            </span>
                                        </div>
                                    )}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ======================================================== */}
                {/* CALL TO ACTION: SEJA UM PATROCINADOR DO CIRCUITO */}
                {/* ======================================================== */}
                <div className="relative rounded-3xl overflow-hidden border border-amber-500/40 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-8 sm:p-12 shadow-2xl">
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-left">
                        <div className="space-y-3 max-w-2xl">
                            <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-widest rounded-md inline-block">
                                OPORTUNIDADE COMERCIAL
                            </span>
                            <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                                QUER SUA MARCA EM DESTAQUE NO CIRCUITO STA FISHING?
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-medium">
                                Conecte sua empresa a milhares de pescadores esportivos, navegadores e famílias em eventos oficiais, coberturas na mídia, transmissões e aplicativo exclusivo.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                            <a
                                href="https://wa.me/5517991774603?text=Ol%C3%A1!%20Gostaria%20de%20receber%20informa%C3%A7%C3%B5es%20sobre%20as%20cotas%20de%20patroc%C3%ADnio%20do%20Circuito%20STA%20Fishing."
                                target="_blank"
                                rel="noreferrer"
                                className="px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-xl shadow-emerald-600/30 active:scale-95 whitespace-nowrap"
                            >
                                <MessageCircle className="w-4 h-4" />
                                Falar no WhatsApp com a Organização
                            </a>
                        </div>
                    </div>
                </div>

            </div>

            {/* Custom CSS for continuous sponsors marquee */}
            <style>{`
                @keyframes sponsorsMarquee {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(-33.333333%);
                    }
                }
                .animate-sponsors-marquee {
                    display: flex;
                    width: max-content;
                    animation: sponsorsMarquee 38s linear infinite;
                }
                .animate-sponsors-marquee:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </section>
    );
}

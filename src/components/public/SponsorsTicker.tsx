import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useParams } from 'react-router-dom';

interface TickerSponsor {
    id: string;
    name: string;
    imageUrl?: string;
    linkUrl?: string;
}

const DEFAULT_TICKER_SPONSORS: TickerSponsor[] = [
    {
        id: 't-mercury',
        name: 'MERCURY MARINE',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Mercury_Marine_Logo.svg/1200px-Mercury_Marine_Logo.svg.png',
        linkUrl: 'https://www.mercurymarine.com/pt/br/'
    },
    {
        id: 't-emg',
        name: 'EMG BARCOS',
        imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=200&auto=format&fit=crop',
        linkUrl: 'https://www.instagram.com/emgbarcos/'
    },
    {
        id: 't-marine',
        name: 'MARINE SPORTS',
        imageUrl: 'https://images.unsplash.com/photo-1516683037151-9a17603a8dc7?q=80&w=200&auto=format&fit=crop',
        linkUrl: 'https://www.marinesports.com.br/'
    },
    {
        id: 't-pescao',
        name: 'PESCÃO NÁUTICA',
        imageUrl: '',
        linkUrl: 'https://pescaonautica.com.br/'
    },
    {
        id: 't-s90',
        name: 'S90 PESCA',
        imageUrl: '',
        linkUrl: 'https://www.s90pesca.com.br/'
    },
    {
        id: 't-casa',
        name: 'CASA DO PESCADOR',
        imageUrl: '',
        linkUrl: 'https://casadopescador.com.br/'
    },
    {
        id: 't-alfa',
        name: 'ALFA NÁUTICA',
        imageUrl: '',
        linkUrl: 'https://alfanautica.com.br/'
    }
];

export function SponsorsTicker() {
    const { companyName } = useParams();
    const [sponsors, setSponsors] = useState<TickerSponsor[]>(DEFAULT_TICKER_SPONSORS);

    useEffect(() => {
        loadTickerSponsors();
    }, [companyName]);

    const loadTickerSponsors = async () => {
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
                .select('id, name, image_url, link_url')
                .eq('active', true)
                .order('display_order', { ascending: true });

            if (cId) {
                query = query.eq('company_id', cId);
            }

            const { data, error } = await query;

            if (!error && data && data.length > 0) {
                const mapped: TickerSponsor[] = data.map(item => ({
                    id: item.id,
                    name: item.name,
                    imageUrl: item.image_url || undefined,
                    linkUrl: item.link_url || undefined
                }));

                // If only 1-2 sponsors in DB, combine with defaults to have a rich continuous flow
                if (mapped.length < 4) {
                    setSponsors([...mapped, ...DEFAULT_TICKER_SPONSORS]);
                } else {
                    setSponsors(mapped);
                }
            }
        } catch (err) {
            console.error('Erro ao carregar logos para o ticker:', err);
        }
    };

    // Duplicate list 3 times for seamless infinite right-to-left marquee loop
    const marqueeItems = [...sponsors, ...sponsors, ...sponsors];

    return (
        <div className="mt-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 select-none">
            <div className="relative rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/30 p-2 sm:p-2.5 flex items-center shadow-2xl overflow-hidden group">
                
                {/* Left Fixed Badge: PATROCINADORES OFICIAIS */}
                <div className="relative z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-[10px] sm:text-[11px] uppercase tracking-wider shrink-0 shadow-md">
                    <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                    <span className="hidden sm:inline">PATROCINADORES OFICIAIS</span>
                    <span className="sm:hidden">PARCEIROS</span>
                </div>

                {/* Marquee Track Wrapper with Lateral Fade Masks */}
                <div className="relative flex-1 overflow-hidden mx-2 sm:mx-4">
                    {/* Left and Right Fade Gradients */}
                    <div className="absolute top-0 bottom-0 left-0 w-8 sm:w-16 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent z-10 pointer-events-none" />
                    <div className="absolute top-0 bottom-0 right-0 w-8 sm:w-16 bg-gradient-to-l from-slate-950 via-slate-950/80 to-transparent z-10 pointer-events-none" />

                    {/* Infinite Marquee Track: Moving from Right to Left */}
                    <div className="flex items-center gap-6 sm:gap-8 w-max animate-ticker-marquee group-hover:[animation-play-state:paused] py-1">
                        {marqueeItems.map((sponsor, idx) => (
                            <a
                                key={`${sponsor.id}-${idx}`}
                                href={sponsor.linkUrl || '#patrocinadores'}
                                target={sponsor.linkUrl ? '_blank' : '_self'}
                                rel="noreferrer"
                                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/50 transition-all duration-200 hover:scale-105 shrink-0 group/item"
                                title={`Conhecer ${sponsor.name}`}
                            >
                                {/* Sponsor Logo Image */}
                                {sponsor.imageUrl ? (
                                    <div className="h-6 sm:h-7 w-auto max-w-[90px] flex items-center justify-center">
                                        <img
                                            src={sponsor.imageUrl}
                                            alt={sponsor.name}
                                            className="max-h-6 sm:max-h-7 max-w-full object-contain filter group-hover/item:brightness-110"
                                            loading="lazy"
                                        />
                                    </div>
                                ) : (
                                    <span className="w-2 h-2 rounded-full bg-amber-400 group-hover/item:scale-125 transition-transform" />
                                )}

                                {/* Sponsor Name */}
                                <span className="text-[11px] sm:text-xs font-black text-gray-300 group-hover/item:text-amber-400 uppercase tracking-wider whitespace-nowrap transition-colors">
                                    {sponsor.name}
                                </span>
                            </a>
                        ))}
                    </div>
                </div>

                {/* Right Fixed Link: VER TODOS → */}
                <a
                    href="#patrocinadores"
                    className="relative z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/40 text-amber-300 font-black text-[10px] sm:text-[11px] uppercase tracking-wider shrink-0 transition-all shadow-md whitespace-nowrap"
                >
                    <span className="hidden md:inline">Ver Todos</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </a>

            </div>

            {/* CSS Animation: Moving from Right to Left */}
            <style>{`
                @keyframes tickerMarqueeWalk {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(-33.333333%);
                    }
                }
                .animate-ticker-marquee {
                    display: flex;
                    width: max-content;
                    animation: tickerMarqueeWalk 28s linear infinite;
                }
            `}</style>
        </div>
    );
}

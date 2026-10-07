import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Navbar } from '@/components/public/Navbar';
import { Footer } from '@/components/public/Footer';
import { NewsSection } from '@/components/public/NewsSection';
import { StageGallerySection } from '@/components/public/StageGallerySection';
import { SponsorsSection } from '@/components/public/SponsorsSection';
import { SponsorsTicker } from '@/components/public/SponsorsTicker';
import { supabase } from '@/lib/supabase';
import { Calendar, MapPin, Fish, ArrowRight, UserPlus, Trophy, Users, Heart, Leaf, Tv } from 'lucide-react';

interface StageEvent {
    id: string;
    name: string;
    location: string;
    date: string;
    circuitName: string;
    imageUrl?: string;
}

export function HomePage() {
    const { companyName } = useParams();
    const [upcomingStages, setUpcomingStages] = useState<StageEvent[]>([]);

    const basePath = companyName ? `/${companyName}` : '';

    useEffect(() => {
        loadData();
    }, [companyName]);

    const loadData = async () => {
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

            let stagesQuery = supabase
                .from('stages')
                .select('*, circuits(name)')
                .order('date', { ascending: true })
                .limit(5);

            if (cId) {
                stagesQuery = stagesQuery.eq('company_id', cId);
            }

            const { data: stagesData } = await stagesQuery;

            if (stagesData) {
                setUpcomingStages(stagesData.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    location: item.location,
                    date: item.date ? new Date(item.date + 'T12:00:00').toLocaleDateString('pt-BR') : '24 DE OUTUBRO',
                    circuitName: item.circuits?.name || 'CIRCUITO STA',
                    imageUrl: item.image_url
                })));
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
                    }
    };

    const nextStage = upcomingStages[0] || {
        id: '',
        name: '5ª ETAPA MIRA ESTRELA/SP',
        location: 'MIRA ESTRELA/SP',
        date: '24 DE OUTUBRO (SÁBADO)',
        circuitName: 'CIRCUITO STA FISHING'
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-amber-500 selection:text-slate-950 overflow-x-hidden w-full">
            <Navbar />

            {/* HERO SECTION */}
            <section className="relative min-h-[85vh] flex items-center justify-center bg-slate-950 border-b border-amber-500/20">
                {/* Background Image & Gradient Overlay */}
                <div 
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 transition-transform duration-1000"
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=2070&auto=format&fit=crop')" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/90" />
                <div className="absolute inset-0 bg-radial-vignette opacity-80" />

                {/* Top Right Floating Badge */}
                <div className="absolute top-8 right-8 hidden md:flex items-center gap-2 bg-gradient-to-r from-red-600/90 to-amber-600/90 px-4 py-2 rounded-full border border-amber-400/40 shadow-xl backdrop-blur-md">
                    <span className="text-xs font-black tracking-widest uppercase text-white animate-pulse">
                        🔥 MAIS QUE PESCA, É PAIXÃO!
                    </span>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center z-10 space-y-8">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs font-black tracking-widest uppercase shadow-lg shadow-amber-500/10">
                        <Fish className="w-4 h-4 text-amber-400" />
                        PESCA ESPORTIVA • AMIZADE • NATUREZA • GRANDES HISTÓRIAS
                    </div>

                    {/* Main Metallic Title */}
                    <div className="space-y-2">
                        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight uppercase italic drop-shadow-2xl">
                            <span className="text-white drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">STA FISHING </span>
                            <br className="hidden sm:inline" />
                            <span className="bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_5px_15px_rgba(234,179,8,0.4)]">
                                NA PRESERVAÇÃO
                            </span>
                        </h1>
                    </div>

                    {/* Subtitle Paragraph */}
                    <p className="max-w-3xl mx-auto text-base sm:text-lg text-gray-300 font-medium leading-relaxed drop-shadow">
                        Mais que um torneio, um propósito. Unimos pescadores em prol da pesca esportiva, da preservação dos nossos rios e da construção de grandes amizades.
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Link to="/login">
                            <button className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-sm uppercase tracking-wider shadow-2xl shadow-red-600/40 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3">
                                <UserPlus className="w-5 h-5 text-white" />
                                LOGIN
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </Link>
                        <Link to={`${basePath}/etapas`}>
                            <button className="w-full sm:w-auto px-8 py-4 rounded-xl border-2 border-amber-500/70 hover:bg-amber-500/10 text-amber-300 font-black text-sm uppercase tracking-wider backdrop-blur-sm transition-all flex items-center justify-center gap-3">
                                <Calendar className="w-5 h-5 text-amber-400" />
                                VER ETAPAS
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Bottom Right Floating Badge */}
                
            </section>

            {/* STATS BAR (KPI ROW) */}
            <section className="relative -mt-10 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-slate-900/90 backdrop-blur-2xl border border-amber-500/30 rounded-2xl p-6 shadow-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-center">
                    <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                            <Users className="w-7 h-7" />
                        </div>
                        <div>
                            <span className="text-2xl font-black text-white tracking-tight">6.196</span>
                            <span className="text-xs font-bold text-amber-400 uppercase block tracking-wider">CIRCUITO STA FISHING</span>
                            <span className="text-[10px] text-gray-400 block">Pescadores que fazem essa história</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                            <Fish className="w-7 h-7" />
                        </div>
                        <div>
                            <span className="text-2xl font-black text-white tracking-tight">1.426</span>
                            <span className="text-xs font-bold text-amber-400 uppercase block tracking-wider">PEIXES PRESERVADOS</span>
                            <span className="text-[10px] text-gray-400 block">Esporte • Lei • Natureza Sempre</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                            <Trophy className="w-7 h-7" />
                        </div>
                        <div>
                            <span className="text-2xl font-black text-white tracking-tight">962</span>
                            <span className="text-xs font-bold text-amber-400 uppercase block tracking-wider">EQUIPES CADASTRADAS</span>
                            <span className="text-[10px] text-gray-400 block">Juntos somos mais fortes</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-amber-500/30">
                        <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400">
                            <Leaf className="w-7 h-7" />
                        </div>
                        <div>
                            <span className="text-xs font-black text-emerald-400 uppercase block tracking-widest">PESCA HOJE</span>
                            <span className="text-xs font-black text-amber-300 uppercase block tracking-widest">NATUREZA SEMPRE</span>
                            <span className="text-[10px] text-gray-300 block font-semibold">Gerações Amanhã</span>
                        </div>
                    </div>
                </div>
            </section>

            <SponsorsTicker />

            {/* PRÓXIMA ETAPA & FEATURED CARDS GRID */}
            <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Main Featured Card 1 (Próxima Etapa) */}
                    <div className="lg:col-span-1 relative rounded-2xl overflow-hidden border-2 border-red-600/80 bg-gradient-to-b from-red-950/90 via-slate-900 to-slate-950 p-6 flex flex-col justify-between shadow-2xl shadow-red-950/40 group">
                        <div className="absolute top-0 left-0 right-0 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest text-center py-1.5 shadow">
                            🔥 PRÓXIMA ETAPA
                        </div>

                        <div className="pt-6 space-y-4">
                            <div className="space-y-1">
                                <span className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-1">
                                    <MapPin className="w-4 h-4 text-red-500" />
                                    {nextStage.location || 'MIRA ESTRELA/SP'}
                                </span>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight leading-tight">
                                    {nextStage.name || '5ª ETAPA MIRA ESTRELA/SP'}
                                </h3>
                            </div>

                            <div className="space-y-2 text-xs text-gray-300 border-t border-slate-800 pt-3">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-amber-400" />
                                    <span className="font-bold text-amber-300">{nextStage.date || '24 DE OUTUBRO (SÁBADO)'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-400">⏰ LARGADA: 07:30</span>
                                </div>
                                <div className="flex items-center gap-2 text-amber-400/90 font-semibold">
                                    <span>🎣 Clínica do Pescador & EMC Pesca</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 space-y-3">
                            <Link to="/login">
                                <button className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2">
                                    FAZER MINHA INSCRIÇÃO
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </Link>
                            <span className="text-[10px] font-black italic text-center text-amber-400/80 block uppercase">
                                "Grandes pescarias preservam grandes histórias"
                            </span>
                        </div>
                    </div>

                    {/* Featured Card 2 (Circuito STA) */}
                    <div className="rounded-2xl border border-amber-500/20 bg-slate-900/80 p-6 flex flex-col justify-between hover:border-amber-500/50 transition-all group shadow-xl">
                        <div className="space-y-3">
                            <div className="p-3 w-fit rounded-xl bg-amber-500/10 text-amber-400">
                                <Trophy className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-black text-white uppercase tracking-wider">CIRCUITO STA</h3>
                            <p className="text-xs text-gray-400 font-medium leading-relaxed">
                                ETAPAS INCRÍVEIS EM GRANDES CENÁRIOS DA PESCA ESPORTIVA NACIONAL.
                            </p>
                        </div>
                        <div className="pt-6">
                            <Link to={`${basePath}/etapas`}>
                                <button className="w-full py-2.5 border border-amber-500/60 hover:bg-amber-500/10 text-amber-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2">
                                    CONHEÇA O CIRCUITO
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </Link>
                        </div>
                    </div>

                    {/* Featured Card 3 (Torneio de Casais) */}
                    <div className="rounded-2xl border border-amber-500/20 bg-slate-900/80 p-6 flex flex-col justify-between hover:border-amber-500/50 transition-all group shadow-xl">
                        <div className="space-y-3">
                            <div className="p-3 w-fit rounded-xl bg-amber-500/10 text-amber-400">
                                <Heart className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-black text-white uppercase tracking-wider">TORNEIO DE CASAIS</h3>
                            <p className="text-xs text-gray-400 font-medium leading-relaxed">
                                PAIXÃO QUE TAMBÉM UNE. COMPETIÇÕES ESPECIAIS PARA CASAIS PESCADORES.
                            </p>
                        </div>
                        <div className="pt-6">
                            <Link to={`${basePath}/etapas`}>
                                <button className="w-full py-2.5 border border-amber-500/60 hover:bg-amber-500/10 text-amber-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2">
                                    SAIBA MAIS
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </Link>
                        </div>
                    </div>

                    {/* Featured Card 4 (Solo STA) */}
                    <div className="rounded-2xl border border-amber-500/20 bg-slate-900/80 p-6 flex flex-col justify-between hover:border-amber-500/50 transition-all group shadow-xl">
                        <div className="space-y-3">
                            <div className="p-3 w-fit rounded-xl bg-amber-500/10 text-amber-400">
                                <Users className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-black text-white uppercase tracking-wider">SOLO STA</h3>
                            <p className="text-xs text-gray-400 font-medium leading-relaxed">
                                DESAFIO, SUPERAÇÃO E EVOLUÇÃO INDIVIDUAL NA PESCA ESPORTIVA.
                            </p>
                        </div>
                        <div className="pt-6">
                            <Link to={`${basePath}/etapas`}>
                                <button className="w-full py-2.5 border border-amber-500/60 hover:bg-amber-500/10 text-amber-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2">
                                    SAIBA MAIS
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ÁREA DE NOTÍCIAS & NOVIDADES */} 
            <NewsSection />

            {/* PARTNERSHIPS SECTION (BFL & FISH TV) */}
            <section className="py-12 bg-slate-900/60 border-y border-amber-500/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* BFL Partner Card */}
                    <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-8 flex flex-col justify-between space-y-6 shadow-2xl">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-[10px] font-black uppercase tracking-widest rounded-md">
                                    BFL BRAZILIAN FISHING LEAGUE
                                </span>
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">
                                STA FISHING É UM DOS CIRCUITOS FUNDADORES DA BFL
                            </h3>
                            <div className="inline-block bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs uppercase px-3 py-1 rounded-md tracking-wider">
                                ETAPAS VÁLIDAS PARA A BFL EM 2027
                            </div>
                            <p className="text-xs text-gray-300 leading-relaxed font-medium">
                                Juntos por uma pesca esportiva ainda mais forte no Brasil. O STA Fishing faz parte da história que está conectando os maiores circuitos do país.
                            </p>
                        </div>
                        <button className="w-fit px-6 py-3 border-2 border-amber-500/60 hover:bg-amber-500/10 text-amber-300 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2">
                            SAIBA MAIS SOBRE A BFL
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* FishTV Partner Card */}
                    <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-8 flex flex-col justify-between space-y-6 shadow-2xl">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-black uppercase tracking-widest rounded-md flex items-center gap-1.5">
                                    <Tv className="w-3.5 h-3.5 text-blue-400" />
                                    FISH TV
                                </span>
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">
                                A PESCA AO ALCANCE DE TODOS
                            </h3>
                            <p className="text-xs text-gray-300 leading-relaxed font-medium">
                                Nossos torneios, histórias e a paixão da pesca esportiva também na maior mídia de pesca da América Latina.
                            </p>
                        </div>
                        <button className="w-fit px-6 py-3 border-2 border-amber-500/60 hover:bg-amber-500/10 text-amber-300 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2">
                            ASSISTA E ACOMPANHE
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </section>

            {/* GALERIA DE FOTOS DAS ETAPAS */}
            <StageGallerySection />

            <SponsorsSection />

            <Footer />
        </div>
    );
}



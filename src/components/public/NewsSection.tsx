import { useState } from 'react';
import { Newspaper, Calendar, ArrowRight, X, Sparkles, Share2, CheckCircle2 } from 'lucide-react';

export interface NewsArticle {
    id: string;
    title: string;
    category: 'COMUNICADO' | 'ETAPAS' | 'REGULAMENTO' | 'PREMIAÇÃO' | 'NOVIDADE';
    date: string;
    summary: string;
    content: string[];
    imageUrl: string;
    featured?: boolean;
    tagColor: string;
}

const INITIAL_NEWS: NewsArticle[] = [
    {
        id: '1',
        title: 'STA FISHING Anuncia Nova Plataforma Digital Exclusiva com Rastreamento em Tempo Real',
        category: 'NOVIDADE',
        date: '05 de Outubro de 2026',
        summary: 'O circuito dá um grande salto tecnológico ao unificar inscrições rápidas, pontuação digital homologada e acompanhamento oficial dos barcos em uma plataforma própria.',
        content: [
            'A diretoria da STA FISHING tem o orgulho de apresentar sua nova plataforma digital exclusiva, desenvolvida especialmente para atender nossos pescadores, capitães de equipe e parceiros com a máxima excelência.',
            'Com a nova interface, os participantes contam agora com um fluxo simplificado de inscrições, consulta em tempo real do regulamento homologado e painel de classificação automatizado.',
            'Além disso, a plataforma traz recursos pioneiros de acompanhamento das embarcações, reforçando o compromisso inegociável da STA FISHING com a segurança, transparência esportiva e a conservação das espécies em nossas represas.'
        ],
        imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
        featured: true,
        tagColor: 'bg-amber-500 text-slate-950 border-amber-400'
    },
    {
        id: '2',
        title: 'Inscrições Abertas para as Próximas Etapas do Circuito Oficial em Guaraci e Região',
        category: 'ETAPAS',
        date: '03 de Outubro de 2026',
        summary: 'As equipes já podem garantir suas vagas com numeração oficial garantida e confirmação de pagamento simplificada no portal.',
        content: [
            'Estão oficialmente abertas as inscrições para as próximas etapas do Circuito STA FISHING. As vagas são limitadas para assegurar a melhor estrutura náutica e logística para todas as equipes participantes.',
            'Os capitães podem inscrever suas equipes diretamente no sistema, com opções de pagamento direto e confirmação ágil.',
            'Não deixe para a última hora: garanta o número oficial da sua equipe e venha disputar os maiores troféus do ano nas águas do Rio Grande!'
        ],
        imageUrl: 'https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?auto=format&fit=crop&w=800&q=80',
        featured: false,
        tagColor: 'bg-emerald-500 text-slate-950 border-emerald-400'
    },
    {
        id: '3',
        title: 'Regulamento Técnico Atualizado: Sistema de Medição Homologado e Preservação do Tucunaré',
        category: 'REGULAMENTO',
        date: '28 de Setembro de 2026',
        summary: 'Confira as diretrizes de medição com régua oficial, critérios de desempate e normas rigorosas de pesque e solte para a temporada.',
        content: [
            'O comitê técnico da STA FISHING publicou a versão oficial do regulamento para o circuito. O documento já está disponível para leitura e download diretamente no portal.',
            'Entre os pontos de destaque estão a obrigatoriedade da régua de medição padronizada, registro de vídeos em alta nitidez com a soltura do peixe vivo e regras claras de navegação.',
            'Nosso lema permanece firme: "Pesca hoje, natureza sempre". A preservação dos grandes tucunarés é a prioridade número um de toda a nossa organização.'
        ],
        imageUrl: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=800&q=80',
        featured: false,
        tagColor: 'bg-blue-500 text-white border-blue-400'
    },
    {
        id: '4',
        title: 'Mega Premiação da Temporada: Troféus de Alto Padrão e Sorteios Exclusivos',
        category: 'PREMIAÇÃO',
        date: '22 de Setembro de 2026',
        summary: 'Além das premiações por etapa, o circuito reserva prêmios especiais para as melhores equipes no ranking geral e para o Maior Peixe do campeonato.',
        content: [
            'A temporada 2026 da STA FISHING premiará a dedicação de pescadores do Brasil inteiro com uma grade de prêmios histórica.',
            'Serão entregues troféus exclusivos do 1º ao 10º colocado de cada etapa, além de troféus especiais para a maior peça (Maior Tucunaré) capturada no evento.',
            'Todas as equipes devidamente inscritas e presentes também participam dos tradicionais sorteios de brindes e equipamentos esportivos fornecidos pelos nossos patrocinadores.'
        ],
        imageUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=800&q=80',
        featured: false,
        tagColor: 'bg-purple-500 text-white border-purple-400'
    }
];

export function NewsSection() {
    const [selectedNews, setSelectedNews] = useState<NewsArticle | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
    const [copied, setCopied] = useState(false);

    const categories = ['TODAS', 'NOVIDADE', 'ETAPAS', 'REGULAMENTO', 'PREMIAÇÃO'];

    const filteredNews = selectedCategory === 'TODAS'
        ? INITIAL_NEWS
        : INITIAL_NEWS.filter(n => n.category.toUpperCase() === selectedCategory);

    const featuredNews = INITIAL_NEWS.find(n => n.featured) || INITIAL_NEWS[0];
    const secondaryNews = filteredNews.filter(n => n.id !== featuredNews.id);

    const handleShare = (news: NewsArticle) => {
        if (navigator.share) {
            navigator.share({
                title: news.title,
                text: news.summary,
                url: window.location.href,
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(`${news.title} - Leia mais em: ${window.location.href}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    return (
        <section id="noticias" className="py-20 relative bg-slate-950 border-b border-amber-500/20 scroll-mt-20">
            {/* Glow decorativo de fundo */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-amber-500/5 blur-[120px] pointer-events-none rounded-full" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-10">

                {/* Header da Seção */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/40 text-amber-400 text-xs font-black tracking-widest uppercase shadow-sm">
                            <Newspaper className="w-4 h-4 text-amber-400" />
                            COMUNICADOS & NOVIDADES
                        </div>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white italic">
                            Últimas Notícias <span className="text-amber-400">STA FISHING</span>
                        </h2>
                        <p className="text-sm sm:text-base text-gray-400 max-w-2xl">
                            Fique por dentro de comunicados oficiais, abertura de inscrições, regras e todas as novidades do nosso circuito de pesca esportiva.
                        </p>
                    </div>

                    {/* Filtros de Categoria */}
                    <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
                                    selectedCategory === cat
                                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                                        : 'bg-slate-900 text-gray-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid de Notícias */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

                    {/* Notícia de Destaque Máximo (Grande) */}
                    <div className="lg:col-span-7 flex">
                        <div
                            onClick={() => setSelectedNews(featuredNews)}
                            className="group relative w-full rounded-2xl overflow-hidden bg-slate-900 border border-amber-500/30 hover:border-amber-400 transition-all duration-300 shadow-2xl flex flex-col justify-between cursor-pointer"
                        >
                            {/* Imagem de Fundo com Overlay */}
                            <div className="relative h-72 sm:h-96 w-full overflow-hidden">
                                <img
                                    src={featuredNews.imageUrl}
                                    alt={featuredNews.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-75"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                                {/* Tag de Destaque no Topo */}
                                <div className="absolute top-4 left-4 flex items-center gap-2">
                                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-600 text-white shadow-lg animate-pulse">
                                        <Sparkles className="w-3.5 h-3.5" />
                                        DESTAQUE OFICIAL
                                    </span>
                                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${featuredNews.tagColor}`}>
                                        {featuredNews.category}
                                    </span>
                                </div>

                                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-gray-300 font-semibold">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4 text-amber-400" />
                                        {featuredNews.date}
                                    </span>
                                    <span className="text-amber-400 group-hover:underline flex items-center gap-1">
                                        Clique para ler <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                </div>
                            </div>

                            {/* Conteúdo do Card Principal */}
                            <div className="p-6 sm:p-8 space-y-4 bg-slate-900/90 flex-1 flex flex-col justify-between">
                                <div className="space-y-3">
                                    <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white group-hover:text-amber-400 transition-colors uppercase leading-tight">
                                        {featuredNews.title}
                                    </h3>
                                    <p className="text-sm sm:text-base text-gray-300 line-clamp-3 leading-relaxed">
                                        {featuredNews.summary}
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        STA FISHING COMUNICAÇÃO
                                    </span>
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg shadow-md group-hover:from-amber-400 group-hover:to-yellow-400 transition-all"
                                    >
                                        Ler Notícia Completa
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Coluna de Notícias Secundárias */}
                    <div className="lg:col-span-5 flex flex-col justify-between gap-4">
                        {secondaryNews.slice(0, 3).map((item) => (
                            <div
                                key={item.id}
                                onClick={() => setSelectedNews(item)}
                                className="group p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-all duration-300 shadow-lg cursor-pointer flex gap-4 items-center"
                            >
                                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0 relative">
                                    <img
                                        src={item.imageUrl}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 brightness-90"
                                    />
                                </div>

                                <div className="flex-1 space-y-1.5 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${item.tagColor}`}>
                                            {item.category}
                                        </span>
                                        <span className="text-[11px] text-gray-400 flex items-center gap-1 font-medium">
                                            <Calendar className="w-3 h-3 text-amber-400" />
                                            {item.date}
                                        </span>
                                    </div>
                                    <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
                                        {item.title}
                                    </h4>
                                    <p className="text-xs text-gray-400 line-clamp-2">
                                        {item.summary}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {/* Banner de Chamada para WhatsApp / Canal Oficial */}
                        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-transparent border border-amber-500/30 flex items-center justify-between gap-4">
                            <div className="space-y-1">
                                <span className="text-xs font-black text-amber-400 uppercase tracking-widest block">
                                    DÚVIDAS OU COMUNICADOS?
                                </span>
                                <p className="text-xs text-gray-300">
                                    Fale diretamente com a organização da STA FISHING em Guaraci/SP.
                                </p>
                            </div>
                            <a
                                href="https://wa.me/5518997879600"
                                target="_blank"
                                rel="noreferrer"
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg shrink-0 transition-colors"
                            >
                                Contato
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL DE LEITURA DA NOTÍCIA */}
            {selectedNews && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
                    onClick={() => setSelectedNews(null)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl text-white space-y-6 animate-in zoom-in-95 duration-200"
                    >
                        {/* Imagem de Capa do Modal */}
                        <div className="relative h-64 sm:h-80 w-full overflow-hidden">
                            <img
                                src={selectedNews.imageUrl}
                                alt={selectedNews.title}
                                className="w-full h-full object-cover brightness-75"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/60" />

                            {/* Botão Fechar */}
                            <button
                                onClick={() => setSelectedNews(null)}
                                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Tags do Modal */}
                            <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between flex-wrap gap-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${selectedNews.tagColor}`}>
                                    {selectedNews.category}
                                </span>
                                <span className="text-xs text-gray-300 font-semibold flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                                    {selectedNews.date}
                                </span>
                            </div>
                        </div>

                        {/* Corpo da Notícia */}
                        <div className="px-6 sm:px-8 pb-8 space-y-6">
                            <h2 className="text-2xl sm:text-3xl font-black uppercase leading-tight text-white tracking-tight">
                                {selectedNews.title}
                            </h2>

                            <div className="p-4 rounded-xl bg-amber-500/10 border-l-4 border-amber-500 text-amber-200 text-sm font-medium italic">
                                "{selectedNews.summary}"
                            </div>

                            <div className="space-y-4 text-gray-300 text-sm sm:text-base leading-relaxed">
                                {selectedNews.content.map((paragraph, idx) => (
                                    <p key={idx}>{paragraph}</p>
                                ))}
                            </div>

                            {/* Rodapé do Modal */}
                            <div className="pt-6 border-t border-slate-800 flex items-center justify-between flex-wrap gap-4">
                                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                                    STA FISHING · GUARACI - SP
                                </span>

                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleShare(selectedNews)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
                                    >
                                        {copied ? (
                                            <>
                                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                Copiado!
                                            </>
                                        ) : (
                                            <>
                                                <Share2 className="w-4 h-4 text-amber-400" />
                                                Compartilhar
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedNews(null)}
                                        className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider transition-colors shadow-md"
                                    >
                                        Fechar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

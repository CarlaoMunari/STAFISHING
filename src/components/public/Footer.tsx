import { Facebook, Instagram, Youtube, Mail, MapPin, Phone } from 'lucide-react';

export function Footer() {

    return (
        <footer className="bg-slate-950 text-white border-t border-amber-500/20 relative overflow-hidden">
            {/* Top Contact Highlight Bar */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 border-b border-slate-900">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-center">
                    {/* Brand */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center font-black text-slate-950 text-lg shadow-lg shadow-amber-500/20">
                                STA
                            </div>
                            <div>
                                <h3 className="font-extrabold text-lg bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                                    STA FISHING
                                </h3>
                                <p className="text-[10px] text-amber-400/80 uppercase font-semibold">PESCA ESPORTIVA • NATUREZA SEMPRE</p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400">
                            Unindo pescadores em prol da pesca esportiva, preservação dos rios e grandes amizades.
                        </p>
                    </div>

                    {/* WhatsApp 1 */}
                    <a href="https://wa.me/5517991774603" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition-all group">
                        <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                            <Phone className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[10px] text-gray-400 uppercase font-bold block">Entre em contato</span>
                            <span className="text-sm font-extrabold text-white group-hover:text-emerald-400 transition-colors">(17) 99177-4603</span>
                        </div>
                    </a>

                    {/* WhatsApp 2 */}
                    <a href="https://wa.me/5517996183259" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition-all group">
                        <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                            <Phone className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[10px] text-gray-400 uppercase font-bold block">Entre em contato</span>
                            <span className="text-sm font-extrabold text-white group-hover:text-emerald-400 transition-colors">(17) 99618-3259</span>
                        </div>
                    </a>

                    {/* Email & Location */}
                    <div className="space-y-2 text-xs text-gray-300">
                        <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-amber-400" />
                            <span>stafishing.com.br</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-red-500" />
                            <span>Guaraçaí/SP - Nossa sede</span>
                        </div>
                        <div className="text-right pt-2 font-black italic text-amber-400 text-xs uppercase tracking-widest">
                            "AQUI A EMOÇÃO É REAL!"
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Copyright Bar */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
                <div>
                    © {new Date().getFullYear()} STA Fishing. Todos os direitos reservados.
                </div>

                <div className="flex items-center gap-4 text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                    <span>PESCA ESPORTIVA</span>
                    <span>•</span>
                    <span>PRESERVAÇÃO</span>
                    <span>•</span>
                    <span>AMIZADE</span>
                    <span>•</span>
                    <span>NATUREZA</span>
                </div>

                <div className="flex items-center gap-4">
                    <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-amber-400 transition-colors">
                        <Instagram className="w-5 h-5" />
                    </a>
                    <a href="https://youtube.com" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-red-500 transition-colors">
                        <Youtube className="w-5 h-5" />
                    </a>
                    <a href="https://facebook.com" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-500 transition-colors">
                        <Facebook className="w-5 h-5" />
                    </a>
                </div>
            </div>
        </footer>
    );
}

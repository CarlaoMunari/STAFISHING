import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fish, Trophy, Users, BarChart3, Calendar, Globe, Check, ArrowRight, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function LandingPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    const features = [
        {
            icon: Trophy,
            title: 'Gestão Completa de Circuitos',
            description: 'Organize múltiplos circuitos de pesca esportiva com controle total. Cadastre etapas, gerencie inscrições e acompanhe tudo em tempo real.'
        },
        {
            icon: Calendar,
            title: 'Etapas e Cronogramas',
            description: 'Planeje suas competições com calendário integrado. Defina datas, locais e regras específicas para cada etapa do seu circuito.'
        },
        {
            icon: Users,
            title: 'Registro Simplificado',
            description: 'Equipes se inscrevem online com dados completos. Sistema inteligente de validação e controle de pagamentos integrado.'
        },
        {
            icon: BarChart3,
            title: 'Rankings Automáticos',
            description: 'Classificações calculadas automaticamente com base nas suas regras. Rankings por etapa e geral atualizados em tempo real.'
        },
        {
            icon: Fish,
            title: 'Lançamento de Medidas',
            description: 'Interface otimizada para registro rápido das medidas. Suporte para diferentes espécies e formatos de competição.'
        },
        {
            icon: Globe,
            title: 'Site Personalizado',
            description: 'Homepage exclusiva para seu circuito com sua marca. Divulgue etapas, rankings e regulamentos em um só lugar.'
        }
    ];

    const benefits = [
        'Elimine planilhas e controle manual',
        'Reduza erros no cálculo de rankings',
        'Profissionalize a gestão do seu circuito',
        'Dê mais transparência aos participantes',
        'Economize tempo na organização',
        'Centralize todas as informações'
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Navbar */}
            <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600 p-2 rounded-lg">
                                <Fish className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <span className="text-xl font-bold text-gray-900">STA FISHING</span>
                                <p className="text-xs text-gray-600">Sistema Profissional de Gestão</p>
                            </div>
                        </div>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center gap-6">
                            <a href="#features" className="text-gray-700 hover:text-blue-600 transition font-medium">Recursos</a>
                            <a href="#benefits" className="text-gray-700 hover:text-blue-600 transition font-medium">Benefícios</a>
                            <Button onClick={() => navigate('/login')} variant="outline" className="border-gray-300">
                                Login
                            </Button>
                            <Button onClick={() => navigate('/login')} className="bg-blue-600 hover:bg-blue-700">
                                Acessar Sistema
                            </Button>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div className="md:hidden py-4 border-t border-gray-200">
                            <div className="flex flex-col gap-4">
                                <a href="#features" className="text-gray-700 hover:text-blue-600 font-medium">Recursos</a>
                                <a href="#benefits" className="text-gray-700 hover:text-blue-600 font-medium">Benefícios</a>
                                <Button onClick={() => navigate('/login')} className="w-full">Login</Button>
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative py-24 px-4 bg-gradient-to-br from-blue-50 via-white to-cyan-50">
                <div className="container mx-auto">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-block mb-4">
                            <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold">
                                A solução líder em gestão de circuitos de pesca
                            </span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                            Qualquer torneio, qualquer formato,
                            <span className="text-blue-600"> em qualquer lugar</span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                            Os circuitos de pesca são complexos, mas sua gestão não precisa ser.
                            STA FISHING é a plataforma mais flexível e completa para organizar competições de pesca esportiva.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                            <Button
                                onClick={() => navigate('/login')}
                                className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6 shadow-lg shadow-blue-600/30"
                            >
                                Começar Agora
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                            <Button
                                variant="outline"
                                className="border-gray-300 text-gray-700 hover:bg-gray-50 text-lg px-8 py-6"
                            >
                                Ver Demonstração
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section id="benefits" className="py-20 px-4 bg-blue-600">
                <div className="container mx-auto">
                    <div className="max-w-5xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
                            Por que escolher o STA FISHING?
                        </h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {benefits.map((benefit, index) => (
                                <div key={index} className="flex items-start gap-3 bg-blue-700/30 backdrop-blur-sm p-4 rounded-lg">
                                    <Check className="w-6 h-6 text-green-300 flex-shrink-0 mt-0.5" />
                                    <span className="text-white font-medium">{benefit}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-4">
                <div className="container mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Recursos Completos</h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Tudo que você precisa para profissionalizar a gestão do seu circuito de pesca
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="group p-8 rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-xl transition-all duration-300"
                            >
                                <div className="bg-blue-100 w-14 h-14 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                                    <feature.icon className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Final */}
            <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-cyan-600">
                <div className="container mx-auto text-center">
                    <h2 className="text-4xl font-bold text-white mb-6">
                        Pronto para modernizar seu circuito?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                        Junte-se aos organizadores que já estão profissionalizando a gestão dos seus torneios
                    </p>
                    <Button
                        className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6 shadow-2xl"
                        onClick={() => navigate('/login')}
                    >
                        Criar Minha Conta
                        <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 border-t border-gray-800 py-12 px-4">
                <div className="container mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600 p-2 rounded-lg">
                                <Fish className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <span className="text-lg font-bold text-white">STA FISHING</span>
                                <p className="text-xs text-gray-400">Gestão Profissional de Torneios</p>
                            </div>
                        </div>
                        <p className="text-gray-400">© 2024 STA FISHING. Todos os direitos reservados.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

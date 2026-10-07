import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import {
    LayoutDashboard,
    Image,
    Award,
    Globe,
    Trophy,
    MapPin,
    Users,
    Fish,
    LogOut,
    Menu,
    X,
    Shield,
    Settings,
    DollarSign,
    Locate
} from 'lucide-react';
import { useState } from 'react';

export function Sidebar() {
    const { currentUser, signOut, hasRole } = useAuth();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const menuItems = [
        {
            icon: LayoutDashboard,
            label: 'Dashboard',
            path: '/admin',
            roles: ['super_admin', 'judge', 'captain', 'company'],
        },
        {
            icon: Globe,
            label: 'Site',
            path: '/admin/carousel',
            roles: ['super_admin', 'company'],
        },
        {
            icon: Trophy,
            label: 'Circuitos',
            path: '/admin/circuits',
            roles: ['super_admin', 'company'],
        },
        {
            icon: MapPin,
            label: 'Etapas',
            path: '/admin/stages',
            roles: ['super_admin', 'company'],
        },
        {
            icon: Users,
            label: 'Equipes',
            path: '/admin/teams',
            roles: ['super_admin', 'company'],
        },
        {
            icon: DollarSign,
            label: 'Pagamentos',
            path: '/admin/payments',
            roles: ['super_admin', 'company'],
        },
        {
            icon: Locate,
            label: 'Localização GPS',
            path: '/admin/location',
            roles: ['super_admin', 'company'],
        },
        {
            icon: Image,
            label: 'Galerias & Fotos',
            path: '/admin/images',
            roles: ['super_admin', 'company'],
        },
        {
            icon: Award,
            label: 'Patrocinadores & Logos',
            path: '/admin/sponsors',
            roles: ['super_admin', 'company'],
        },
        {
            icon: Fish,
            label: 'Lançar Medidas',
            path: '/admin/scores',
            roles: ['super_admin', 'judge', 'company'],
        },
        {
            icon: Shield,
            label: 'Empresas',
            path: '/admin/users',
            roles: ['super_admin'],
        },
        {
            icon: Settings,
            label: 'Configurações',
            path: '/admin/settings',
            roles: ['super_admin', 'company'],
        },
    ];

    const filteredMenuItems = menuItems.filter(item => {
        // Primeiro verifica role
        if (!hasRole(item.roles as any)) return false;

        // Esconde "Empresas" de companies (apenas super_admin pode ver)
        if (currentUser?.role === 'company' && item.path.includes('/users')) return false;

        // Se for empresa, verifica permissões específicas
        if (currentUser?.role === 'company' && currentUser.permissions) {
            // Mapeamento de rotas para permissões
            if (item.path.includes('/circuits') && !currentUser.permissions.circuits) return false;
            if (item.path.includes('/stages') && !currentUser.permissions.stages) return false;
            if (item.path.includes('/teams') && !currentUser.permissions.teams) return false;
            if (item.path.includes('/scores') && !currentUser.permissions.scores) return false;
            // Configurações sempre permitidas se tiver role 'company'
        }

        return true;
    });

    const SidebarContent = () => (
        <>
            {/* Header */}
            <div className="p-6 border-b border-ocean-700">
                <div className="flex items-center gap-3 mb-2">
                    <img src="/sta-shield-logo.png" alt="STA FISHING" className="w-8 h-8 object-contain" />
                    <span className="text-xs font-black tracking-widest text-amber-400 uppercase">STA FISHING</span>
                </div>
                <h1 className="text-lg font-black text-white">
                    {currentUser?.email === 'carlao.basket@gmail.com' 
                        ? 'Desenvolvedor do Sistema'
                        : currentUser?.role === 'company' 
                            ? 'STA Fishing Master' 
                            : 'Painel Admin'}
                </h1>
                <p className="text-xs text-ocean-200 mt-0.5 truncate">{currentUser?.name}</p>
                <div className="mt-2 inline-block">
                    {currentUser?.email === 'carlao.basket@gmail.com' ? (
                        <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded border border-amber-500/30">
                            ⚙️ Desenvolvedor / Super Admin
                        </span>
                    ) : (
                        <span className="bg-blue-500/20 text-blue-300 text-[10px] font-black px-2 py-0.5 rounded border border-blue-500/30">
                            👑 Company Master
                        </span>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
                {filteredMenuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/admin'}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                ? 'bg-ocean-700 text-white'
                                : 'text-ocean-100 hover:bg-ocean-700/50'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-ocean-700">
                <Button
                    variant="danger"
                    onClick={handleSignOut}
                    className="w-full"
                >
                    <LogOut className="w-4 h-4" />
                    Sair
                </Button>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile Toggle */}
            <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 bg-ocean-800 text-white p-2 rounded-lg shadow-lg"
            >
                {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-ocean-800 min-h-screen">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar */}
            {mobileOpen && (
                <>
                    <div
                        className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
                        onClick={() => setMobileOpen(false)}
                    />
                    <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-ocean-800 z-50 flex flex-col">
                        <SidebarContent />
                    </aside>
                </>
            )}
        </>
    );
}

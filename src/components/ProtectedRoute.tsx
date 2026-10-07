import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { currentUser, loading, hasRole } = useAuth();
    const location = useLocation();

    console.log('ProtectedRoute check:', {
        loading,
        hasCurrentUser: !!currentUser,
        userRole: currentUser?.role,
        mustChangePassword: currentUser?.mustChangePassword,
        path: location.pathname
    });

    // Wait for auth state to be determined
    if (loading) {
        console.log('⏳ Waiting for auth state...');
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Se não tem usuário logado, redireciona para login
    if (!currentUser) {
        console.log('❌ No current user, redirecting to login');
        return <Navigate to="/login" replace />;
    }

    // Se for o primeiro acesso e a senha precisa ser trocada, forçar redirecionamento para alterar senha
    if (currentUser.mustChangePassword && location.pathname !== '/admin/change-password') {
        console.log('🔒 Primeiro acesso detectado: redirecionando para alteração de senha');
        return <Navigate to="/admin/change-password" replace />;
    }

    // Verificar roles se necessário
    if (allowedRoles && !hasRole(allowedRoles)) {
        console.log('❌ User does not have required role');
        return <Navigate to="/" replace />;
    }

    console.log('✅ Protected route access granted');
    return <>{children}</>;
}

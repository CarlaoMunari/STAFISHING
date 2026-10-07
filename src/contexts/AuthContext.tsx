import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User, UserRole } from '@/types';

// Configurações do Supabase (para fetch direto)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://viltrnhulqymoeughmmt.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbHRybmh1bHF5bW9ldWdobW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNDY2NTEsImV4cCI6MjA3OTkyMjY1MX0.PRigkelRd95A_X-zqC1bTqFM2aHW6yG-jjVqvR4TrZ4';

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    hasRole: (roles: UserRole[]) => boolean;
    completeFirstAccessPasswordChange: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const checkSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('Session error:', error);
                    return;
                }

                if (session?.user && mounted) {
                    await fetchUserProfile(session.user.id, session.user.email || '');
                }
            } catch (error) {
                console.error('Error checking session:', error);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        checkSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
            console.log('Auth state changed:', _event);
            if (session?.user && mounted) {
                await fetchUserProfile(session.user.id, session.user.email || '');
            } else {
                if (mounted) {
                    setCurrentUser(null);
                }
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const fetchUserProfile = async (userId: string, email: string) => {
        try {
            console.log('Fetching user profile for:', userId);

            const response = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=*`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                },
            });

            if (!response.ok) {
                console.error('Error fetching user profile, status:', response.status);
                return;
            }

            const data = await response.json();

            if (data && data.length > 0) {
                const userData = data[0];
                console.log('✅ User profile fetched via fetch!', userData);
                setCurrentUser({
                    id: userData.id,
                    email: userData.email || email,
                    name: userData.name || '',
                    role: userData.role as UserRole,
                    permissions: userData.permissions,
                    slug: userData.slug,
                    mustChangePassword: userData.must_change_password ?? false,
                    createdAt: new Date(userData.created_at),
                });
            } else {
                console.warn('⚠️ No user profile found in database');
            }
        } catch (error) {
            console.error('Error in fetchUserProfile:', error);
        }
    };

    const signIn = async (email: string, password: string) => {
        console.log('=== AuthContext.signIn START (FETCH DIRETO) ===');

        try {
            const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY,
                },
                body: JSON.stringify({ email, password }),
            });

            console.log('SignIn fetch response status:', response.status);

            const data = await response.json();

            if (!response.ok) {
                console.error('SignIn error response:', data);
                const msg = data.error_description || data.msg || data.message;
                if (data.error_code === 'invalid_credentials' || msg === 'Invalid login credentials') {
                    throw new Error('E-mail ou senha incorretos. Se o usuário foi criado apenas no painel local, certifique-se de ativá-lo também no Supabase Auth (Authentication > Users).');
                }
                throw new Error(msg || 'Erro ao fazer login');
            }

            console.log('✅ User authenticated via fetch!', data.user?.id);

            if (data.access_token && data.refresh_token) {
                const { error: sessionError } = await supabase.auth.setSession({
                    access_token: data.access_token,
                    refresh_token: data.refresh_token
                });

                if (sessionError) {
                    console.error('Erro ao salvar sessão:', sessionError);
                }
            }

            if (data.user) {
                await fetchUserProfile(data.user.id, data.user.email || '');
            }

            console.log('=== AuthContext.signIn END ===');
        } catch (error: any) {
            console.error('=== AuthContext.signIn ERROR ===', error);
            throw error;
        }
    };

    const completeFirstAccessPasswordChange = async (newPassword: string) => {
        if (!currentUser) throw new Error('Nenhum usuário logado.');

        const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
        if (authError) throw new Error(authError.message || 'Erro ao atualizar senha no Supabase');

        try {
            await supabase
                .from('users')
                .update({ must_change_password: false, updated_at: new Date().toISOString() })
                .eq('id', currentUser.id);
        } catch (dbErr) {
            console.warn('Aviso ao atualizar flag must_change_password no banco:', dbErr);
        }

        setCurrentUser(prev => prev ? { ...prev, mustChangePassword: false } : null);
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
    };

    const hasRole = (roles: UserRole[]): boolean => {
        if (!currentUser) return false;
        return roles.includes(currentUser.role);
    };

    const value: AuthContextType = {
        currentUser,
        loading,
        signIn,
        signOut,
        hasRole,
        completeFirstAccessPasswordChange,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

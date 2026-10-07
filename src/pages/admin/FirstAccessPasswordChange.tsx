import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Lock, Eye, EyeOff, ShieldAlert, CheckCircle2 } from 'lucide-react';

export function FirstAccessPasswordChange() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const { currentUser, completeFirstAccessPasswordChange } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('As senhas digitadas não coincidem.');
            return;
        }

        setLoading(true);

        try {
            await completeFirstAccessPasswordChange(newPassword);
            setSuccess(true);
            setTimeout(() => {
                navigate('/admin');
            }, 1500);
        } catch (err: any) {
            console.error('Erro ao alterar senha no primeiro acesso:', err);
            setError(err.message || 'Erro ao atualizar a senha. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-ocean-700 via-ocean-600 to-fishing-700 flex items-center justify-center px-4 py-8">
            <Card className="w-full max-w-md p-6 bg-white shadow-2xl rounded-2xl border border-ocean-100">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4 shadow-inner">
                        <Lock className="w-8 h-8 text-amber-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Primeiro Acesso
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Defina sua senha definitiva para acessar a plataforma
                    </p>
                </div>

                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900">
                    <div className="flex items-start space-x-3">
                        <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold">{currentUser?.name || 'Sua Empresa'}</p>
                            <p className="text-xs text-amber-800">{currentUser?.email}</p>
                            <p className="text-xs text-amber-700 mt-2">
                                Para sua segurança, é obrigatório alterar a senha temporária criada no momento do cadastro antes de acessar o painel administrativo.
                            </p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        <strong>Erro:</strong> {error}
                    </div>
                )}

                {success ? (
                    <div className="p-6 bg-green-50 border border-green-200 text-green-800 rounded-xl text-center">
                        <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2 animate-bounce" />
                        <h2 className="text-lg font-bold text-green-900">Senha Alterada com Sucesso!</h2>
                        <p className="text-xs text-green-700 mt-1">Redirecionando você para o painel administrativo...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nova Senha
                            </label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="No mínimo 6 caracteres"
                                    required
                                    disabled={loading}
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Confirmar Nova Senha
                            </label>
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Digite novamente a nova senha"
                                required
                                disabled={loading}
                                minLength={6}
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full py-3 text-base font-medium shadow-md hover:shadow-lg transition-all"
                            disabled={loading}
                        >
                            {loading ? 'Salvando...' : 'Cadastrar Nova Senha e Acessar Painel'}
                        </Button>
                    </form>
                )}
            </Card>
        </div>
    );
}

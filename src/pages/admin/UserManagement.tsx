import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Trash2, UserPlus, Check } from 'lucide-react';

interface AppUser {
    id: string;
    email: string;
    name: string; // Nome da empresa
    slug?: string; // URL personalizada
    role: 'super_admin' | 'company';
    permissions: {
        circuits: boolean;
        stages: boolean;
        teams: boolean;
        scores: boolean;
        rankings: boolean;
        financial: boolean;
    };
    createdAt: Date;
}

export function UserManagement() {
    const [users, setUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [permissions, setPermissions] = useState({
        circuits: true,
        stages: true,
        teams: true,
        scores: true,
        rankings: true,
        financial: false
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const loadedUsers = data.map((user: any) => ({
                id: user.id,
                email: user.email,
                name: user.name,
                slug: user.slug,
                role: user.role,
                permissions: {
                    circuits: true,
                    stages: true,
                    teams: true,
                    scores: true,
                    rankings: true,
                    financial: user.role === 'super_admin'
                },
                createdAt: new Date(user.created_at)
            })) as AppUser[];

            setUsers(loadedUsers);
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            console.log('Creating user with:', { email, name, slug });
            // Criar usuário no Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name,
                        role: 'company'
                    }
                }
            });
            if (authError) {
                console.error('Auth error:', authError);
                throw new Error(`Erro ao criar usuário: ${authError.message}`);
            }
            if (!authData.user) {
                throw new Error('Usuário não foi criado');
            }
            // Inserir na tabela users
            const { error: userError } = await supabase
                .from('users')
                .insert({
                    id: authData.user.id,
                    email,
                    name,
                    role: 'company',
                    slug,
                    permissions,
                    created_at: new Date().toISOString()
                });
            if (userError) {
                console.error('Database error:', userError);
                console.error('Error code:', userError.code);
                console.error('Error details:', userError.details);
                console.error('Error hint:', userError.hint);
                throw new Error(`Erro ao salvar no banco: ${userError.message} (code: ${userError.code})`);
            }
            alert(`✅ Usuário empresa criado com sucesso!
📧 Email: ${email}
🔑 Senha: ${password}
🏢 Nome: ${name}
🔗 Homepage: /${slug || 'empresa'}
O usuário já pode fazer login!`);
            setShowModal(false);
            resetForm();
            loadUsers();
        } catch (error: any) {
            console.error('Erro completo:', error);
            alert(`❌ Erro ao criar empresa:\n\n${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setEmail('');
        setPassword('');
        setName('');
        setSlug('');
        setPermissions({
            circuits: true,
            stages: true,
            teams: true,
            scores: true,
            rankings: true,
            financial: false
        });
    };

    const togglePermission = (key: keyof typeof permissions) => {
        setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleDelete = async (userId: string, userEmail: string, userName?: string) => {
        const targetName = userName || userEmail;
        const NL = String.fromCharCode(10);
        const confirmMsg = [
            'ATENÇÃO! EXCLUSÃO DEFINITIVA DA EMPRESA: "' + targetName + '"',
            '',
            'Esta ação irá EXCLUIR PERMANENTEMENTE do banco de dados:',
            '• O usuário da empresa e acesso de login',
            '• Todos os Circuitos cadastrados',
            '• Todas as Etapas associadas',
            '• Todas as Equipes inscritas',
            '• Todas as Pontuações e Lançamentos de Peixes',
            '• Todas as Chaves e Rastreios GPS',
            '',
            'Tem certeza absoluta de que deseja EXCLUIR ESTA EMPRESA E TODOS OS DADOS?'
        ].join(NL);

        if (!confirm(confirmMsg)) {
            return;
        }

        try {
            setLoading(true);
            console.log('Iniciando exclusao da empresa:', { userId, userEmail });

            let success = false;

            // 1. Tentar invocar Edge Function para exclusao completa (Auth + Cascata DB)
            try {
                const { data: edgeData, error: functionError } = await supabase.functions.invoke('delete-company-user', {
                    body: { userId, email: userEmail }
                });

                if (!functionError && edgeData?.success) {
                    success = true;
                    console.log('Empresa excluida via Edge Function com sucesso');
                }
            } catch (edgeErr) {
                console.warn('Edge Function indisponivel, tentando RPC...', edgeErr);
            }

            // 2. Tentar executar Stored Procedure RPC delete_company_cascade no Supabase
            if (!success) {
                const { data: rpcData, error: rpcError } = await supabase.rpc('delete_company_cascade', {
                    p_company_id: userId
                });

                if (!rpcError && rpcData?.success) {
                    success = true;
                    console.log('Empresa excluida via RPC delete_company_cascade com sucesso:', rpcData);
                } else {
                    console.warn('RPC erro ou success=false:', rpcError || rpcData);
                }
            }

            // 3. Fallback de Exclusao Manual no Cliente
            if (!success) {
                // a) Deletar logos, imagens, resultados e GPS vinculados à empresa
                await supabase.from('event_logos').delete().eq('company_id', userId);
                await supabase.from('sponsor_logos').delete().eq('company_id', userId);
                await supabase.from('carousel_images').delete().eq('company_id', userId);
                await supabase.from('company_settings').delete().eq('company_id', userId);
                await supabase.from('results').delete().eq('company_id', userId);
                await supabase.from('gps_locations').delete().eq('company_id', userId);
                await supabase.from('gps_access_keys').delete().eq('company_id', userId);

                // b) Buscar circuitos da empresa
                const { data: circuits } = await supabase.from('circuits').select('id').eq('company_id', userId);
                const circuitIds = (circuits || []).map(c => c.id);
                
                if (circuitIds.length > 0) {
                    const { data: stages } = await supabase.from('stages').select('id').in('circuit_id', circuitIds);
                    const stageIds = (stages || []).map(s => s.id);
                    if (stageIds.length > 0) {
                        await supabase.from('results').delete().in('stage_id', stageIds);
                        await supabase.from('teams').delete().in('stage_id', stageIds);
                    }
                    await supabase.from('stages').delete().in('circuit_id', circuitIds);
                    await supabase.from('circuits').delete().eq('company_id', userId);
                }
                
                await supabase.from('stages').delete().eq('company_id', userId);
                await supabase.from('teams').delete().eq('company_id', userId);

                // c) Excluir o perfil do usuario em public.users
                const { error: deleteUserError } = await supabase
                    .from('users')
                    .delete()
                    .eq('id', userId);

                if (deleteUserError) {
                    throw deleteUserError;
                }
            }

            alert('Empresa "' + targetName + '" e todos os seus dados vinculados foram excluídos com sucesso!');
            await loadUsers();
        } catch (error: any) {
            console.error('Erro ao excluir empresa:', error);
            const errDetail = error.message || 'Erro desconhecido';
            if (errDetail.includes('foreign key constraint')) {
                const msg = [
                    '⚠️ ATENÇÃO: Para permitir a exclusão de empresas no Supabase, você precisa executar o script SQL de atualização!',
                    '',
                    'Acesse o Supabase > SQL Editor e execute o código atualizado de "database/17-cascade-delete-company.sql".',
                    '',
                    'Erro do Banco: ' + errDetail
                ].join(NL);
                alert(msg);
            } else {
                alert('Erro ao excluir empresa: ' + errDetail);
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <AdminLayout><LoadingSpinner /></AdminLayout>;

    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Gestão de Empresas</h1>
                        <p className="text-gray-500">Gerencie o acesso das empresas contratantes</p>
                    </div>
                    <Button onClick={() => setShowModal(true)}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Nova Empresa
                    </Button>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa / Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Função</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissões</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Cadastro</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                                {user.slug && <div className="text-xs text-blue-500">/{user.slug}</div>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                                            }`}>
                                            {user.role === 'super_admin' ? 'Super Admin' : 'Empresa'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {Object.entries(user.permissions).map(([key, value]) => (
                                                value && (
                                                    <span key={key} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded border border-gray-200">
                                                        {key}
                                                    </span>
                                                )
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {user.role !== 'super_admin' && (
                                            <button
                                                onClick={() => handleDelete(user.id, user.email, user.name)}
                                                className="text-red-600 hover:text-red-900"
                                                title="Excluir empresa"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Criação */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
                        <h2 className="text-xl font-bold mb-4">Cadastrar Nova Empresa</h2>
                        <form onSubmit={handleCreateUser} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa</label>
                                    <Input value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: Pesca Show Ltda" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">URL Personalizada (Slug)</label>
                                    <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="minhaempresa" />
                                    <p className="text-xs text-gray-500 mt-1">Será acessível em /{slug || '...'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email de Acesso</label>
                                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="empresa@email.com" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Senha Temporária</label>
                                    <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="********" />
                                    <p className="text-xs text-gray-500 mt-1">O usuário deverá alterar esta senha no primeiro acesso.</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">Permissões de Acesso</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {Object.entries(permissions).map(([key, value]) => (
                                        <label key={key} className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${value ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                                                {value && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={value}
                                                onChange={() => togglePermission(key as keyof typeof permissions)}
                                                className="hidden"
                                            />
                                            <span className="capitalize text-sm font-medium text-gray-700">{key}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
                                <Button type="submit" variant="primary">Criar Empresa</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

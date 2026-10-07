import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Save, Image as ImageIcon, DollarSign } from 'lucide-react';
import { ImageUploader } from '@/components/admin/ImageUploader';

export function CompanySettings() {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);

    // Logo
    const [logoUrl, setLogoUrl] = useState('');

    // Configurações de Pagamento - PIX
    const [pixKey, setPixKey] = useState('');
    const [pixKeyType, setPixKeyType] = useState('cpf');
    const [pixBeneficiaryName, setPixBeneficiaryName] = useState('');
    const [paymentInstructions, setPaymentInstructions] = useState('');

    // Mercado Pago
    const [mpEnabled, setMpEnabled] = useState(false);
    const [mpAccessToken, setMpAccessToken] = useState('');
    const [mpPublicKey, setMpPublicKey] = useState('');

    useEffect(() => {
        loadSettings();
    }, [currentUser]);

    const loadSettings = async () => {
        if (currentUser) {
            try {
                const { data, error } = await supabase
                    .from('company_settings')
                    .select('*')
                    .eq('company_id', currentUser.id)
                    .maybeSingle();

                if (error && error.code !== 'PGRST116') {
                    console.error('Erro ao carregar configurações:', error);
                    return;
                }

                if (data) {
                    setLogoUrl(data.logo_url || '');
                    setPixKey(data.pix_key || '');
                    setPixKeyType(data.pix_key_type || 'cpf');
                    setPixBeneficiaryName(data.pix_beneficiary_name || '');
                    setPaymentInstructions(data.payment_instructions || '');
                    setMpEnabled(data.mp_enabled || false);
                    setMpAccessToken(data.mp_access_token || '');
                    setMpPublicKey(data.mp_public_key || '');
                }
            } catch (error) {
                console.error('Erro ao carregar configurações:', error);
            }
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            if (currentUser) {
                const settings = {
                    company_id: currentUser.id,
                    logo_url: logoUrl,
                    pix_key: pixKey,
                    pix_key_type: pixKeyType,
                    pix_beneficiary_name: pixBeneficiaryName,
                    payment_instructions: paymentInstructions,
                    mp_enabled: mpEnabled,
                    mp_access_token: mpAccessToken,
                    mp_public_key: mpPublicKey,
                    updated_at: new Date().toISOString()
                };

                const { error } = await supabase
                    .from('company_settings')
                    .upsert(settings, {
                        onConflict: 'company_id'
                    });

                if (error) throw error;

                alert('✅ Configurações salvas com sucesso!');
            }
        } catch (error: any) {
            console.error('Erro ao salvar:', error);
            alert(`❌ Erro ao salvar configurações: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Configurações Gerais & Pagamentos</h1>
                        <p className="text-gray-500 mt-1">Gerencie a Logo da Empresa e os métodos de pagamento (PIX e Mercado Pago)</p>
                    </div>
                    <Button onClick={handleSave} loading={loading}>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Alterações
                    </Button>
                </div>

                <div className="space-y-6">
                    {/* Logo da Empresa */}
                    <Card className="p-6">
                        <div className="flex items-center gap-2 mb-4 border-b pb-3">
                            <ImageIcon className="w-5 h-5 text-blue-600" />
                            <h2 className="text-lg font-bold text-gray-900">Logo da Empresa</h2>
                        </div>
                        <div>
                            <ImageUploader
                                bucket="company-logos"
                                onUploadComplete={(url) => setLogoUrl(url)}
                                maxSizeMB={2}
                                allowedTypes={['image/png', 'image/jpeg', 'image/svg+xml']}
                                recommendedSize={{ width: 200, height: 200 }}
                                label="Selecionar Logo"
                            />
                            <p className="text-xs text-gray-500 mt-2">Recomendado: PNG transparente, 200x200px (máx. 2MB)</p>
                            {logoUrl && (
                                <div className="mt-4 p-4 bg-gray-50 border rounded-lg flex items-center gap-4">
                                    <img src={logoUrl} alt="Logo da empresa" className="h-16 w-16 object-contain border p-1 rounded bg-white" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">Logo atual cadastrada</p>
                                        <p className="text-xs text-gray-500 break-all">{logoUrl}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Configurações de Pagamento */}
                    <Card className="p-6">
                        <div className="flex items-center gap-2 mb-6 border-b pb-3">
                            <DollarSign className="w-5 h-5 text-blue-600" />
                            <h2 className="text-lg font-bold text-gray-900">Configurações de Pagamento (Inscrições)</h2>
                        </div>

                        {/* PIX Manual */}
                        <div className="space-y-4 mb-8">
                            <h3 className="font-semibold text-gray-900 border-b pb-2">1. Dados do PIX (Manual)</h3>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tipo da Chave PIX
                                    </label>
                                    <select
                                        value={pixKeyType}
                                        onChange={e => setPixKeyType(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="cpf">CPF</option>
                                        <option value="cnpj">CNPJ</option>
                                        <option value="email">E-mail</option>
                                        <option value="phone">Telefone</option>
                                        <option value="random">Chave Aleatória</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Chave PIX
                                    </label>
                                    <Input
                                        value={pixKey}
                                        onChange={e => setPixKey(e.target.value)}
                                        placeholder="Ex: 12345678900 ou email@exemplo.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nome do Beneficiário
                                </label>
                                <Input
                                    value={pixBeneficiaryName}
                                    onChange={e => setPixBeneficiaryName(e.target.value)}
                                    placeholder="Nome que aparece na conta bancária do PIX"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Instruções de Pagamento (Opcional)
                                </label>
                                <textarea
                                    value={paymentInstructions}
                                    onChange={e => setPaymentInstructions(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    rows={3}
                                    placeholder="Ex: Envie o comprovante para o whatsapp (11) 99999-9999"
                                />
                            </div>
                            <p className="text-xs text-gray-500">
                                Essas informações serão exibidas na tela de checkout para pagamento das equipes.
                            </p>
                        </div>

                        {/* Mercado Pago */}
                        <div className="space-y-4 pt-4 border-t">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-gray-900">2. Mercado Pago (Automático - Opcional)</h3>
                                    <p className="text-sm text-gray-600">
                                        Habilite para aceitar PIX automático e Cartão de Crédito com baixa instantânea
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={mpEnabled}
                                        onChange={e => setMpEnabled(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            {mpEnabled && (
                                <div className="space-y-4 pt-2">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <p className="text-sm text-blue-800 mb-2">
                                            <strong>Como obter suas credenciais:</strong>
                                        </p>
                                        <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
                                            <li>Acesse <a href="https://www.mercadopago.com.br/developers" target="_blank" rel="noopener noreferrer" className="underline">Mercado Pago Developers</a></li>
                                            <li>Vá em "Suas integrações" ➔ "Credenciais"</li>
                                            <li>Copie o Access Token e Public Key (Produção)</li>
                                        </ol>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Access Token
                                        </label>
                                        <Input
                                            type="password"
                                            value={mpAccessToken}
                                            onChange={e => setMpAccessToken(e.target.value)}
                                            placeholder="APP_USR-..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Public Key
                                        </label>
                                        <Input
                                            type="password"
                                            value={mpPublicKey}
                                            onChange={e => setMpPublicKey(e.target.value)}
                                            placeholder="APP_USR-..."
                                        />
                                    </div>

                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <p className="text-xs text-yellow-800">
                                            <strong>Importante:</strong> Mantenha suas credenciais em segurança.
                                            O Mercado Pago cobra taxas por transação: PIX 0,99% / Cartão 4,99% + R$0,40.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}

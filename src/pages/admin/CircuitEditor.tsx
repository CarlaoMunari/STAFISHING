import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
    ArrowLeft, Save, Upload, Bold, Italic, Underline, Strikethrough,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    List, ListOrdered, Quote, Undo, Redo, Eraser,
    FileText, Code, Minus
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { User } from '@/types';

export function CircuitEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { companyId: contextCompanyId } = useCompany();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [companies, setCompanies] = useState<User[]>([]);

    // Form State
    const [selectedCompanyId, setSelectedCompanyId] = useState('');
    const [name, setName] = useState('');
    const [year, setYear] = useState(new Date().getFullYear());
    const [active, setActive] = useState(true);
    const [regulation, setRegulation] = useState('');
    const [modalityBoat, setModalityBoat] = useState(true);
    const [modalityKayak, setModalityKayak] = useState(false);
    const [fishCount, setFishCount] = useState(6);
    const [imageFile, setImageFile] = useState<File | null>(null);

    // Word Editor State
    const [htmlMode, setHtmlMode] = useState(false);
    const editorRef = useRef<HTMLDivElement>(null);
    const isInitialRender = useRef(true);

    useEffect(() => {
        if (currentUser?.role === 'super_admin') {
            loadCompanies();
        }
        if (id) {
            loadCircuit(id);
        } else {
            setLoading(false);
        }
    }, [id, currentUser]);

    // Sync regulation content to contentEditable editor div on load or mode switch
    useEffect(() => {
        if (!htmlMode && editorRef.current) {
            const formattedContent = regulation && !/<[a-z][\s\S]*>/i.test(regulation)
                ? regulation.split('\n').map(line => `<p>${line || '<br>'}</p>`).join('')
                : regulation;

            if (isInitialRender.current || editorRef.current.innerHTML !== formattedContent) {
                editorRef.current.innerHTML = formattedContent || '<p><br></p>';
                isInitialRender.current = false;
            }
        }
    }, [regulation, htmlMode, loading]);

    const loadCompanies = async () => {
        const { data } = await supabase
            .from('users')
            .select('*')
            .eq('role', 'company')
            .order('name');

        if (data) {
            setCompanies(data as User[]);
        }
    };

    const loadCircuit = async (circuitId: string) => {
        try {
            const { data, error } = await supabase
                .from('circuits')
                .select('*')
                .eq('id', circuitId)
                .single();

            if (error) throw error;

            if (data) {
                setName(data.name);
                setYear(data.year);
                setActive(data.active);
                setRegulation(data.regulation || '');
                setModalityBoat(data.modality_boat ?? true);
                setModalityKayak(data.modality_kayak ?? false);
                setFishCount(data.fish_count || 6);
                setSelectedCompanyId(data.company_id || '');
            }
        } catch (error) {
            console.error('Erro ao carregar circuito:', error);
            alert('Erro ao carregar circuito');
            navigate('/admin/circuits');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Get final regulation content from editor if in WYSIWYG mode
            let finalRegulation = regulation;
            if (!htmlMode && editorRef.current) {
                finalRegulation = editorRef.current.innerHTML;
            }

            const circuitData = {
                name,
                year,
                active,
                regulation: finalRegulation,
                modality_boat: modalityBoat,
                modality_kayak: modalityKayak,
                fish_count: fishCount,
                company_id: selectedCompanyId || contextCompanyId || currentUser?.id
            };

            let circuitId = id;

            if (id) {
                const { error } = await supabase
                    .from('circuits')
                    .update(circuitData)
                    .eq('id', id);
                if (error) throw error;
            } else {
                const { data, error } = await supabase
                    .from('circuits')
                    .insert(circuitData)
                    .select()
                    .single();
                if (error) throw error;
                circuitId = data.id;
            }

            if (imageFile && circuitId) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${circuitId}-logo.${fileExt}`;
                const filePath = `circuit-logos/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('images')
                    .upload(filePath, imageFile, { upsert: true });

                if (uploadError) throw uploadError;
            }

            navigate('/admin/circuits');
        } catch (error) {
            console.error('Erro ao salvar circuito:', error);
            alert('Erro ao salvar circuito');
        } finally {
            setSaving(false);
        }
    };

    // Word Editor Format Command Execution
    const execCmd = (command: string, value: string | null = null) => {
        document.execCommand(command, false, value ?? undefined);
        if (editorRef.current) {
            setRegulation(editorRef.current.innerHTML);
        }
    };

    const handleEditorInput = () => {
        if (editorRef.current) {
            setRegulation(editorRef.current.innerHTML);
        }
    };

    const getWordStats = (html: string) => {
        const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        const words = text ? text.split(' ').length : 0;
        const chars = text.length;
        return { words, chars };
    };

    const stats = getWordStats(regulation);

    if (loading) {
        return (
            <AdminLayout>
                <LoadingSpinner size="lg" />
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" onClick={() => navigate('/admin/circuits')}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Voltar
                        </Button>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {id ? 'Editar Circuito' : 'Novo Circuito'}
                        </h1>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    {/* Super Admin Company Selector */}
                    {currentUser?.role === 'super_admin' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Organização / Empresa Responsável
                            </label>
                            <select
                                value={selectedCompanyId}
                                onChange={(e) => setSelectedCompanyId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                                required
                            >
                                <option value="">Selecione uma empresa...</option>
                                {companies.map((comp) => (
                                    <option key={comp.id} value={comp.id}>
                                        {comp.name} ({comp.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Row 1: Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Input
                                label="Nome do Circuito"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex: Circuito Tucunaré 2025"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                value={active ? 'true' : 'false'}
                                onChange={(e) => setActive(e.target.value === 'true')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="true">Ativo</option>
                                <option value="false">Inativo</option>
                            </select>
                        </div>
                    </div>

                    {/* Row 2: Year & Modalities */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <Input
                                label="Ano"
                                type="number"
                                value={year}
                                onChange={(e) => setYear(parseInt(e.target.value))}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Modalidade Embarcada</label>
                            <select
                                value={modalityBoat ? 'true' : 'false'}
                                onChange={(e) => setModalityBoat(e.target.value === 'true')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="true">Sim</option>
                                <option value="false">Não</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Modalidade Caiaque</label>
                            <select
                                value={modalityKayak ? 'true' : 'false'}
                                onChange={(e) => setModalityKayak(e.target.value === 'true')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="true">Sim</option>
                                <option value="false">Não</option>
                            </select>
                        </div>
                    </div>

                    {/* Row 3: Fish Count */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Quantidade de Peixes Válidos
                            </label>
                            <select
                                value={fishCount}
                                onChange={(e) => setFishCount(Number(e.target.value))}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={1}>1 Peixe</option>
                                <option value={2}>2 Peixes</option>
                                <option value={3}>3 Peixes</option>
                                <option value={4}>4 Peixes</option>
                                <option value={5}>5 Peixes</option>
                                <option value={6}>6 Peixes</option>
                                <option value={7}>7 Peixes</option>
                                <option value={8}>8 Peixes</option>
                                <option value={9}>9 Peixes</option>
                                <option value={10}>10 Peixes</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Define quantos peixes contam para a pontuação e quantos campos aparecem na ficha.
                            </p>
                        </div>
                    </div>

                    {/* Row 4: Microsoft Word Style Regulation Editor */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-800">
                            Regulamento do Circuito
                        </label>

                        {/* Word Application Container */}
                        <div className="border border-gray-400 rounded-lg overflow-hidden shadow-lg bg-[#f3f2f1]">

                            {/* Word Title Header */}
                            <div className="bg-[#2b579a] text-white px-4 py-2 flex justify-between items-center select-none">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-200" />
                                    <span className="font-semibold text-sm tracking-wide">
                                        Microsoft Word - Documento de Regulamento
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-blue-100">
                                    <span>{stats.words} palavras</span>
                                    <span>|</span>
                                    <span>{stats.chars} caracteres</span>
                                    <button
                                        type="button"
                                        onClick={() => setHtmlMode(!htmlMode)}
                                        className="ml-2 px-2.5 py-1 bg-blue-700 hover:bg-blue-800 rounded text-xs font-medium flex items-center gap-1 transition-colors"
                                    >
                                        <Code className="w-3.5 h-3.5" />
                                        {htmlMode ? 'Modo Word (WYSIWYG)' : 'Código HTML'}
                                    </button>
                                </div>
                            </div>

                            {/* Word Ribbon Toolbar */}
                            {!htmlMode && (
                                <div className="bg-[#f8f9fa] border-b border-gray-300 p-2 flex flex-wrap items-center gap-1 select-none text-gray-700">

                                    {/* Undo / Redo */}
                                    <div className="flex items-center bg-white border border-gray-300 rounded p-0.5 shadow-xs">
                                        <button
                                            type="button"
                                            onClick={() => execCmd('undo')}
                                            className="p-1.5 hover:bg-gray-100 rounded text-gray-700"
                                            title="Desfazer (Ctrl+Z)"
                                        >
                                            <Undo className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => execCmd('redo')}
                                            className="p-1.5 hover:bg-gray-100 rounded text-gray-700"
                                            title="Refazer (Ctrl+Y)"
                                        >
                                            <Redo className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="w-px h-6 bg-gray-300 mx-1"></div>

                                    {/* Format Block Select */}
                                    <select
                                        onChange={(e) => execCmd('formatBlock', e.target.value)}
                                        defaultValue="p"
                                        className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 focus:outline-none shadow-xs"
                                    >
                                        <option value="p">Normal (Parágrafo)</option>
                                        <option value="h1">Título 1 (H1)</option>
                                        <option value="h2">Título 2 (H2)</option>
                                        <option value="h3">Título 3 (H3)</option>
                                        <option value="blockquote">Citação / Destaque</option>
                                    </select>

                                    <div className="w-px h-6 bg-gray-300 mx-1"></div>

                                    {/* Font Formatting Group */}
                                    <div className="flex items-center bg-white border border-gray-300 rounded p-0.5 shadow-xs">
                                        <button
                                            type="button"
                                            onClick={() => execCmd('bold')}
                                            className="p-1.5 hover:bg-gray-100 rounded font-bold text-gray-800"
                                            title="Negrito (Ctrl+B)"
                                        >
                                            <Bold className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => execCmd('italic')}
                                            className="p-1.5 hover:bg-gray-100 rounded italic text-gray-800"
                                            title="Itálico (Ctrl+I)"
                                        >
                                            <Italic className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => execCmd('underline')}
                                            className="p-1.5 hover:bg-gray-100 rounded underline text-gray-800"
                                            title="Sublinhado (Ctrl+U)"
                                        >
                                            <Underline className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => execCmd('strikeThrough')}
                                            className="p-1.5 hover:bg-gray-100 rounded line-through text-gray-800"
                                            title="Tachado"
                                        >
                                            <Strikethrough className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="w-px h-6 bg-gray-300 mx-1"></div>

                                    {/* Alignment Group */}
                                    <div className="flex items-center bg-white border border-gray-300 rounded p-0.5 shadow-xs">
                                        <button
                                            type="button"
                                            onClick={() => execCmd('justifyLeft')}
                                            className="p-1.5 hover:bg-gray-100 rounded text-gray-700"
                                            title="Alinhar à Esquerda"
                                        >
                                            <AlignLeft className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => execCmd('justifyCenter')}
                                            className="p-1.5 hover:bg-gray-100 rounded text-gray-700"
                                            title="Centralizar"
                                        >
                                            <AlignCenter className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => execCmd('justifyRight')}
                                            className="p-1.5 hover:bg-gray-100 rounded text-gray-700"
                                            title="Alinhar à Direita"
                                        >
                                            <AlignRight className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => execCmd('justifyFull')}
                                            className="p-1.5 hover:bg-gray-100 rounded text-gray-700"
                                            title="Justificado"
                                        >
                                            <AlignJustify className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="w-px h-6 bg-gray-300 mx-1"></div>

                                    {/* Lists Group */}
                                    <div className="flex items-center bg-white border border-gray-300 rounded p-0.5 shadow-xs">
                                        <button
                                            type="button"
                                            onClick={() => execCmd('insertUnorderedList')}
                                            className="p-1.5 hover:bg-gray-100 rounded text-gray-700"
                                            title="Marcadores"
                                        >
                                            <List className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => execCmd('insertOrderedList')}
                                            className="p-1.5 hover:bg-gray-100 rounded text-gray-700"
                                            title="Numeração"
                                        >
                                            <ListOrdered className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => execCmd('formatBlock', 'blockquote')}
                                            className="p-1.5 hover:bg-gray-100 rounded text-gray-700"
                                            title="Citação"
                                        >
                                            <Quote className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => execCmd('insertHorizontalRule')}
                                            className="p-1.5 hover:bg-gray-100 rounded text-gray-700"
                                            title="Linha Divisória"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="w-px h-6 bg-gray-300 mx-1"></div>

                                    {/* Clear Formatting */}
                                    <button
                                        type="button"
                                        onClick={() => execCmd('removeFormat')}
                                        className="p-1.5 bg-white border border-gray-300 hover:bg-gray-100 rounded text-gray-700 flex items-center gap-1 text-xs shadow-xs"
                                        title="Limpar Formatação"
                                    >
                                        <Eraser className="w-4 h-4 text-red-500" />
                                        <span>Limpar</span>
                                    </button>
                                </div>
                            )}

                            {/* Word Document Canvas (Fundo Cinza com Folha de Papel A4 Branca) */}
                            <div className="bg-[#e6e6e6] p-4 sm:p-8 min-h-[600px] flex justify-center overflow-x-auto">
                                {!htmlMode ? (
                                    /* Folha de Papel A4 */
                                    <div
                                        ref={editorRef}
                                        contentEditable={true}
                                        onInput={handleEditorInput}
                                        className="bg-white shadow-2xl rounded-sm w-full max-w-[800px] min-h-[700px] p-8 md:p-14 border border-gray-300 outline-none regulation-content prose max-w-none focus:ring-2 focus:ring-blue-500 cursor-text"
                                        style={{ minHeight: '750px' }}
                                    />
                                ) : (
                                    /* Código HTML Bruto */
                                    <textarea
                                        value={regulation}
                                        onChange={(e) => setRegulation(e.target.value)}
                                        className="w-full max-w-[800px] min-h-[700px] p-4 font-mono text-sm border border-gray-400 rounded bg-gray-900 text-green-400 focus:outline-none resize-y"
                                        placeholder="Código HTML..."
                                    />
                                )}
                            </div>

                            {/* Word Status Bar */}
                            <div className="bg-[#f3f2f1] border-t border-gray-300 px-4 py-1.5 text-xs text-gray-600 flex justify-between items-center select-none">
                                <span>Página 1 de 1</span>
                                <span className="text-gray-500 font-mono">Modo de Edição Direta (WYSIWYG)</span>
                            </div>
                        </div>

                        <p className="text-xs text-gray-500 mt-1">
                            Escreva diretamente na folha como no Word. Formatações, parágrafos, cores e listas serão mantidos exatamente como você visualizar.
                        </p>
                    </div>

                    {/* Row 5: Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Imagem do Circuito</label>
                        <p className="text-xs text-gray-500 mb-3">
                            <span className="font-semibold text-gray-700">Tamanho recomendado:</span> 600x600px |
                            <span className="font-semibold text-gray-700"> Formatos:</span> JPG, PNG |
                            <span className="font-semibold text-gray-700"> Máximo:</span> 2MB
                        </p>
                        <div className="flex items-center gap-4">
                            <label className="cursor-pointer">
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png"
                                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                    className="hidden"
                                />
                                <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                                    <Upload className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm text-gray-700">Escolher arquivo</span>
                                </div>
                            </label>
                            <span className="text-sm text-gray-500">
                                {imageFile ? imageFile.name : 'Nenhum arquivo escolhido'}
                            </span>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-6 border-t border-gray-200 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => navigate('/admin/circuits')}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="primary" loading={saving}>
                            <Save className="w-4 h-4 mr-2" />
                            Salvar Alterações
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
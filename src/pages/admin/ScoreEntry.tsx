import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Circuit, Stage, Team } from '@/types';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { BarChart, FileText, Download, Upload, Printer } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';

interface FishEntry {
    measurement: string;
    color: 'blue' | 'yellow' | null;
}

interface TeamScore {
    team: Team;
    fish: FishEntry[];
    average: number;
    total: number;
    biggestBlue: number | null;
    biggestYellow: number | null;
}

export function ScoreEntry() {
    const [circuits, setCircuits] = useState<Circuit[]>([]);
    const [stages, setStages] = useState<Stage[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedCircuit, setSelectedCircuit] = useState<string>('');
    const [selectedStage, setSelectedStage] = useState<string>('');
    const [teamScores, setTeamScores] = useState<TeamScore[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [autoSaveStatus, setAutoSaveStatus] = useState<string>('');
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const { companyId } = useCompany();
    const { currentUser } = useAuth();
    const [fishCount, setFishCount] = useState(6); // Default 6

    useEffect(() => {
        loadCircuits();
    }, [companyId]);

    useEffect(() => {
        if (selectedCircuit) {
            const circuit = circuits.find(c => c.id === selectedCircuit);
            if (circuit) {
                setFishCount(circuit.fishCount || 6);
            }
            loadStages(selectedCircuit);
        }
    }, [selectedCircuit, circuits]);

    useEffect(() => {
        if (selectedStage) {
            setIsInitialLoad(true); // Marca como carregamento inicial
            loadTeamsAndResults(selectedStage);
        }
    }, [selectedStage]);

    // Auto-save com debounce de 3 segundos após mudanças em teamScores
    useEffect(() => {
        // Não salvar se:
        // - Não há dados
        // - Não há stage selecionado
        // - É o carregamento inicial
        if (teamScores.length === 0 || !selectedStage || isInitialLoad) {
            if (isInitialLoad && teamScores.length > 0) {
                setIsInitialLoad(false); // Primeira carga completa
            }
            return;
        }

        setAutoSaveStatus('💾 Salvando...');

        const timer = setTimeout(async () => {
            try {
                await saveResultsSilently();
                setAutoSaveStatus('✓ Salvo');

                // Limpa mensagem após 2 segundos
                setTimeout(() => setAutoSaveStatus(''), 2000);
            } catch (error: any) {
                console.error('❌ Erro no auto-save:', error);
                const errorMsg = error?.message || 'Erro desconhecido';
                setAutoSaveStatus(`⚠ Erro: ${errorMsg.substring(0, 30)}`);
                setTimeout(() => setAutoSaveStatus(''), 5000);
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, [teamScores, selectedStage, isInitialLoad]);

    const loadCircuits = async () => {
        try {
            let query = supabase
                .from('circuits')
                .select('*')
                .eq('active', true);

            if (companyId) {
                query = query.eq('company_id', companyId);
            }

            const { data, error } = await query.order('year', { ascending: false });

            if (error) throw error;

            const loadedCircuits = data.map((item: any) => ({
                id: item.id,
                name: item.name,
                year: item.year,
                active: item.active,
                fishCount: item.fish_count || 6, // IMPORTANTE: Incluir fish_count do banco
                createdAt: new Date(item.created_at),
            })) as Circuit[];

            setCircuits(loadedCircuits);
        } catch (error) {
            console.error('Erro ao carregar circuitos:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStages = async (circuitId: string) => {
        try {
            const { data, error } = await supabase
                .from('stages')
                .select('*')
                .eq('circuit_id', circuitId)
                .order('date', { ascending: true });

            if (error) throw error;

            const loadedStages = data.map((item: any) => ({
                id: item.id,
                companyId: item.company_id,
                circuitId: item.circuit_id,
                name: item.name,
                // Adiciona horário ao meio-dia para evitar problema de fuso horário
                date: new Date(item.date + 'T12:00:00'),
                location: item.location,
                registrationFee: item.registration_fee,
                imageUrl: item.image_url,
                status: item.status || 'active',
                createdAt: new Date(item.created_at),
            })) as Stage[];

            setStages(loadedStages);
        } catch (error) {
            console.error('Erro ao carregar etapas:', error);
        }
    };

    const loadTeamsAndResults = async (stageId: string) => {
        try {
            const { data: teamsData, error: teamsError } = await supabase
                .from('teams')
                .select('*')
                .eq('stage_id', stageId);

            if (teamsError) throw teamsError;

            const loadedTeams = teamsData.map((item: any) => ({
                id: item.id,
                stageId: item.stage_id,
                teamName: item.team_name,
                city: item.city,
                responsibleName: item.responsible_name,
                responsibleEmail: item.responsible_email || '',
                responsiblePhone: item.responsible_phone,
                responsiblePhone2: item.responsible_phone2,
                members: item.members,
                paid: item.paid,
                paymentMethod: item.payment_method,
                registeredAt: new Date(item.created_at),
            })) as Team[];

            setTeams(loadedTeams);

            const { data: resultsData } = await supabase
                .from('results')
                .select('*')
                .eq('stage_id', stageId);

            const scores: TeamScore[] = loadedTeams.map(team => {
                const existingResult = resultsData?.find((r: any) => r.team_id === team.id);

                if (existingResult) {
                    const fish: FishEntry[] = [];
                    for (let i = 0; i < fishCount; i++) {
                        fish.push({
                            measurement: existingResult.fish_measurements[i]?.toString() || '',
                            color: existingResult.fish_colors?.[i] || null,
                        });
                    }

                    return {
                        team,
                        fish,
                        average: existingResult.average_score || 0,
                        total: existingResult.fish_measurements.reduce((sum: number, m: number) => sum + (m || 0), 0),
                        biggestBlue: existingResult.biggest_blue || null,
                        biggestYellow: existingResult.biggest_yellow || null,
                    };
                }

                return {
                    team,
                    fish: Array(fishCount).fill(null).map(() => ({ measurement: '', color: null })),
                    average: 0,
                    total: 0,
                    biggestBlue: null,
                    biggestYellow: null,
                };
            });

            setTeamScores(scores);
        } catch (error) {
            console.error('Erro ao carregar equipes e resultados:', error);
        }
    };

    const updateFish = (teamIndex: number, fishIndex: number, field: 'measurement' | 'color', value: string | 'blue' | 'yellow' | null) => {
        const updated = [...teamScores];
        updated[teamIndex].fish[fishIndex][field] = value as any;

        const measurements = updated[teamIndex].fish.map(f => parseFloat(f.measurement) || 0);
        const total = measurements.reduce((sum, m) => sum + m, 0);
        updated[teamIndex].total = total;
        updated[teamIndex].average = total / fishCount;

        let biggestBlue: number | null = null;
        let biggestYellow: number | null = null;

        updated[teamIndex].fish.forEach((f, idx) => {
            const measure = measurements[idx];
            if (measure > 0) {
                if (f.color === 'blue' && (biggestBlue === null || measure > biggestBlue)) {
                    biggestBlue = measure;
                }
                if (f.color === 'yellow' && (biggestYellow === null || measure > biggestYellow)) {
                    biggestYellow = measure;
                }
            }
        });

        updated[teamIndex].biggestBlue = biggestBlue;
        updated[teamIndex].biggestYellow = biggestYellow;

        setTeamScores(updated);
    };

    // Salvamento silencioso para auto-save (sem alertas)
    const saveResultsSilently = async () => {
        try {
            console.log('🔄 Auto-save iniciado...');
            console.log('Etapa:', selectedStage);
            console.log('Total de equipes:', teamScores.length);

            // Validar que temos stage selecionado
            if (!selectedStage) {
                console.error('❌ Erro: Etapa não selecionada');
                throw new Error('Etapa não selecionada');
            }

            for (const score of teamScores) {
                const measurements = score.fish.map(f => parseFloat(f.measurement) || 0);
                const colors = score.fish.map(f => f.color);

                // Get correct company_id from stage or context
                const stage = stages.find(s => s.id === selectedStage);
                const targetCompanyId = stage?.companyId || companyId || currentUser?.id;

                const dataToSave = {
                    team_id: score.team.id,
                    stage_id: selectedStage,
                    fish_measurements: measurements,
                    fish_colors: colors,
                    average_score: score.average,
                    biggest_blue: score.biggestBlue,
                    biggest_yellow: score.biggestYellow,
                    company_id: targetCompanyId
                };

                console.log(`Salvando equipe ${score.team.teamName}`);

                // Verificar se já existe resultado para essa equipe nessa etapa
                const { data: existing } = await supabase
                    .from('results')
                    .select('id')
                    .eq('team_id', score.team.id)
                    .eq('stage_id', selectedStage)
                    .single();

                let error;
                if (existing) {
                    // Atualizar registro existente
                    const result = await supabase
                        .from('results')
                        .update(dataToSave)
                        .eq('team_id', score.team.id)
                        .eq('stage_id', selectedStage);
                    error = result.error;
                } else {
                    // Inserir novo registro
                    const result = await supabase
                        .from('results')
                        .insert(dataToSave);
                    error = result.error;
                }

                if (error) {
                    console.error('❌ Erro Supabase:', error);
                    throw error;
                }
            }

            console.log('✅ Auto-save concluído com sucesso');
        } catch (error) {
            console.error('❌ Erro ao salvar automaticamente:', error);
            throw error;
        }
    };

    const saveResults = async () => {
        setSaving(true);
        try {
            for (const score of teamScores) {
                const measurements = score.fish.map(f => parseFloat(f.measurement) || 0);
                const colors = score.fish.map(f => f.color);

                // Get correct company_id from stage or context
                const stage = stages.find(s => s.id === selectedStage);
                const targetCompanyId = stage?.companyId || companyId || currentUser?.id;

                const dataToSave = {
                    team_id: score.team.id,
                    stage_id: selectedStage,
                    fish_measurements: measurements,
                    fish_colors: colors,
                    average_score: score.average,
                    biggest_blue: score.biggestBlue,
                    biggest_yellow: score.biggestYellow,
                    company_id: targetCompanyId
                };

                // Verificar se já existe
                const { data: existing } = await supabase
                    .from('results')
                    .select('id')
                    .eq('team_id', score.team.id)
                    .eq('stage_id', selectedStage)
                    .single();

                let error;
                if (existing) {
                    const result = await supabase
                        .from('results')
                        .update(dataToSave)
                        .eq('team_id', score.team.id)
                        .eq('stage_id', selectedStage);
                    error = result.error;
                } else {
                    const result = await supabase
                        .from('results')
                        .insert(dataToSave);
                    error = result.error;
                }

                if (error) throw error;
            }

            alert('Resultados salvos com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar resultados:', error);
            alert('Erro ao salvar resultados');
        } finally {
            setSaving(false);
        }
    };

    const generateStageRanking = async () => {
        await saveResults();
        // Abre página de impressão em nova aba
        window.open(`/admin/impressoes/classificacao?stage_id=${selectedStage}`, '_blank');
    };

    const generateCircuitRanking = async () => {
        await saveResults();
        // Abre página de impressão da classificação geral em nova aba
        window.open(`/admin/impressoes/classificacao?circuit_id=${selectedCircuit}`, '_blank');
    };

    const printTeamList = () => {
        try {
            if (teams.length === 0) {
                alert('Nenhuma equipe inscrita nesta etapa!');
                return;
            }

            // PDF em A4 PAISAGEM
            const doc = new jsPDF('landscape', 'mm', 'a4');

            const stage = stages.find(s => s.id === selectedStage);
            const circuit = circuits.find(c => c.id === selectedCircuit);

            // Cabeçalho
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text('LISTA DE EQUIPES INSCRITAS', 148, 15, { align: 'center' });

            // Informações do circuito e etapa
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            if (circuit && stage) {
                doc.text(`${circuit.name} - ${stage.name}`, 148, 23, { align: 'center' });
                doc.text(`${stage.location} - ${stage.date.toLocaleDateString('pt-BR')}`, 148, 29, { align: 'center' });
            }

            // Total de equipes
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(`Total de Equipes: ${teams.length}`, 15, 38);

            // Preparar dados da tabela
            const tableData = teams.map((team, index) => {
                const fichaNumber = (index + 1).toString().padStart(2, '0');

                // ID da equipe - número sequencial de inscrição
                const teamId = (index + 1).toString();

                // Todos os participantes separados por vírgula
                const participantes = team.members?.map(m => m.name).join(', ') || '-';

                // Data de pagamento (se existir)
                const dataPagamento = (team as any).paymentDate
                    ? new Date((team as any).paymentDate).toLocaleDateString('pt-BR')
                    : '-';

                // Telefone
                const telefone = team.responsiblePhone || '-';

                return [
                    fichaNumber,
                    teamId,
                    team.teamName || 'Nome não informado',
                    participantes,
                    dataPagamento,
                    telefone,
                ];
            });

            // Gerar tabela em paisagem
            autoTable(doc, {
                head: [['Ficha', 'ID', 'Nome da Equipe', 'Participantes', 'Data Pgto', 'Tel']],
                body: tableData,
                startY: 43,
                styles: {
                    fontSize: 8,
                    cellPadding: 2,
                },
                headStyles: {
                    fillColor: [41, 128, 185],
                    fontStyle: 'bold',
                    halign: 'center',
                    fontSize: 9,
                },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 15 }, // Ficha
                    1: { halign: 'center', cellWidth: 12 }, // ID Equipe
                    2: { cellWidth: 48 }, // Nome da Equipe
                    3: { cellWidth: 115 }, // Participantes
                    4: { halign: 'center', cellWidth: 25 }, // Data Pagamento
                    5: { halign: 'center', cellWidth: 25 }, // Telefone
                },
                alternateRowStyles: { fillColor: [245, 245, 245] },
                margin: { left: 10, right: 10 },
            });

            // Rodapé
            const finalY = (doc as any).lastAutoTable?.finalY || 43;
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.text(
                `Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
                148,
                finalY + 10,
                { align: 'center' }
            );

            // Salvar
            // const fileName = `lista-inscricoes-${stage?.name || 'etapa'}-${new Date().toISOString().split('T')[0]}.pdf`;
            // doc.save(fileName);
            console.log('✅ PDF de Inscrições gerado, abrindo para impressão...');
            window.open(doc.output('bloburl'), '_blank');
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            alert('Erro ao gerar PDF. Verifique o console para detalhes.');
        }
    };

    const generateExcel = () => {
        try {
            if (teamScores.length === 0) {
                alert('Nenhuma equipe para exportar!');
                return;
            }

            // Criar workbook e worksheet
            const wb = XLSX.utils.book_new();

            // Criar dados dinamicamente baseado no fishCount
            const data = teamScores.map((score, index) => {
                const row: any = {
                    'Nº': index + 1,
                    'Equipe': score.team.teamName || 'Nome não informado',
                    'Integrantes': score.team.members?.map(m => `${m.name} (${m.nickname})`).join(', ') || '',
                };

                // Adicionar colunas dinamicamente para cada peixe
                for (let i = 1; i <= fishCount; i++) {
                    row[`Peixe ${i}`] = '';
                    row[`Cor ${i}`] = '';
                }

                row['Média'] = '';
                row['Total'] = '';

                return row;
            });

            const ws = XLSX.utils.json_to_sheet(data);

            // Calcular letras das colunas dinamicamente
            // A=Nº, B=Equipe, C=Integrantes
            // D=Peixe1, E=Cor1, F=Peixe2, G=Cor2, etc.
            const getColumnLetter = (colIndex: number): string => {
                let letter = '';
                while (colIndex >= 0) {
                    letter = String.fromCharCode((colIndex % 26) + 65) + letter;
                    colIndex = Math.floor(colIndex / 26) - 1;
                }
                return letter;
            };

            // Coluna da Média e Total
            const mediaCol = getColumnLetter(3 + (fishCount * 2)); // Após Nº, Equipe, Integrantes e todos os peixes
            const totalCol = getColumnLetter(3 + (fishCount * 2) + 1);

            // Adicionar fórmulas nas linhas de cada equipe
            teamScores.forEach((_, index) => {
                const rowNum = index + 2; // +2 porque linha 1 é header e começamos em 0

                // Construir fórmula do TOTAL dinamicamente
                const fishColumns: string[] = [];
                for (let i = 0; i < fishCount; i++) {
                    const colIndex = 3 + (i * 2); // 3 (primeiras colunas) + offset de 2 por peixe
                    fishColumns.push(`${getColumnLetter(colIndex)}${rowNum}`);
                }

                // Fórmula para TOTAL: soma de todas as colunas de peixes
                ws[`${totalCol}${rowNum}`] = {
                    f: fishColumns.join('+'),
                    t: 'n'  // tipo numérico
                };

                // Fórmula para MÉDIA: total / fishCount
                ws[`${mediaCol}${rowNum}`] = {
                    f: `${totalCol}${rowNum}/${fishCount}`,
                    t: 'n'  // tipo numérico
                };
            });

            // Definir larguras das colunas dinamicamente
            const colWidths: any[] = [
                { wch: 5 },   // Nº
                { wch: 25 },  // Equipe
                { wch: 40 },  // Integrantes
            ];

            // Adicionar larguras para cada peixe
            for (let i = 0; i < fishCount; i++) {
                colWidths.push({ wch: 10 }); // Peixe
                colWidths.push({ wch: 10 }); // Cor
            }

            colWidths.push({ wch: 12 }); // Média
            colWidths.push({ wch: 12 }); // Total

            ws['!cols'] = colWidths;

            XLSX.utils.book_append_sheet(wb, ws, 'Lançamento');
            XLSX.writeFile(wb, `lancamento-medidas-${new Date().toISOString().split('T')[0]}.xlsx`);

            console.log('✅ Planilha Excel (.xlsx) gerada com sucesso.');
        } catch (error) {
            console.error('Erro ao gerar Excel:', error);
            alert('Erro ao gerar Excel. Verifique o console para detalhes.');
        }
    };

    const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = e.target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    const bstr = evt.target?.result;
                    const wb = XLSX.read(bstr, { type: 'binary' });
                    const wsname = wb.SheetNames[0];
                    const ws = wb.Sheets[wsname];
                    const data = XLSX.utils.sheet_to_json(ws);

                    const updated = [...teamScores];
                    data.forEach((row: any, index: number) => {
                        if (index < updated.length) {
                            for (let i = 1; i <= fishCount; i++) {
                                const measurement = row[`Peixe ${i}`] || '';
                                const colorRaw = row[`Cor ${i}`];

                                // Reconhecer cores: azul, blue, az, amarelo, yellow, am
                                let color: 'blue' | 'yellow' | null = null;
                                if (colorRaw) {
                                    const colorLower = colorRaw.toString().toLowerCase().trim();
                                    if (colorLower === 'azul' || colorLower === 'blue' || colorLower === 'az') {
                                        color = 'blue';
                                    } else if (colorLower === 'amarelo' || colorLower === 'yellow' || colorLower === 'am') {
                                        color = 'yellow';
                                    }
                                }

                                updated[index].fish[i - 1] = {
                                    measurement: measurement.toString(),
                                    color: color,
                                };
                            }

                            const measurements = updated[index].fish.map(f => parseFloat(f.measurement) || 0);
                            const total = measurements.reduce((sum, m) => sum + m, 0);
                            updated[index].total = total;
                            updated[index].average = total / fishCount;

                            let biggestBlue: number | null = null;
                            let biggestYellow: number | null = null;
                            updated[index].fish.forEach((f, idx) => {
                                const measure = measurements[idx];
                                if (measure > 0) {
                                    if (f.color === 'blue' && (biggestBlue === null || measure > biggestBlue)) {
                                        biggestBlue = measure;
                                    }
                                    if (f.color === 'yellow' && (biggestYellow === null || measure > biggestYellow)) {
                                        biggestYellow = measure;
                                    }
                                }
                            });
                            updated[index].biggestBlue = biggestBlue;
                            updated[index].biggestYellow = biggestYellow;
                        }
                    });

                    setTeamScores(updated);
                    alert('Planilha importada com sucesso!');
                } catch (error) {
                    console.error('Erro ao processar planilha:', error);
                    alert('Erro ao processar planilha. Verifique o formato.');
                }
            };
            reader.readAsBinaryString(file);
        } catch (error) {
            console.error('Erro ao importar Excel:', error);
            alert('Erro ao importar planilha.');
        }
    };

    // Função auxiliar para renderizar ficha em branco
    const renderBlankForm = (doc: any, fichaNumber: number, x: number, y: number, circuit: Circuit | undefined, stage: Stage | undefined, logoUrl: string | null, fishCount: number) => {
        const FICHA_WIDTH = 140;
        const FICHA_HEIGHT = 200;

        // Área para logo (canto superior esquerdo)
        if (logoUrl) {
            try {
                // Detectar formato da imagem a partir do data URL
                let format = 'PNG';
                if (logoUrl.includes('image/jpeg') || logoUrl.includes('image/jpg')) {
                    format = 'JPEG';
                }
                console.log('📸 Adicionando logo ao PDF, formato:', format);
                doc.addImage(logoUrl, format, x + 5, y + 5, 35, 25, '', 'FAST');
                console.log('✅ Logo adicionado com sucesso!');
            } catch (error) {
                console.error('❌ Erro ao adicionar logo ao PDF:', error);
            }
        } else {
            console.log('⚠️ Nenhum logo disponível para esta ficha');
        }

        // Número da ficha (canto superior direito)
        doc.setFillColor(220, 220, 220);
        doc.rect(x + FICHA_WIDTH - 35, y + 5, 30, 30, 'F');
        doc.setDrawColor(0);
        doc.rect(x + FICHA_WIDTH - 35, y + 5, 30, 30);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('FICHA', x + FICHA_WIDTH - 20, y + 15, { align: 'center' });
        doc.setFontSize(20);
        doc.text(fichaNumber.toString().padStart(2, '0'), x + FICHA_WIDTH - 20, y + 28, { align: 'center' });

        // Informações do circuito e etapa
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        let currentY = y + 40;
        if (circuit) {
            doc.text(circuit.name.toUpperCase(), x + 5, currentY);
            currentY += 5;
        }
        if (stage) {
            doc.text(`${stage.name} - ${stage.date.toLocaleDateString('pt-BR')}`, x + 5, currentY);
            currentY += 8;
        }

        // Dados da equipe (EM BRANCO - para preenchimento manual)
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('EQUIPE: ______________________________________', x + 5, currentY);
        currentY += 4;
        doc.text('PESCADORES: __________________________________', x + 5, currentY);
        currentY += 4;
        doc.text('CIDADE: ______________________________________', x + 5, currentY);
        currentY += 8;

        // Tabela de peixes (fishCount linhas)
        const tableStartY = currentY;
        const rowHeight = 12;

        doc.setFontSize(9);
        for (let i = 1; i <= fishCount; i++) {
            const rowY = tableStartY + ((i - 1) * rowHeight);

            // Número do peixe
            doc.setFont('helvetica', 'bold');
            doc.text(`${i}º`, x + 10, rowY + 8);

            // Campo de medida
            doc.rect(x + 20, rowY, 50, rowHeight);

            // Checkbox Azul
            doc.rect(x + 75, rowY + 3, 6, 6);
            doc.setFont('helvetica', 'normal');
            doc.text('AZUL', x + 83, rowY + 8);

            // Checkbox Amarelo
            doc.rect(x + 105, rowY + 3, 6, 6);
            doc.text('AMARELO', x + 113, rowY + 8);
        }

        // Total
        const totalY = tableStartY + (fishCount * rowHeight) + 5;
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL', x + 10, totalY + 5);
        doc.rect(x + 30, totalY, 40, 10);

        // Assinaturas (bem embaixo da ficha, fonte 11pt)
        const sigY = y + FICHA_HEIGHT - 20; // 20pt de margem do fundo
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text('Ass. Equipe: _________________________________', x + 5, sigY);
        doc.text('Ass. Fiscal: _________________________________', x + 5, sigY + 10);


        // Borda da ficha
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.rect(x, y, FICHA_WIDTH, FICHA_HEIGHT);
    };

    // Função auxiliar para renderizar ficha com dados da equipe
    const renderTeamForm = (doc: any, fichaNumber: number, team: Team, x: number, y: number, circuit: Circuit | undefined, stage: Stage | undefined, logoUrl: string | null) => {
        const FICHA_WIDTH = 140;
        const FICHA_HEIGHT = 200;

        // Área para logo
        if (logoUrl) {
            try {
                // Detectar formato da imagem a partir do data URL
                let format = 'PNG';
                if (logoUrl.includes('image/jpeg') || logoUrl.includes('image/jpg')) {
                    format = 'JPEG';
                }
                doc.addImage(logoUrl, format, x + 5, y + 5, 35, 25, '', 'FAST');
            } catch (error) {
                console.error('❌ Erro ao adicionar logo ao PDF:', error);
            }
        }

        // Número da ficha
        doc.setFillColor(220, 220, 220);
        doc.rect(x + FICHA_WIDTH - 35, y + 5, 30, 30, 'F');
        doc.setDrawColor(0);
        doc.rect(x + FICHA_WIDTH - 35, y + 5, 30, 30);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('FICHA', x + FICHA_WIDTH - 20, y + 15, { align: 'center' });
        doc.setFontSize(20);
        doc.text(fichaNumber.toString().padStart(2, '0'), x + FICHA_WIDTH - 20, y + 28, { align: 'center' });

        // Informações do circuito e etapa
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        let currentY = y + 40;
        if (circuit) {
            doc.text(circuit.name.toUpperCase(), x + 5, currentY);
            currentY += 5;
        }
        if (stage) {
            doc.text(`${stage.name} - ${stage.date.toLocaleDateString('pt-BR')}`, x + 5, currentY);
            currentY += 8;
        }

        // Dados da equipe
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`EQUIPE: ${fichaNumber} - ${team.teamName}`, x + 5, currentY);
        currentY += 4;

        const pescadores = team.members?.map((m: any) => m.nickname || m.name).join(', ') || 'Não informado';
        doc.text(`PESCADORES: ${pescadores}`, x + 5, currentY);
        currentY += 4;
        doc.text(`CIDADE: ${team.city}`, x + 5, currentY);
        currentY += 8;

        // Tabela de peixes (CORRIGIDO - estava faltando!)
        const tableStartY = currentY;
        const rowHeight = 12;
        const teamFishCount = circuit?.fishCount || 6;

        doc.setFontSize(9);
        for (let i = 1; i <= teamFishCount; i++) {
            const rowY = tableStartY + ((i - 1) * rowHeight);

            // Número do peixe
            doc.setFont('helvetica', 'bold');
            doc.text(`${i}º`, x + 10, rowY + 8);

            // Campo de medida
            doc.rect(x + 20, rowY, 50, rowHeight);

            // Checkbox Azul
            doc.rect(x + 75, rowY + 3, 6, 6);
            doc.setFont('helvetica', 'normal');
            doc.text('AZUL', x + 83, rowY + 8);

            // Checkbox Amarelo
            doc.rect(x + 105, rowY + 3, 6, 6);
            doc.text('AMARELO', x + 113, rowY + 8);
        }

        // Total
        const totalY = tableStartY + (teamFishCount * rowHeight) + 5;
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL', x + 10, totalY + 5);
        doc.rect(x + 30, totalY, 40, 10);

        // Assinaturas
        const sigY = y + FICHA_HEIGHT - 20;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text('Ass. Equipe: _________________________________', x + 5, sigY);
        doc.text('Ass. Fiscal: _________________________________', x + 5, sigY + 10);

        // Borda
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.rect(x, y, FICHA_WIDTH, FICHA_HEIGHT);
    };

    const printForms = async () => {
        try {
            if (teams.length === 0) {
                alert('Nenhuma equipe inscrita nesta etapa!');
                return;
            }

            // Buscar logo ativo da etapa/empresa
            const stageForLogo = stages.find((s) => s.id === selectedStage);
            const targetCompanyId = (stageForLogo as any)?.companyId || (stageForLogo as any)?.company_id || (currentUser?.role === 'company' ? currentUser?.id : null);

                        let logoData: { image_url?: string } | null = null;
            if (targetCompanyId) {
                const { data: settings } = await supabase
                    .from('company_settings')
                    .select('logo_url')
                    .eq('company_id', targetCompanyId)
                    .maybeSingle();

                if (settings?.logo_url) {
                    logoData = { image_url: settings.logo_url };
                }
            }

            if (!logoData?.image_url) {
                const { data: globalSettings } = await supabase
                    .from('company_settings')
                    .select('logo_url')
                    .not('logo_url', 'is', null)
                    .limit(1)
                    .maybeSingle();
                if (globalSettings?.logo_url) {
                    logoData = { image_url: globalSettings.logo_url };
                }
            }
            console.log('🖼️ Logo query result:', logoData);

            let logoBase64: string | null = null;

            if (logoData?.image_url) {
                try {
                    // Converter URL da imagem para base64 para funcionar com jsPDF
                    const response = await fetch(logoData.image_url);
                    const blob = await response.blob();
                    logoBase64 = await new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.readAsDataURL(blob);
                    });
                    console.log('🖼️ Logo convertido para base64 com sucesso');
                } catch (error) {
                    console.error('❌ Erro ao converter logo para base64:', error);
                }
            }

            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            const circuit = circuits.find((c: any) => c.id === selectedCircuit);
            const stage = stages.find((s: any) => s.id === selectedStage);

            // Total de fichas = equipes + 5 fichas em branco
            const totalFichas = teams.length + 5;

            for (let i = 0; i < totalFichas; i++) {
                const fichaNumber = i + 1;
                const isBlank = i >= teams.length;
                const team = isBlank ? null : teams[i];

                // Posição x (2 fichas por página)
                const isLeftSide = (i % 2) === 0;
                const x = isLeftSide ? 5 : 152;
                const y = 5;

                // Adicionar nova página se for o lado esquerdo e não for a primeira ficha
                if (isLeftSide && i > 0) {
                    doc.addPage();
                }

                // Renderizar ficha
                if (isBlank || !team) {
                    renderBlankForm(doc, fichaNumber, x, y, circuit, stage, logoBase64, circuit?.fishCount || 6);
                } else {
                    renderTeamForm(doc, fichaNumber, team, x, y, circuit, stage, logoBase64);
                }
            }

            console.log('✅ PDF das Fichas gerado, abrindo para impressão...');
            window.open(doc.output('bloburl'), '_blank');
        } catch (error) {
            console.error('Erro ao gerar fichas:', error);
            alert('Erro ao gerar fichas. Verifique o console para detalhes.');
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <LoadingSpinner size="lg" />
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div>
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Lançamento de Medidas</h1>
                    {autoSaveStatus && (
                        <span className={`text-sm px-3 py-1 rounded-full ${autoSaveStatus.includes('✓') ? 'bg-green-100 text-green-700' :
                            autoSaveStatus.includes('⚠') ? 'bg-red-100 text-red-700' :
                                'bg-blue-100 text-blue-700'
                            }`}>
                            {autoSaveStatus}
                        </span>
                    )}
                </div>

                <Card className="mb-6">
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Circuito
                            </label>
                            <select
                                value={selectedCircuit}
                                onChange={(e) => {
                                    setSelectedCircuit(e.target.value);
                                    setSelectedStage('');
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean-500"
                            >
                                <option value="">Selecione um circuito</option>
                                {circuits.map(circuit => (
                                    <option key={circuit.id} value={circuit.id}>
                                        {circuit.name} - {circuit.year}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Etapa
                            </label>
                            <select
                                value={selectedStage}
                                onChange={(e) => setSelectedStage(e.target.value)}
                                disabled={!selectedCircuit}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean-500 disabled:bg-gray-100"
                            >
                                <option value="">Selecione uma etapa</option>
                                {stages.map(stage => (
                                    <option key={stage.id} value={stage.id}>
                                        {stage.name} - {stage.location}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {selectedStage && (
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="primary"
                                onClick={saveResults}
                                loading={saving}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Salvar Resultados
                            </Button>
                            <Button
                                variant="primary"
                                onClick={generateStageRanking}
                                className="bg-fishing-600 hover:bg-fishing-700"
                            >
                                <BarChart className="w-4 h-4 mr-2" />
                                Classificação Etapa
                            </Button>
                            <Button
                                variant="primary"
                                onClick={generateCircuitRanking}
                                className="bg-ocean-600 hover:bg-ocean-700"
                            >
                                <BarChart className="w-4 h-4 mr-2" />
                                Classificação Geral
                            </Button>
                            <Button
                                variant="outline"
                                onClick={printForms}
                            >
                                <Printer className="w-4 h-4 mr-2" />
                                Fichas
                            </Button>
                            <Button
                                variant="outline"
                                onClick={printTeamList}
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                Inscrições (PDF)
                            </Button>
                            <Button
                                variant="outline"
                                onClick={generateExcel}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Gerar Excel
                            </Button>
                            <label className="cursor-pointer">
                                <input
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleExcelUpload}
                                    className="hidden"
                                />
                                <div className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                                    <Upload className="w-4 h-4" />
                                    Upload Excel
                                </div>
                            </label>
                        </div>
                    )}
                </Card>

                {selectedStage && teamScores.length > 0 && (
                    <Card>
                        <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-2 py-2 text-left">Nº</th>
                                        <th className="px-2 py-2 text-left">Equipe</th>
                                        {Array.from({ length: fishCount }).map((_, i) => (
                                            <th key={i} className="px-2 py-2 text-center" colSpan={2}>Peixe {i + 1}</th>
                                        ))}
                                        <th className="px-2 py-2 text-center">Média</th>
                                        <th className="px-2 py-2 text-center">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teamScores.map((score, teamIdx) => (
                                        <tr key={score.team.id} className="border-t">
                                            <td className="px-2 py-2">{teamIdx + 1}</td>
                                            <td className="px-2 py-2">
                                                <div className="font-semibold">{score.team.teamName}</div>
                                                <div className="text-xs text-gray-600">
                                                    {score.team.members?.map(m => m.nickname).join('/') || ''}
                                                </div>
                                            </td>
                                            {score.fish.map((fish, fishIdx) => (
                                                <React.Fragment key={fishIdx}>
                                                    <td className="px-1 py-2">
                                                        <input
                                                            type="number"
                                                            value={fish.measurement}
                                                            onChange={(e) => updateFish(teamIdx, fishIdx, 'measurement', e.target.value)}
                                                            className="w-16 px-2 py-1 border rounded text-center"
                                                            placeholder="0"
                                                            step="0.1"
                                                        />
                                                    </td>
                                                    <td className="px-1 py-2">
                                                        <div className="flex gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => updateFish(teamIdx, fishIdx, 'color', fish.color === 'blue' ? null : 'blue')}
                                                                className={`px-2 py-1 text-xs rounded border transition-colors ${fish.color === 'blue'
                                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                                    : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'
                                                                    }`}
                                                            >
                                                                Az
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => updateFish(teamIdx, fishIdx, 'color', fish.color === 'yellow' ? null : 'yellow')}
                                                                className={`px-2 py-1 text-xs rounded border transition-colors ${fish.color === 'yellow'
                                                                    ? 'bg-yellow-500 text-white border-yellow-500'
                                                                    : 'bg-white text-yellow-600 border-yellow-300 hover:bg-yellow-50'
                                                                    }`}
                                                            >
                                                                Am
                                                            </button>
                                                        </div>
                                                    </td>
                                                </React.Fragment>
                                            ))}
                                            <td className="px-2 py-2 text-center font-semibold">
                                                {score.average.toFixed(1)}
                                            </td>
                                            <td className="px-2 py-2 text-center font-semibold">
                                                {score.total.toFixed(1)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {selectedStage && teamScores.length === 0 && (
                    <Card>
                        <p className="text-center text-gray-600">
                            Nenhuma equipe inscrita nesta etapa.
                        </p>
                    </Card>
                )}
            </div>
        </AdminLayout>
    );
}

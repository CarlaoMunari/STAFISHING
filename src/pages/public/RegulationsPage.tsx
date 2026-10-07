import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Circuit } from '@/types';
import { Navbar } from '@/components/public/Navbar';
import { Footer } from '@/components/public/Footer';
import { FileText } from 'lucide-react';

export function RegulationsPage() {
    const { companyName } = useParams();
    const [circuits, setCircuits] = useState<Circuit[]>([]);
    const [selectedCircuit, setSelectedCircuit] = useState<string>('');
    const [regulation, setRegulation] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCompanyAndCircuits();
    }, [companyName]);

    useEffect(() => {
        if (selectedCircuit) {
            loadRegulation();
        }
    }, [selectedCircuit]);

    const loadCompanyAndCircuits = async () => {
        let currentCompanyId: string | null = null;

        // Resolver empresa da STA FISHING
        if (companyName) {
            const { data: company } = await supabase
                .from('users')
                .select('id')
                .ilike('slug', companyName.trim())
                .maybeSingle();

            if (company) {
                currentCompanyId = company.id;
            } else {
                console.error('Empresa não encontrada:', companyName);
                return;
            }
        } else {
            const { data: masterComp } = await supabase
                .from('users')
                .select('id')
                .eq('email', 'sta@stafishing.com.br')
                .maybeSingle();
            if (masterComp) {
                currentCompanyId = masterComp.id;
            }
        }

        // Buscar circuitos filtrados por company_id
        let query = supabase
            .from('circuits')
            .select('*')
            .eq('active', true);

        if (currentCompanyId) {
            query = query.eq('company_id', currentCompanyId);
        }

        const { data } = await query.order('year', { ascending: false });

        if (data) {
            const circuits = data.map((item: any) => ({
                id: item.id,
                name: item.name,
                year: item.year,
                description: item.description,
                active: item.active,
                regulation: item.regulation,
                createdAt: new Date(item.created_at),
            }));
            setCircuits(circuits);
            if (circuits.length > 0) {
                setSelectedCircuit(circuits[0].id);
            }
        }
    };

    const loadRegulation = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('circuits')
            .select('regulation')
            .eq('id', selectedCircuit)
            .single();

        if (data) {
            setRegulation(data.regulation || '');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <div className="flex-grow container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="w-8 h-8 text-blue-600" />
                        Regulamento
                    </h1>

                    <div className="mt-4 md:mt-0">
                        <select
                            value={selectedCircuit}
                            onChange={(e) => setSelectedCircuit(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                        >
                            {circuits.map(circuit => (
                                <option key={circuit.id} value={circuit.id}>
                                    {circuit.name} - {circuit.year}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100 min-h-[500px]">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : regulation ? (
                        <div
                            className="regulation-content prose max-w-none text-gray-700"
                            dangerouslySetInnerHTML={{ __html: regulation }} // Assuming regulation is stored as HTML
                        />
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">Regulamento não disponível para este circuito.</p>
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
}

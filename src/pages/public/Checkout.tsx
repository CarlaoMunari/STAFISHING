import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { parseLocalDate } from "../../lib/dateUtils";
import { Stage } from "../../types";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { Navbar } from "../../components/public/Navbar";
import { Copy, Check, Upload, AlertCircle, CheckCircle2, DollarSign } from "lucide-react";

interface PaymentSettings {
    pixKey: string;
    pixKeyType: string;
    pixBeneficiaryName: string;
    paymentInstructions: string;
    mpEnabled: boolean;
}

export function Checkout() {
    const { companyName } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const urlTeamId = searchParams.get("teamId");
    const urlStageId = searchParams.get("stageId");

    const state = location.state as { team: any; stage: Stage } | null;

    const [team, setTeam] = useState<any>(state?.team || null);
    const [stage, setStage] = useState<Stage | null>(state?.stage || null);

    const [settings, setSettings] = useState<PaymentSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [copiedKey, setCopiedKey] = useState(false);
    const [paymentCreated, setPaymentCreated] = useState(false);
    const [gpsAccessKey, setGpsAccessKey] = useState<string | null>(null);
    const [alreadyPaid, setAlreadyPaid] = useState(false);
    const [companySlug, setCompanySlug] = useState<string | null>(null);

    useEffect(() => {
        initCheckout();
    }, [urlTeamId, urlStageId]);

    const initCheckout = async () => {
        setLoading(true);
        try {
            let activeTeam = team;
            let activeStage = stage;

            // Fetch team from DB if missing in state
            if (!activeTeam && urlTeamId) {
                const { data: tData } = await supabase
                    .from("teams")
                    .select("*")
                    .eq("id", urlTeamId)
                    .maybeSingle();

                if (tData) {
                    activeTeam = {
                        id: tData.id,
                        stageId: tData.stage_id,
                        teamName: tData.team_name,
                        city: tData.city,
                        responsibleName: tData.responsible_name,
                        responsibleEmail: tData.responsible_email,
                        responsiblePhone: tData.responsible_phone,
                        responsiblePhone2: tData.responsible_phone2,
                        members: tData.members,
                        companyId: tData.company_id,
                        paid: tData.paid,
                    };
                    setTeam(activeTeam);
                }
            }

            // Fetch stage from DB if missing in state
            const targetStageId = activeStage?.id || urlStageId || activeTeam?.stageId;
            if (!activeStage && targetStageId) {
                const { data: sData } = await supabase
                    .from("stages")
                    .select("*")
                    .eq("id", targetStageId)
                    .maybeSingle();

                if (sData) {
                    activeStage = {
                        id: sData.id,
                        circuitId: sData.circuit_id,
                        companyId: sData.company_id,
                        name: sData.name,
                        date: parseLocalDate(sData.date),
                        location: sData.location,
                        registrationFee: sData.registration_fee || 0,
                        imageUrl: sData.image_url,
                        createdAt: parseLocalDate(sData.created_at),
                    } as Stage;
                    setStage(activeStage);
                }
            }

            if (!activeTeam || !activeStage) {
                setLoading(false);
                return;
            }

            let targetCompanyId = activeStage.companyId || (activeStage as any).company_id;

            if (!targetCompanyId && companyName && companyName !== "checkout") {
                const { data: company } = await supabase
                    .from("users")
                    .select("id")
                    .eq("slug", companyName)
                    .eq("role", "company")
                    .maybeSingle();

                if (company) targetCompanyId = company.id;
            }

            if (targetCompanyId) {
                const { data: companyData } = await supabase
                    .from("users")
                    .select("slug")
                    .eq("id", targetCompanyId)
                    .maybeSingle();

                if (companyData) {
                    setCompanySlug(companyData.slug);
                    localStorage.setItem("last_company_slug", companyData.slug);
                    window.dispatchEvent(new Event("company_slug_updated"));
                }
            }

            // Check if team is already paid
            const { data: existingPayment } = await supabase
                .from("payments")
                .select("status")
                .eq("team_id", activeTeam.id)
                .eq("stage_id", activeStage.id)
                .maybeSingle();

            if (existingPayment && existingPayment.status === "paid") {
                const { data: gpsKeyData } = await supabase
                    .from("gps_access_keys")
                    .select("access_key")
                    .eq("team_id", activeTeam.id)
                    .maybeSingle();

                if (gpsKeyData) {
                    setGpsAccessKey(gpsKeyData.access_key);
                }

                setAlreadyPaid(true);
                setLoading(false);
                return;
            }

            // Check exempt registration
            const { data: teamData } = await supabase
                .from("teams")
                .select("exempt_registration")
                .eq("id", activeTeam.id)
                .maybeSingle();

            if (teamData?.exempt_registration) {
                const { data: existingAnyPayment } = await supabase
                    .from("payments")
                    .select("id")
                    .eq("team_id", activeTeam.id)
                    .eq("stage_id", activeStage.id)
                    .maybeSingle();

                if (!existingAnyPayment && targetCompanyId) {
                    await supabase.from("payments").insert({
                        team_id: activeTeam.id,
                        stage_id: activeStage.id,
                        company_id: targetCompanyId,
                        amount: 0,
                        payment_method: "direct",
                        status: "paid",
                        paid_at: new Date().toISOString()
                    });

                    await supabase.from("teams").update({ paid: true }).eq("id", activeTeam.id);
                }

                setAlreadyPaid(true);
                setLoading(false);
                return;
            }

            // Fetch payment settings
            if (targetCompanyId) {
                const { data: companySettings } = await supabase
                    .from("company_settings")
                    .select("pix_key, pix_key_type, pix_beneficiary_name, payment_instructions, mp_enabled")
                    .eq("company_id", targetCompanyId)
                    .maybeSingle();

                if (companySettings) {
                    setSettings({
                        pixKey: companySettings.pix_key || "",
                        pixKeyType: companySettings.pix_key_type || "",
                        pixBeneficiaryName: companySettings.pix_beneficiary_name || "",
                        paymentInstructions: companySettings.payment_instructions || "",
                        mpEnabled: companySettings.mp_enabled || false
                    });
                }
            }
        } catch (error) {
            console.error("Erro ao inicializar checkout:", error);
        } finally {
            setLoading(false);
        }
    };

    const copyPixKey = () => {
        if (settings?.pixKey) {
            navigator.clipboard.writeText(settings.pixKey);
            setCopiedKey(true);
            setTimeout(() => setCopiedKey(false), 2000);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert("Arquivo muito grande. Máximo 5MB");
                return;
            }
            setProofFile(file);
        }
    };

    const handleSubmitPayment = async () => {
        if (!proofFile || !team || !stage) {
            alert("Por favor, envie o comprovante de pagamento");
            return;
        }

        setUploading(true);
        try {
            let targetCompanyId = stage.companyId || (stage as any).company_id;

            if (!targetCompanyId && companyName) {
                const { data: company } = await supabase
                    .from("users")
                    .select("id")
                    .eq("slug", companyName)
                    .eq("role", "company")
                    .maybeSingle();

                if (company) targetCompanyId = company.id;
            }

            if (!targetCompanyId) {
                throw new Error("Empresa não encontrada");
            }

            const fileExt = proofFile.name.split(".").pop();
            const safeExt = fileExt ? fileExt.replace(/[^a-zA-Z0-9]/g, "") : "jpg";
            const fileName = `${team.id}-${Date.now()}.${safeExt}`;
            const storagePath = `payment-proofs/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from("images")
                .upload(storagePath, proofFile);

            if (uploadError) {
                throw new Error(`Falha no upload do arquivo: ${uploadError.message}`);
            }

            const { data: publicUrlData } = supabase.storage
                .from("images")
                .getPublicUrl(storagePath);

            const proofUrl = publicUrlData.publicUrl;

            const { data: existingPay } = await supabase
                .from("payments")
                .select("id")
                .eq("team_id", team.id)
                .eq("stage_id", stage.id)
                .maybeSingle();

            const paymentPayload = {
                team_id: team.id,
                stage_id: stage.id,
                company_id: targetCompanyId,
                amount: stage.registrationFee,
                payment_method: "pix_manual",
                status: "pending",
                proof_url: proofUrl,
                proof_uploaded_at: new Date().toISOString()
            };

            let paymentError;
            if (existingPay) {
                const { error } = await supabase
                    .from("payments")
                    .update(paymentPayload)
                    .eq("id", existingPay.id);
                paymentError = error;
            } else {
                const { error } = await supabase
                    .from("payments")
                    .insert(paymentPayload);
                paymentError = error;
            }

            if (paymentError) {
                throw new Error(`Falha ao registrar pagamento no banco: ${paymentError.message}`);
            }

            setPaymentCreated(true);
        } catch (error: any) {
            console.error("Erro ao enviar comprovante:", error);
            alert(error.message || "Erro ao processar o envio do comprovante.");
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <LoadingSpinner />
            </div>
        );
    }

    if (!team || !stage) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <Card className="max-w-md w-full p-6 text-center bg-slate-900 border border-slate-800 text-white space-y-4">
                    <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
                    <h2 className="text-xl font-bold">Identificação da Inscrição</h2>
                    <p className="text-xs text-gray-400">
                        Não foi possível encontrar a equipe para checkout. Por favor, acesse a área do pescador ou refaça a inscrição.
                    </p>
                    <Button onClick={() => navigate(companySlug ? `/${companySlug}` : "/")} className="w-full bg-blue-600">
                        Voltar para o Início
                    </Button>
                </Card>
            </div>
        );
    }

    if (alreadyPaid) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 text-white">
                <Card className="max-w-md w-full p-8 text-center bg-slate-900 border border-slate-800 space-y-4">
                    <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
                    <h2 className="text-2xl font-bold">Inscrição Confirmada!</h2>
                    <p className="text-xs text-gray-400">
                        Sua inscrição para a etapa <strong>{stage.name}</strong> já está confirmada e paga.
                    </p>
                    {gpsAccessKey && (
                        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                            <span className="text-[10px] font-bold text-cyan-400 uppercase block">Sua Chave GPS</span>
                            <span className="text-lg font-mono font-extrabold tracking-wider">{gpsAccessKey}</span>
                        </div>
                    )}
                    <Button onClick={() => navigate(companySlug ? `/${companySlug}` : "/")} className="w-full bg-blue-600">
                        Voltar para o Início
                    </Button>
                </Card>
            </div>
        );
    }

    if (paymentCreated) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 text-white">
                <Card className="max-w-md w-full p-8 text-center bg-slate-900 border border-slate-800 space-y-4">
                    <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
                    <h2 className="text-2xl font-bold">Inscrição Concluída!</h2>
                    <p className="text-xs text-gray-400">
                        Sua inscrição para a equipe <strong>{team.teamName}</strong> foi registrada com sucesso com o método de pagamento padrão.
                    </p>
                    <div className="bg-slate-800 p-4 rounded-xl text-xs text-gray-300">
                        A comissão organizadora irá validar sua inscrição em breve.
                    </div>
                    <Button onClick={() => navigate(companySlug ? `/${companySlug}` : "/")} className="w-full bg-blue-600">
                        Ir para a Página Inicial
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col pb-mobile-nav">
            <Navbar />

            <div className="container mx-auto px-4 py-8 max-w-3xl flex-grow space-y-6">
                {/* Event Summary Card */}
                <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-3">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                        Resumo do Pagamento
                    </span>
                    <h1 className="text-2xl font-black text-white">{stage.name}</h1>
                    <p className="text-xs text-blue-200">
                        Equipe: <strong>{team.teamName}</strong> • {team.city}
                    </p>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-xs text-gray-400">Valor da Inscrição:</span>
                        <span className="text-2xl font-mono font-black text-cyan-400">
                            R$ {stage.registrationFee.toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* Direct Payment Notice / PIX */}
                <Card className="p-6 bg-slate-900 border border-slate-800 space-y-6">
                    <div>
                        <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                            <DollarSign className="w-5 h-5 text-emerald-400" />
                            Método de Pagamento: Direct / PIX
                        </h2>
                        <p className="text-xs text-gray-400 mt-1">
                            Sua equipe foi registrada com sucesso! Se desejar pagar via PIX agora, utilize os dados abaixo e envie o comprovante.
                        </p>
                    </div>

                    {settings?.pixKey && (
                        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 space-y-3">
                            <div className="flex justify-between items-center">
                                <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Chave PIX</span>
                                    <span className="font-mono text-sm font-bold text-cyan-300">{settings.pixKey}</span>
                                </div>
                                <Button onClick={copyPixKey} variant="outline" className="text-xs py-1 px-3 border-slate-600 text-white">
                                    {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                    {copiedKey ? "Copiado!" : "Copiar"}
                                </Button>
                            </div>
                            {settings.pixBeneficiaryName && (
                                <p className="text-xs text-gray-400">Beneficiário: {settings.pixBeneficiaryName}</p>
                            )}
                        </div>
                    )}

                    {/* Upload Proof or Complete */}
                    <div className="space-y-4 pt-4 border-t border-slate-800">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                                Enviar Comprovante PIX (Opcional)
                            </label>
                            <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={handleFileChange}
                                className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                            />
                        </div>

                        {proofFile && (
                            <Button
                                onClick={handleSubmitPayment}
                                loading={uploading}
                                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-bold rounded-xl shadow-lg text-sm"
                            >
                                <Upload className="w-4 h-4 mr-2" /> Enviar Comprovante
                            </Button>
                        )}

                        <Button
                            onClick={async () => {
                                try {
                                    const targetCompanyId = stage.companyId || (stage as any).company_id;
                                    const { data: existingPay } = await supabase
                                        .from("payments")
                                        .select("id")
                                        .eq("team_id", team.id)
                                        .eq("stage_id", stage.id)
                                        .maybeSingle();

                                    const paymentPayload = {
                                        team_id: team.id,
                                        stage_id: stage.id,
                                        company_id: targetCompanyId,
                                        amount: stage.registrationFee,
                                        payment_method: "direct",
                                        status: "pending"
                                    };

                                    if (existingPay) {
                                        await supabase.from("payments").update(paymentPayload).eq("id", existingPay.id);
                                    } else {
                                        await supabase.from("payments").insert(paymentPayload);
                                    }
                                } catch (e) {
                                    console.error("Direct payment insert:", e);
                                }
                                setPaymentCreated(true);
                            }}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 font-bold rounded-xl text-sm"
                        >
                            Finalizar Inscrição (Pagamento Direct)
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}


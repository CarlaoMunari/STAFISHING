import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import {  } from 'lucide-react';

export function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await signIn(email, password);

            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data: userProfile } = await supabase
                    .from("users")
                    .select("role")
                    .eq("id", session.user.id)
                    .single();

                if (userProfile?.role === "captain") {
                    navigate("/pescador");
                } else {
                    navigate("/admin");
                }
            } else {
                navigate("/admin");
            }
        } catch (err: any) {
            console.error("Login error:", err);
            setError(err.message || "E-mail ou senha incorretos.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex flex-col justify-center items-center px-4 py-8 safe-top">
            <Card className="w-full max-w-md bg-slate-900/90 backdrop-blur-2xl border border-slate-800 text-white p-6 md:p-8 shadow-2xl space-y-6">
                {/* Header Logo */}
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 mb-3 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
                        <img src="/sta-shield-logo.png" alt="STA FISHING" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-2xl font-black tracking-wider text-white uppercase">
                        STA FISHING
                    </h1>
                    <p className="text-xs text-amber-400 font-bold mt-0.5 uppercase tracking-wide">
                        Portal de Gestão & Desenvolvedor
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                        Acesso exclusivo para Company Master e Desenvolvedor
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                            E-mail
                        </label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            required
                            disabled={loading}
                            className="bg-slate-800 border-slate-700 text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                            Senha
                        </label>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            disabled={loading}
                            className="bg-slate-800 border-slate-700 text-white"
                        />
                    </div>

                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/40 text-rose-300 px-4 py-3 rounded-xl text-xs font-semibold">
                            <strong>Erro:</strong> {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95"
                        disabled={loading}
                    >
                        {loading ? "Entrando..." : "Entrar no Sistema"}
                    </Button>
                </form>

                <div className="text-center pt-2 border-t border-slate-800">
                    <Link to="/" className="text-xs text-gray-400 hover:text-white transition-colors">
                        ← Voltar para a Página Inicial
                    </Link>
                </div>
            </Card>
        </div>
    );
}


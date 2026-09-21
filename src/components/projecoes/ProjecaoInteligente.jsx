import React, { useState } from 'react';
import { InvokeLLM } from "@/integrations/Core.js";
import { Button } from "@/components/ui/button.jsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card.jsx";
import { BrainCircuit, Loader2, Sparkles } from "lucide-react";

export default function ProjecaoInteligente({ doacoes, doadores }) {
    const [loading, setLoading] = useState(false);
    const [aiProjection, setAiProjection] = useState(null);
    const [error, setError] = useState(null);

    const generateAiProjection = async () => {
        setLoading(true);
        setError(null);
        setAiProjection(null);

        // Prepara um resumo dos dados para enviar à IA
        const summary = {
            total_doadores: doadores.length,
            historico_doacoes_mes_a_mes: doacoes.reduce((acc, doacao) => {
                const mes = new Date(doacao.data_doacao).toISOString().slice(0, 7); // YYYY-MM
                acc[mes] = (acc[mes] || 0) + 1;
                return acc;
            }, {}),
            novos_doadores_mes_a_mes: doadores.reduce((acc, doador) => {
                const mes = new Date(doador.created_at || doador.data_cadastro).toISOString().slice(0, 7);
                acc[mes] = (acc[mes] || 0) + 1;
                return acc;
            }, {}),
        };

        const prompt = `
            Aja como um analista de dados especialista em ONGs. Analise os seguintes dados sobre doações e doadores:
            ${JSON.stringify(summary, null, 2)}

            Com base nestes dados, identifique tendências, crescimento de doadores e possíveis sazonalidades.
            Gere uma projeção de número de doações para os próximos 3 meses (a partir da data atual).
            Além da projeção, forneça uma breve análise (2-3 frases) sobre o que você observou nos dados.
            Retorne sua resposta em um formato JSON.
        `;

        const response_json_schema = {
            type: "object",
            properties: {
                analise: {
                    type: "string",
                    description: "Sua breve análise sobre os dados históricos."
                },
                projecoes: {
                    type: "array",
                    description: "Uma lista de projeções para os próximos 3 meses.",
                    items: {
                        type: "object",
                        properties: {
                            mes: { type: "string", description: "O mês da projeção, ex: 'Setembro/2024'" },
                            doacoes_previstas: { type: "number", description: "O número de doações previstas para o mês." }
                        },
                        required: ["mes", "doacoes_previstas"]
                    }
                }
            },
            required: ["analise", "projecoes"]
        };

        try {
            const result = await InvokeLLM({ prompt, response_json_schema });
            setAiProjection(result);
        } catch (err) {
            console.error("Erro ao gerar projeção com IA:", err);
            setError("Não foi possível gerar a projeção. Tente novamente mais tarde.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="shadow-lg border-purple-200/50">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <BrainCircuit className="w-6 h-6 text-purple-600" />
                        Projeção Inteligente com IA
                    </CardTitle>
                    <CardDescription>
                        Use IA para uma análise e previsão mais precisa.
                    </CardDescription>
                </div>
                <Button onClick={generateAiProjection} disabled={loading} variant="outline" className="border-purple-200 hover:bg-purple-50 hover:text-purple-700">
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Analisando...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Gerar Projeção com IA
                        </>
                    )}
                </Button>
            </CardHeader>
            <CardContent>
                {loading && (
                    <div className="text-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
                        <p className="opacity-70">Aguarde, a IA está analisando os dados históricos...</p>
                    </div>
                )}
                
                {error && (
                    <div className="text-red-500 p-4 text-center bg-red-50 rounded-lg border border-red-100">
                        {error}
                    </div>
                )}
                
                {aiProjection && (
                    <div className="space-y-6">
                        <div className="p-4 bg-purple-50/30 border-l-4 border-purple-500 rounded-r-lg">
                            <h4 className="font-semibold text-purple-700 mb-1 italic">Análise da IA:</h4>
                            <p className="opacity-80 italic">"{aiProjection.analise}"</p>
                        </div>
                        
                        <div className="grid md:grid-cols-3 gap-4">
                            {aiProjection.projecoes.map((proj, index) => (
                                <div key={index} className="p-4 rounded-xl border border-purple-200/50" style={{ background: 'var(--header-bg)' }}>
                                    <p className="text-sm font-semibold text-purple-600 mb-2">{proj.mes}</p>
                                    <p className="text-3xl font-extrabold">{proj.doacoes_previstas}</p>
                                    <p className="text-xs opacity-60">doações previstas</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

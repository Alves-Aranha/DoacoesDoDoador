export const InvokeLLM = async ({ prompt, response_json_schema }) => {
    console.log("Mock InvokeLLM called with prompt:", prompt);
    
    // Simulate some latencies
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simple mock response
    return {
        analise: "Esta é uma análise gerada automaticamente via mock. O sistema de IA ainda está sendo configurado para este ambiente específico.",
        projecoes: [
            { mes: "Próximo Mês", doacoes_previstas: 15 },
            { mes: "Mês 2", doacoes_previstas: 18 },
            { mes: "Mês 3", doacoes_previstas: 20 }
        ]
    };
};

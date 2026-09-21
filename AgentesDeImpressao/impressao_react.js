// ─── Hook React para impressão matricial ────────────────────────────────────
// Coloque em src/hooks/useImpressaoMatricial.js

const AGENTE_URL = "http://localhost:5050";

/**
 * Verifica se o agente local está rodando.
 */
export async function verificarAgente() {
  try {
    const r = await fetch(`${AGENTE_URL}/ping`, { signal: AbortSignal.timeout(2000) });
    return r.ok;
  } catch {
    return false;
  }
}

/**
 * Lista as impressoras disponíveis no Windows.
 */
export async function listarImpressoras() {
  const r = await fetch(`${AGENTE_URL}/impressoras`);
  const data = await r.json();
  return data.impressoras ?? [];
}

/**
 * Envia um documento para impressão.
 *
 * @param {object} params
 * @param {string}   params.cabecalho      - Linha de cabeçalho em negrito
 * @param {string[]} params.linhas         - Linhas de texto do relatório
 * @param {boolean}  [params.imprimir_logo=true]
 * @param {boolean}  [params.avancar_pagina=true]
 * @param {string}   [params.impressora]   - Nome da impressora (null = padrão)
 */
export async function imprimirRelatorio({
  cabecalho,
  linhas,
  imprimir_logo = true,
  avancar_pagina = true,
  impressora = null,
}) {
  const online = await verificarAgente();
  if (!online) {
    throw new Error(
      "Agente de impressão não encontrado. " +
      "Verifique se o agente_impressao.py está rodando na máquina."
    );
  }

  const response = await fetch(`${AGENTE_URL}/imprimir`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cabecalho, linhas, imprimir_logo, avancar_pagina, impressora }),
  });

  const data = await response.json();
  if (data.status !== "ok") throw new Error(data.mensagem ?? "Erro desconhecido");
  return data;
}


// ─── Exemplo de uso em um componente ─────────────────────────────────────────
/*
import { imprimirRelatorio, verificarAgente } from "./hooks/useImpressaoMatricial";

async function handleImprimir() {
  try {
    await imprimirRelatorio({
      cabecalho: "RELATÓRIO DE VENDAS - 05/2026",
      linhas: [
        "----------------------------------------",
        "Cliente : João da Silva",
        "Pedido  : 001234",
        "Valor   : R$ 1.500,00",
        "----------------------------------------",
        "Obrigado pela preferência!",
      ],
      imprimir_logo: true,
      avancar_pagina: true,
    });
    alert("Impresso com sucesso!");
  } catch (err) {
    alert("Erro: " + err.message);
  }
}
*/

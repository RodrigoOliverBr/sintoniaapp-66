
// Temporary type definitions for avaliacao
export interface AvaliacaoRisco {
  id: string;
  texto: string;
  severidade: number; // This is a number representing severity level
}

export interface AvaliacaoResposta {
  id: string;
  perguntaId: string;
  resposta: boolean;
  observacao?: string;
}

export interface DiagnosticoIndividualProps {
  risco: AvaliacaoRisco;
  respostas: AvaliacaoResposta[];
  companyId: string;
}

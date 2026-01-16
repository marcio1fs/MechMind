'use server';

/**
 * @fileOverview An AI agent to analyze vehicle history and suggest maintenance.
 *
 * - analyzeVehicleHistory - A function that handles the vehicle history analysis process.
 * - VehicleHistoryInput - The input type for the analyzeVehicleHistory function.
 * - VehicleHistoryOutput - The return type for the analyzeVehicleHistory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VehicleHistoryInputSchema = z.object({
  vehicleHistory: z
    .string()
    .describe('O histórico de serviço do veículo.'),
  currentSymptoms: z
    .string()
    .optional()
    .describe('Quaisquer sintomas atuais relatados pelo cliente.'),
});
export type VehicleHistoryInput = z.infer<typeof VehicleHistoryInputSchema>;

const VehicleHistoryOutputSchema = z.object({
  predictedIssues: z
    .string()
    .describe('Possíveis problemas futuros previstos com base no histórico do veículo.'),
  recommendedMaintenance: z
    .string()
    .describe('Tarefas de manutenção proativa recomendadas.'),
  summary: z
    .string()
    .describe('Um resumo da análise e recomendações do histórico do veículo.'),
});
export type VehicleHistoryOutput = z.infer<typeof VehicleHistoryOutputSchema>;

export async function analyzeVehicleHistory(
  input: VehicleHistoryInput
): Promise<VehicleHistoryOutput> {
  return analyzeVehicleHistoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'vehicleHistoryAnalysisPrompt',
  input: {schema: VehicleHistoryInputSchema},
  output: {schema: VehicleHistoryOutputSchema},
  prompt: `Você é um mecânico especialista e consultor de serviços. Analise o histórico de serviço do veículo e os sintomas atuais para prever possíveis problemas futuros e recomendar manutenção proativa.

Histórico do Veículo:
{{{vehicleHistory}}}

Sintomas Atuais (se houver):
{{{currentSymptoms}}}

Com base nessas informações, forneça:
1.  Problemas Futuros Previstos: Uma lista de possíveis problemas que podem surgir.
2.  Manutenção Recomendada: Tarefas de manutenção proativa para prevenir esses problemas.
3.  Resumo: Um breve resumo da análise e recomendações.

Formate sua saída de forma clara e concisa.
`,
});

const analyzeVehicleHistoryFlow = ai.defineFlow(
  {
    name: 'analyzeVehicleHistoryFlow',
    inputSchema: VehicleHistoryInputSchema,
    outputSchema: VehicleHistoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

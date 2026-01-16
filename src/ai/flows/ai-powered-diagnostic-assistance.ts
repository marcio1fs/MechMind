'use server';
/**
 * @fileOverview An AI-powered diagnostic assistance tool for mechanics.
 *
 * - aiPoweredDiagnosticAssistance - A function that provides diagnostic assistance based on symptoms and vehicle history.
 * - AIPoweredDiagnosticAssistanceInput - The input type for the aiPoweredDiagnosticAssistance function.
 * - AIPoweredDiagnosticAssistanceOutput - The return type for the aiPoweredDiagnosticAssistance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIPoweredDiagnosticAssistanceInputSchema = z.object({
  symptoms: z.string().describe('Os sintomas relatados do veículo.'),
  vehicleHistory: z.string().describe('O histórico de serviço do veículo.'),
});
export type AIPoweredDiagnosticAssistanceInput = z.infer<typeof AIPoweredDiagnosticAssistanceInputSchema>;

const AIPoweredDiagnosticAssistanceOutputSchema = z.object({
  diagnosis: z.string().describe('O diagnóstico do problema do veículo gerado pela IA.'),
  confidenceLevel: z.number().describe('O nível de confiança do diagnóstico (0-1).'),
  recommendedActions: z.string().describe('Ações recomendadas com base no diagnóstico.'),
});
export type AIPoweredDiagnosticAssistanceOutput = z.infer<typeof AIPoweredDiagnosticAssistanceOutputSchema>;

export async function aiPoweredDiagnosticAssistance(input: AIPoweredDiagnosticAssistanceInput): Promise<AIPoweredDiagnosticAssistanceOutput> {
  return aiPoweredDiagnosticAssistanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiPoweredDiagnosticAssistancePrompt',
  input: {schema: AIPoweredDiagnosticAssistanceInputSchema},
  output: {schema: AIPoweredDiagnosticAssistanceOutputSchema},
  prompt: `Você é um assistente de IA especialista em mecânica. Sua tarefa é diagnosticar problemas em veículos com base nos sintomas relatados e no histórico do veículo.

Sintomas: {{{symptoms}}}
Histórico do Veículo: {{{vehicleHistory}}}

Forneça um diagnóstico, um nível de confiança (0-1) e ações recomendadas. Seja específico em seu diagnóstico.
\n{
  "diagnosis": "diagnóstico",
  "confidenceLevel": 0.8,
  "recommendedActions": "ações recomendadas"
}`,
});

const aiPoweredDiagnosticAssistanceFlow = ai.defineFlow(
  {
    name: 'aiPoweredDiagnosticAssistanceFlow',
    inputSchema: AIPoweredDiagnosticAssistanceInputSchema,
    outputSchema: AIPoweredDiagnosticAssistanceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

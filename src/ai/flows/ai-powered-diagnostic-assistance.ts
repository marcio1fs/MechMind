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
  symptoms: z.string().describe('The reported symptoms of the vehicle.'),
  vehicleHistory: z.string().describe('The service history of the vehicle.'),
});
export type AIPoweredDiagnosticAssistanceInput = z.infer<typeof AIPoweredDiagnosticAssistanceInputSchema>;

const AIPoweredDiagnosticAssistanceOutputSchema = z.object({
  diagnosis: z.string().describe('The AI-powered diagnosis of the vehicle issue.'),
  confidenceLevel: z.number().describe('The confidence level of the diagnosis (0-1).'),
  recommendedActions: z.string().describe('Recommended actions based on the diagnosis.'),
});
export type AIPoweredDiagnosticAssistanceOutput = z.infer<typeof AIPoweredDiagnosticAssistanceOutputSchema>;

export async function aiPoweredDiagnosticAssistance(input: AIPoweredDiagnosticAssistanceInput): Promise<AIPoweredDiagnosticAssistanceOutput> {
  return aiPoweredDiagnosticAssistanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiPoweredDiagnosticAssistancePrompt',
  input: {schema: AIPoweredDiagnosticAssistanceInputSchema},
  output: {schema: AIPoweredDiagnosticAssistanceOutputSchema},
  prompt: `You are an expert mechanic AI assistant. Your task is to diagnose vehicle issues based on reported symptoms and vehicle history.

Symptoms: {{{symptoms}}}
Vehicle History: {{{vehicleHistory}}}

Provide a diagnosis, a confidence level (0-1), and recommended actions. Be specific in your diagnosis.
\n{
  "diagnosis": "diagnosis",
  "confidenceLevel": 0.8,
  "recommendedActions": "recommendedActions"
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

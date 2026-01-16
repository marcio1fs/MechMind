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
    .describe('The service history of the vehicle.'),
  currentSymptoms: z
    .string()
    .optional()
    .describe('Any current symptoms reported by the customer.'),
});
export type VehicleHistoryInput = z.infer<typeof VehicleHistoryInputSchema>;

const VehicleHistoryOutputSchema = z.object({
  predictedIssues: z
    .string()
    .describe('Potential future issues predicted based on the vehicle history.'),
  recommendedMaintenance: z
    .string()
    .describe('Recommended proactive maintenance tasks.'),
  summary: z
    .string()
    .describe('A summary of the vehicle history and recommendations.'),
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
  prompt: `You are an expert mechanic and service advisor. Analyze the vehicle's service history and current symptoms to predict potential future issues and recommend proactive maintenance.

Vehicle History:
{{{vehicleHistory}}}

Current Symptoms (if any):
{{{currentSymptoms}}}

Based on this information, provide:
1.  Predicted Future Issues: A list of potential issues that may arise.
2.  Recommended Maintenance: Proactive maintenance tasks to prevent these issues.
3.  Summary: A brief summary of the analysis and recommendations.

Format your output clearly and concisely.
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

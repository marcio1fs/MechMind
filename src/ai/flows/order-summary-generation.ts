'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating summaries of service orders using AI.
 *
 * The flow takes service order details as input and returns a concise summary, including
 * services performed, parts replaced, and the total cost.
 *
 * @exports generateOrderSummary - The main function to trigger the order summary generation flow.
 * @exports OrderSummaryInput - The input type for the order summary flow.
 * @exports OrderSummaryOutput - The output type for the order summary flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema for the order summary
const OrderSummaryInputSchema = z.object({
  servicesPerformed: z
    .string()
    .describe('Uma descrição detalhada dos serviços realizados no veículo.'),
  partsReplaced: z
    .string()
    .describe('Uma lista de peças que foram substituídas durante o serviço.'),
  totalCost: z.number().describe('O custo total da ordem de serviço.'),
  vehicleMake: z.string().describe('A marca do veículo.'),
  vehicleModel: z.string().describe('O modelo do veículo.'),
  vehicleYear: z.number().describe('O ano do veículo.'),
});
export type OrderSummaryInput = z.infer<typeof OrderSummaryInputSchema>;

// Define the output schema for the order summary
const OrderSummaryOutputSchema = z.object({
  summary: z
    .string()
    .describe(
      'Um resumo conciso da ordem de serviço, incluindo serviços, peças e custo.'
    ),
});
export type OrderSummaryOutput = z.infer<typeof OrderSummaryOutputSchema>;

// Define the main function to trigger the order summary generation flow
export async function generateOrderSummary(input: OrderSummaryInput): Promise<OrderSummaryOutput> {
  return orderSummaryFlow(input);
}

// Define the prompt for generating the order summary
const orderSummaryPrompt = ai.definePrompt({
  name: 'orderSummaryPrompt',
  input: {schema: OrderSummaryInputSchema},
  output: {schema: OrderSummaryOutputSchema},
  prompt: `Você é um assistente de IA que gera resumos para ordens de serviço.

  Com base nos detalhes a seguir sobre uma ordem de serviço, crie um resumo conciso que inclua os serviços realizados, as peças substituídas e o custo total.

  Veículo: {{vehicleYear}} {{vehicleMake}} {{vehicleModel}}
  Serviços Realizados: {{servicesPerformed}}
  Peças Substituídas: {{partsReplaced}}
  Custo Total: {{totalCost}}

  Resumo:`,
});

// Define the Genkit flow for generating the order summary
const orderSummaryFlow = ai.defineFlow(
  {
    name: 'orderSummaryFlow',
    inputSchema: OrderSummaryInputSchema,
    outputSchema: OrderSummaryOutputSchema,
  },
  async input => {
    const {output} = await orderSummaryPrompt(input);
    return output!;
  }
);

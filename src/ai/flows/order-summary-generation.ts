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
    .describe('A detailed description of the services performed on the vehicle.'),
  partsReplaced: z
    .string()
    .describe('A list of parts that were replaced during the service.'),
  totalCost: z.number().describe('The total cost of the service order.'),
  vehicleMake: z.string().describe('The make of the vehicle.'),
  vehicleModel: z.string().describe('The model of the vehicle.'),
  vehicleYear: z.number().describe('The year of the vehicle.'),
});
export type OrderSummaryInput = z.infer<typeof OrderSummaryInputSchema>;

// Define the output schema for the order summary
const OrderSummaryOutputSchema = z.object({
  summary: z
    .string()
    .describe(
      'A concise summary of the service order, including services, parts, and cost.'
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
  prompt: `You are an AI assistant that generates summaries for service orders.

  Given the following details about a service order, create a concise summary that includes the services performed, parts replaced, and the total cost.

  Vehicle: {{vehicleYear}} {{vehicleMake}} {{vehicleModel}}
  Services Performed: {{servicesPerformed}}
  Parts Replaced: {{partsReplaced}}
  Total Cost: {{totalCost}}

  Summary:`,
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

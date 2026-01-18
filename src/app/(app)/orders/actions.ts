"use server";

import {
  generateOrderSummary,
  type OrderSummaryOutput,
} from "@/ai/flows/order-summary-generation";
import {
  aiPoweredDiagnosticAssistance,
  type AIPoweredDiagnosticAssistanceOutput,
} from "@/ai/flows/ai-powered-diagnostic-assistance";
import { z } from "zod";

const schema = z.object({
  servicesPerformed: z.string(),
  partsReplaced: z.string(),
  totalCost: z.number(),
  vehicleMake: z.string(),
  vehicleModel: z.string(),
  vehicleYear: z.number(),
});

type State = {
  data?: OrderSummaryOutput | null;
  message?: string | null;
};

export async function getOrderSummary(
  input: z.infer<typeof schema>
): Promise<State> {
  const validatedFields = schema.safeParse(input);

  if (!validatedFields.success) {
    return {
      message: "Dados do pedido inválidos.",
    };
  }

  try {
    const result = await generateOrderSummary(validatedFields.data);
    return { data: result, message: "Resumo gerado." };
  } catch (error) {
    return {
      message: "Ocorreu um erro ao gerar o resumo.",
    };
  }
}

const diagnosisSchema = z.object({
  symptoms: z.string().min(10, { message: "Por favor, descreva os sintomas com mais detalhes." }),
  vehicleHistory: z.string().optional(),
});

export async function getAIDiagnosisForOrder(
  input: z.infer<typeof diagnosisSchema>
): Promise<{ data?: AIPoweredDiagnosticAssistanceOutput; message?: string; }> {
  const validatedFields = diagnosisSchema.safeParse(input);

  if (!validatedFields.success) {
    return {
      message: validatedFields.error.flatten().fieldErrors.symptoms?.[0],
    };
  }

  try {
    const result = await aiPoweredDiagnosticAssistance({
      symptoms: validatedFields.data.symptoms,
      vehicleHistory: validatedFields.data.vehicleHistory || "Nenhum histórico fornecido.",
    });
    return { data: result };
  } catch (error) {
    
    return {
      message: "Ocorreu um erro ao obter o diagnóstico. Por favor, tente novamente.",
    };
  }
}

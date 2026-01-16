"use server";

import {
  aiPoweredDiagnosticAssistance,
  type AIPoweredDiagnosticAssistanceOutput,
} from "@/ai/flows/ai-powered-diagnostic-assistance";
import { z } from "zod";

const schema = z.object({
  symptoms: z.string().min(10, { message: "Por favor, descreva os sintomas com mais detalhes." }),
  vehicleHistory: z.string().optional(),
});

type State = {
  data?: AIPoweredDiagnosticAssistanceOutput | null;
  message?: string | null;
};

export async function getAIDiagnosis(
  prevState: State,
  formData: FormData
): Promise<State> {
  const validatedFields = schema.safeParse({
    symptoms: formData.get("symptoms"),
    vehicleHistory: formData.get("vehicleHistory"),
  });

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
    return { data: result, message: "Diagnóstico completo." };
  } catch (error) {
    return {
      message: "Ocorreu um erro ao obter o diagnóstico. Por favor, tente novamente.",
    };
  }
}

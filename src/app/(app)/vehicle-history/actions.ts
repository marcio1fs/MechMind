"use server";

import {
  analyzeVehicleHistory,
  type VehicleHistoryOutput,
} from "@/ai/flows/vehicle-history-analysis";
import { z } from "zod";

const schema = z.object({
  vehicleHistory: z.string().min(10, { message: "Por favor, forneça mais detalhes do histórico do veículo." }),
  currentSymptoms: z.string().optional(),
});

type State = {
  data?: VehicleHistoryOutput | null;
  message?: string | null;
};

export async function getVehicleHistoryAnalysis(
  prevState: State,
  formData: FormData
): Promise<State> {
  const validatedFields = schema.safeParse({
    vehicleHistory: formData.get("vehicleHistory"),
    currentSymptoms: formData.get("currentSymptoms"),
  });

  if (!validatedFields.success) {
    return {
      message: validatedFields.error.flatten().fieldErrors.vehicleHistory?.[0],
    };
  }

  try {
    const result = await analyzeVehicleHistory(validatedFields.data);
    return { data: result, message: "Análise completa." };
  } catch (error) {
    return {
      message: "Ocorreu um erro durante a análise. Por favor, tente novamente.",
    };
  }
}

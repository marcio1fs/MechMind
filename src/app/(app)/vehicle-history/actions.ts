"use server";

import {
  analyzeVehicleHistory,
  type VehicleHistoryOutput,
} from "@/ai/flows/vehicle-history-analysis";
import { z } from "zod";

const schema = z.object({
  vehicleHistory: z.string().min(10, { message: "Please provide more vehicle history details." }),
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
    return { data: result, message: "Analysis complete." };
  } catch (error) {
    return {
      message: "An error occurred during analysis. Please try again.",
    };
  }
}

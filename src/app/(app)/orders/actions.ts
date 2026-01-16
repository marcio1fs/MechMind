"use server";

import {
  generateOrderSummary,
  type OrderSummaryOutput,
} from "@/ai/flows/order-summary-generation";
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

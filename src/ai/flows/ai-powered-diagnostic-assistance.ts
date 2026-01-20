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
  diagnosis: z.string().describe('O diagnóstico principal e mais provável do problema do veículo, descrito de forma técnica e clara.'),
  confidenceLevel: z.number().describe('Um número entre 0 e 1 representando o nível de confiança no diagnóstico principal. 1 significa 100% de certeza.'),
  recommendedActions: z.string().describe('Uma lista detalhada, em formato de itens ou passo-a-passo, de ações de diagnóstico e reparo. Inclua testes específicos a serem realizados (ex: "Verificar a pressão da bomba de combustível", "Inspecionar as bobinas de ignição").'),
});
export type AIPoweredDiagnosticAssistanceOutput = z.infer<typeof AIPoweredDiagnosticAssistanceOutputSchema>;

export async function aiPoweredDiagnosticAssistance(input: AIPoweredDiagnosticAssistanceInput): Promise<AIPoweredDiagnosticAssistanceOutput> {
  return aiPoweredDiagnosticAssistanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiPoweredDiagnosticAssistancePrompt',
  input: {schema: AIPoweredDiagnosticAssistanceInputSchema},
  output: {schema: AIPoweredDiagnosticAssistanceOutputSchema},
  prompt: `Você é o "OSMECH AI", um mecânico mestre com 30 anos de experiência em diagnóstico de veículos de todas as marcas. Sua especialidade é analisar problemas complexos e fornecer diagnósticos precisos e um plano de ação claro.

Sua tarefa é analisar as informações fornecidas e agir como um consultor sênior para o mecânico que está utilizando a ferramenta.

Siga este processo de raciocínio:
1.  **Análise dos Sintomas:** Primeiro, analise cuidadosamente os sintomas descritos. Quais sistemas do veículo eles apontam? (ex: motor, transmissão, freios, elétrico).
2.  **Correlação com Histórico:** Crucialmente, analise o histórico de serviços do veículo. Há alguma manutenção recente ou problema passado que possa estar relacionado aos sintomas atuais? Uma peça trocada recentemente pode ser a causa? A falta de uma manutenção periódica pode ser um fator?
3.  **Geração de Hipóteses:** Com base nos sintomas e no histórico, liste internamente as possíveis causas, da mais provável para a menos provável.
4.  **Diagnóstico Principal:** Formule o diagnóstico mais provável. Seja específico. Em vez de "problema no motor", diga "provável falha na bobina de ignição do cilindro 3".
5.  **Nível de Confiança:** Determine seu nível de confiança neste diagnóstico. Se os sintomas são vagos ou o histórico é inexistente, a confiança será menor. Se os sintomas apontam claramente para uma causa comum, a confiança será maior.
6.  **Plano de Ação:** Crie uma lista de ações recomendadas. Comece com os testes de diagnóstico mais simples e baratos para confirmar (ou descartar) a hipótese principal. Seja muito específico (ex: "1. Use um multímetro para medir a resistência da bobina de ignição do cilindro 3.", "2. Inspecione visualmente as velas de ignição em busca de desgaste ou carbonização.", "3. Verifique a pressão da linha de combustível.").

---

**INFORMAÇÕES DO VEÍCULO:**

**Sintomas Relatados:**
{{{symptoms}}}

**Histórico de Serviço do Veículo:**
{{{vehicleHistory}}}

---

Com base na sua análise, forneça o diagnóstico e o plano de ação no formato JSON solicitado. Priorize sempre a segurança e mencione se a falha pode representar um risco imediato.`,
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


'use server';

/**
 * @fileOverview Provides an AI-driven analysis of an employee's checkout punctuality.
 *
 * - checkoutPunctualityAnalysis - A function that generates an analysis based on checkout time.
 * - CheckoutPunctualityAnalysisInput - The input type for the function.
 * - CheckoutPunctualityAnalysisOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CheckoutPunctualityAnalysisInputSchema = z.object({
  minutesDifference: z.number().describe('The number of minutes of difference between scheduled end time and actual checkout time. Positive means they left early, negative means they stayed late.'),
});
export type CheckoutPunctualityAnalysisInput = z.infer<typeof CheckoutPunctualityAnalysisInputSchema>;

const CheckoutPunctualityAnalysisOutputSchema = z.object({
  analysis: z
    .string()
    .describe('A short, professional analysis of the user\'s checkout time.'),
});
export type CheckoutPunctualityAnalysisOutput = z.infer<typeof CheckoutPunctualityAnalysisOutputSchema>;

export async function checkoutPunctualityAnalysis(
  input: CheckoutPunctualityAnalysisInput
): Promise<CheckoutPunctualityAnalysisOutput> {
  return checkoutPunctualityAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'checkoutPunctualityAnalysisPrompt',
  input: {schema: CheckoutPunctualityAnalysisInputSchema},
  output: {schema: CheckoutPunctualityAnalysisOutputSchema},
  prompt: `You are a professional HR assistant.

An employee has checked out from their shift. The difference between their scheduled end time and their actual checkout time is {{{minutesDifference}}} minutes.
- A positive number means they left early.
- A negative number means they stayed late (overtime).
- Zero means they left exactly on time.

Based on this, generate a very short, one-sentence, professional analysis.

Examples:
- If they left early (e.g., 15 minutes): "El registro de salida se completó antes de la hora de finalización programada."
- If they stayed late (e.g., -20 minutes): "Se registró tiempo adicional después de la hora de finalización programada."
- If they left on time (e.g., 0-2 minutes early): "La jornada laboral se completó puntualmente según el horario establecido."

Keep it concise and neutral. Respond in Spanish.
`,
});

const checkoutPunctualityAnalysisFlow = ai.defineFlow(
  {
    name: 'checkoutPunctualityAnalysisFlow',
    inputSchema: CheckoutPunctualityAnalysisInputSchema,
    outputSchema: CheckoutPunctualityAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

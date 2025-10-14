'use server';

/**
 * @fileOverview Provides an AI-driven analysis of an employee's punctuality.
 *
 * - punctualityAnalysis - A function that generates an analysis based on early arrival.
 * - PunctualityAnalysisInput - The input type for the punctualityAnalysis function.
 * - PunctualityAnalysisOutput - The return type for the punctualityAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PunctualityAnalysisInputSchema = z.object({
  minutesEarly: z.number().describe('The number of minutes the user arrived early.'),
});
export type PunctualityAnalysisInput = z.infer<typeof PunctualityAnalysisInputSchema>;

const PunctualityAnalysisOutputSchema = z.object({
  analysis: z
    .string()
    .describe('A short, encouraging analysis of the user\'s punctuality.'),
});
export type PunctualityAnalysisOutput = z.infer<typeof PunctualityAnalysisOutputSchema>;

export async function punctualityAnalysis(
  input: PunctualityAnalysisInput
): Promise<PunctualityAnalysisOutput> {
  return punctualityAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'punctualityAnalysisPrompt',
  input: {schema: PunctualityAnalysisInputSchema},
  output: {schema: PunctualityAnalysisOutputSchema},
  prompt: `You are a motivational assistant for employees.

An employee has checked in {{{minutesEarly}}} minutes early for their shift or appointment.

Generate a short, positive, and encouraging analysis about their punctuality. The tone should be professional but inspiring. Mention what arriving early says about their commitment and professionalism.

Keep it to one or two brief sentences.
`,
});

const punctualityAnalysisFlow = ai.defineFlow(
  {
    name: 'punctualityAnalysisFlow',
    inputSchema: PunctualityAnalysisInputSchema,
    outputSchema: PunctualityAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

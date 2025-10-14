
'use server';

/**
 * @fileOverview Generates a personalized motivational message for the user upon logging in.
 *
 * - getMotivationalMessage - A function that returns a motivational message.
 * - MotivationalMessageInput - The input type for the function.
 * - MotivationalMessageOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MotivationalMessageInputSchema = z.object({
  userName: z.string().describe('The first name of the user.'),
});
type MotivationalMessageInput = z.infer<typeof MotivationalMessageInputSchema>;

const MotivationalMessageOutputSchema = z.object({
  message: z.string().describe('A short, motivational welcome message for the user.'),
});
export type MotivationalMessageOutput = z.infer<typeof MotivationalMessageOutputSchema>;

export async function getMotivationalMessage(
  input: MotivationalMessageInput
): Promise<MotivationalMessageOutput> {
  return motivationalMessageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'motivationalMessagePrompt',
  input: {schema: MotivationalMessageInputSchema},
  output: {schema: MotivationalMessageOutputSchema},
  prompt: `You are an AI assistant who provides a short, powerful, and positive motivational message to an employee named {{{userName}}}.
The message should be related to professional success, punctuality, starting the day strong, or achieving goals.
The tone should be inspiring and encouraging.
The message must be in Spanish.
Do not ask a question. Make a statement.

Example:
"La puntualidad es el alma de la cortesía. ¡Que tengas un día productivo, {{{userName}}}!"
"Un nuevo día es una nueva oportunidad para el éxito. ¡Vamos a por ello, {{{userName}}}!"
"Tu compromiso marca la diferencia. ¡Aprovecha cada momento de hoy, {{{userName}}}!"
`,
});

const motivationalMessageFlow = ai.defineFlow(
  {
    name: 'motivationalMessageFlow',
    inputSchema: MotivationalMessageInputSchema,
    outputSchema: MotivationalMessageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

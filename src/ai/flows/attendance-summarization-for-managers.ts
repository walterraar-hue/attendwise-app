'use server';
/**
 * @fileOverview A flow that generates attendance summaries for managers, highlighting at-risk patterns.
 *
 * - attendanceSummarizationForManagers - A function that generates attendance summaries for managers.
 * - AttendanceSummarizationForManagersInput - The input type for the attendanceSummarizationForManagers function.
 * - AttendanceSummarizationForManagersOutput - The return type for the attendanceSummarizationForManagers function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AttendanceSummarizationForManagersInputSchema = z.object({
  employeeRecords: z.string().describe('A record of employee attendance including timestamps.'),
  timePeriod: z.enum(['weekly', 'monthly']).describe('The time period for the summary.'),
  companyPolicies: z.string().describe('The company policies related to attendance.'),
});
export type AttendanceSummarizationForManagersInput = z.infer<
  typeof AttendanceSummarizationForManagersInputSchema
>;

const AttendanceSummarizationForManagersOutputSchema = z.object({
  summary: z.string().describe('A summary of attendance for the specified time period.'),
  atRiskPatterns: z.string().describe('Any at-risk attendance patterns identified.'),
});
export type AttendanceSummarizationForManagersOutput = z.infer<
  typeof AttendanceSummarizationForManagersOutputSchema
>;

export async function attendanceSummarizationForManagers(
  input: AttendanceSummarizationForManagersInput
): Promise<AttendanceSummarizationForManagersOutput> {
  return attendanceSummarizationForManagersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'attendanceSummarizationForManagersPrompt',
  input: {schema: AttendanceSummarizationForManagersInputSchema},
  output: {schema: AttendanceSummarizationForManagersOutputSchema},
  prompt: `You are an AI assistant tasked with generating attendance summaries for managers.

You will analyze employee attendance records, identify at-risk patterns, and create a summary for the specified time period.

Consider company policies when generating the summary.

Employee Records: {{{employeeRecords}}}
Time Period: {{{timePeriod}}}
Company Policies: {{{companyPolicies}}}

Summary:
At-Risk Patterns:`, // Ensure the LLM returns output that conforms to the schema
});

const attendanceSummarizationForManagersFlow = ai.defineFlow(
  {
    name: 'attendanceSummarizationForManagersFlow',
    inputSchema: AttendanceSummarizationForManagersInputSchema,
    outputSchema: AttendanceSummarizationForManagersOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

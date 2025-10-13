'use server';

/**
 * @fileOverview Generates attendance summaries for global admins, flagging trends and areas of concern.
 *
 * - attendanceSummarizationForGlobalAdmins - A function that generates the attendance summary.
 * - AttendanceSummarizationForGlobalAdminsInput - The input type for the attendanceSummarizationForGlobalAdmins function.
 * - AttendanceSummarizationForGlobalAdminsOutput - The return type for the attendanceSummarizationForGlobalAdmins function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AttendanceSummarizationForGlobalAdminsInputSchema = z.object({
  attendanceData: z
    .string()
    .describe('A JSON string containing the attendance records for all employees.'),
  companyName: z.string().describe('The name of the company.'),
  timePeriod: z.string().describe('The time period for the attendance summary (e.g., weekly, monthly).'),
});

export type AttendanceSummarizationForGlobalAdminsInput = z.infer<
  typeof AttendanceSummarizationForGlobalAdminsInputSchema
>;

const AttendanceSummarizationForGlobalAdminsOutputSchema = z.object({
  summary: z.string().describe('A high-level summary of attendance across the entire company.'),
  areasOfConcern: z
    .string()
    .describe('Specific trends or areas of concern regarding attendance patterns.'),
  suggestions: z
    .string()
    .describe('Suggestions for addressing the identified attendance issues.'),
});

export type AttendanceSummarizationForGlobalAdminsOutput = z.infer<
  typeof AttendanceSummarizationForGlobalAdminsOutputSchema
>;

export async function attendanceSummarizationForGlobalAdmins(
  input: AttendanceSummarizationForGlobalAdminsInput
): Promise<AttendanceSummarizationForGlobalAdminsOutput> {
  return attendanceSummarizationForGlobalAdminsFlow(input);
}

const attendanceSummarizationPrompt = ai.definePrompt({
  name: 'attendanceSummarizationPrompt',
  input: {schema: AttendanceSummarizationForGlobalAdminsInputSchema},
  output: {schema: AttendanceSummarizationForGlobalAdminsOutputSchema},
  prompt: `You are an AI assistant specializing in analyzing company attendance data and providing summaries for global admins.

You will receive attendance records, the company name, and the time period for the summary. Your goal is to provide a high-level summary of attendance across the company, flagging any trends or areas of concern, and offering suggestions for improvement.

Company Name: {{{companyName}}}
Time Period: {{{timePeriod}}}
Attendance Data: {{{attendanceData}}}

Respond in a professional and concise manner.
`,
});

const attendanceSummarizationForGlobalAdminsFlow = ai.defineFlow(
  {
    name: 'attendanceSummarizationForGlobalAdminsFlow',
    inputSchema: AttendanceSummarizationForGlobalAdminsInputSchema,
    outputSchema: AttendanceSummarizationForGlobalAdminsOutputSchema,
  },
  async input => {
    const {output} = await attendanceSummarizationPrompt(input);
    return output!;
  }
);

'use client';
import { config } from 'dotenv';
config();

import '@/ai/flows/attendance-summarization-for-global-admins.ts';
import '@/ai/flows/attendance-summarization-for-managers.ts';
import '@/ai/flows/punctuality-analysis.ts';

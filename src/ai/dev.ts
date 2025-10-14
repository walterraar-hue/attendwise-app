'use client';
import { config } from 'dotenv';
config({ override: true });

import '@/ai/flows/attendance-summarization-for-global-admins.ts';
import '@/ai/flows/attendance-summarization-for-managers.ts';
import '@/ai/flows/punctuality-analysis.ts';
import '@/ai/flows/checkout-punctuality-analysis.ts';
import '@/ai/flows/motivational-message-flow.ts';


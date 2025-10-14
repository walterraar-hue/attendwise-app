
'use client';
import { redirect } from 'next/navigation';

export default function WelcomePage() {
  // Redirect to the login page by default
  redirect('/login');
}

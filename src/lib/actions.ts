
'use server';

import { z } from 'zod';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const firebaseAdminConfig = {
  project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!getApps().length) {
  initializeApp({
    credential: cert(firebaseAdminConfig),
  });
}

const adminAuth = getAuth();
const adminDb = getFirestore();

const memberSchema = z.object({
  name: z.string().min(2, "Please enter your full name."),
  email: z.string().email("Please enter a valid email address."),
  companyCode: z.string().min(1, "Company code is required."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
  role: z.string().min(1, "Role is required"),
});

export async function validateAndCreateUser(values: unknown) {
  const parsed = memberSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: 'Invalid input data.' };
  }

  const { name, email, companyCode, password, role } = parsed.data;

  try {
    // Step 1: Validate Company and check for available slots
    const companyRef = adminDb.collection('companies').doc(companyCode);
    const companySnap = await companyRef.get();

    if (!companySnap.exists) {
      return { success: false, error: 'El código de la empresa no es válido.' };
    }

    const companyData = companySnap.data()!;
    const roleLimits = companyData.roleLimits || {};
    const roleLimit = roleLimits[role] ?? 0;

    const usersInRoleQuery = await adminDb
      .collection('users')
      .where('companyId', '==', companyCode)
      .where('role', '==', role)
      .get();
    
    const usersInRole = usersInRoleQuery.size;

    if (roleLimit !== -1 && usersInRole >= roleLimit) {
      return { success: false, error: `No hay más cupos disponibles para el rol '${role}'.` };
    }

    // Step 2: Create Firebase Auth user
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    // Step 3: Create user document and update company atomically
    const userDocRef = adminDb.collection('users').doc(userRecord.uid);
    
    await adminDb.runTransaction(async (transaction) => {
        transaction.set(userDocRef, {
            id: userRecord.uid,
            companyId: companyCode,
            name: name,
            email: email,
            role: role,
            status: 'active',
        });

        transaction.update(companyRef, {
            usedSlots: FieldValue.increment(1),
        });
    });

    return { success: true };

  } catch (error: any) {
    let errorMessage = "No se pudo activar la cuenta. Verifica tus datos e inténtalo de nuevo.";
    if (error.code === 'auth/email-already-exists') {
      errorMessage = "Este correo electrónico ya está registrado. Por favor, inicia sesión.";
    } else {
        console.error("Server Action Error:", error);
        errorMessage = error.message || errorMessage;
    }
    return { success: false, error: errorMessage };
  }
}

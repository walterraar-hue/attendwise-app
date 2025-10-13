"use server";

import { z } from 'zod';
import { company } from './data';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Ensure Firebase Admin is initialized
if (!getApps().length) {
  // When running in a Google Cloud environment, the SDK can automatically
  // discover the service account credentials. Passing no arguments initializes
  // with default credentials.
  initializeApp();
}

const adminAuth = getAuth();
const db = getFirestore();

const inviteSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  role: z.enum(["Manager", "Employee"]),
});

export async function inviteUser(prevState: any, formData: FormData) {
  const companyDoc = await db.collection('companies').doc(company.id).get();
  const companyData = companyDoc.data();

  if (!companyData || companyData.usedSlots >= companyData.userLimit) {
    return { success: false, message: "User limit reached. Please upgrade your plan." };
  }

  const validatedFields = inviteSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    role: formData.get('role'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Invalid form data.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const { email, name, role } = validatedFields.data;

  try {
    await adminAuth.getUserByEmail(email);
    return { success: false, message: `User with email ${email} already exists.` };
  } catch (error: any) {
    if (error.code !== 'auth/user-not-found') {
      return { success: false, message: error.message };
    }
  }

  const userRef = db.collection('users').doc(); 
  const companyRef = db.collection('companies').doc(company.id);

  try {
    await db.runTransaction(async (transaction) => {
      transaction.set(userRef, {
        id: userRef.id,
        companyId: company.id,
        email,
        name,
        role,
        status: 'pending',
      });
      transaction.update(companyRef, {
        usedSlots: companyData.usedSlots + 1,
      });
    });
    return { success: true, message: `Invitation sent to ${name}.` };
  } catch (error: any) {
    console.error("Transaction failure:", error);
    return { success: false, message: "Failed to send invitation. Please try again." };
  }
}

const activateSchema = z.object({
    email: z.string().email("Invalid email address."),
    companyCode: z.string(),
    password: z.string().min(8, "Password must be at least 8 characters."),
});

export async function activateAccount(prevState: any, formData: FormData) {
    const validatedFields = activateSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return {
          success: false,
          message: "Invalid form data.",
          errors: validatedFields.error.flatten().fieldErrors,
        };
    }
    
    const { email, companyCode, password } = validatedFields.data;
    
    const usersRef = db.collection('users');
    const q = usersRef.where('email', '==', email).where('status', '==', 'pending').where('companyId', '==', companyCode);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
        return { success: false, message: "No pending invitation found for this email and company code." };
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    try {
        const userRecord = await adminAuth.createUser({
            email,
            password,
            displayName: userData.name,
        });

        await userDoc.ref.update({
            status: 'active',
            id: userRecord.uid, 
        });

        return { success: true, message: "Account activated successfully! You can now log in." };

    } catch (error: any) {
        console.error("Error activating account:", error);
        if (error.code === 'auth/email-already-exists') {
            return { success: false, message: "This email is already registered." };
        }
        return { success: false, message: error.message || "An unexpected error occurred." };
    }
}

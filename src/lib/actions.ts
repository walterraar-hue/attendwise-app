"use server";

import { z } from 'zod';
import { company, users } from './data';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Ensure Firebase Admin is initialized
if (!getApps().length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);
    initializeApp({
      credential: cert(serviceAccount)
    });
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error);
    // Fallback for environments where ADC might be set up, but prefer service account
    if (!getApps().length) {
        initializeApp();
    }
  }
}


const adminAuth = getAuth();
const db = getFirestore();

const inviteSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  role: z.enum(["Manager", "Employee"]),
});

export async function inviteUser(prevState: any, formData: FormData) {
  // NOTE: In a real application, this would be a database transaction.
  // We simulate the checks and updates here.

  // 1. Re-verify user limits from a reliable source (Firestore)
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

  // 2. Check if user already exists in Auth
  try {
    await adminAuth.getUserByEmail(email);
    return { success: false, message: `User with email ${email} already exists.` };
  } catch (error: any) {
    if (error.code !== 'auth/user-not-found') {
      // Some other error occurred
      return { success: false, message: error.message };
    }
    // User does not exist, which is what we want. Continue.
  }

  // 3. Create a 'pending' user document and update company slots atomically
  const userRef = db.collection('users').doc(); // Firestore generates ID
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
    const validatedFields = activateSchema.safeParse({
        email: formData.get('email'),
        companyCode: formData.get('companyCode'),
        password: formData.get('password'),
    });

    if (!validatedFields.success) {
        return {
          success: false,
          message: "Invalid form data.",
          errors: validatedFields.error.flatten().fieldErrors,
        };
    }
    
    const { email, companyCode, password } = validatedFields.data;
    
    // Find the pending user
    const usersRef = db.collection('users');
    const q = usersRef.where('email', '==', email).where('status', '==', 'pending').where('companyId', '==', companyCode);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
        return { success: false, message: "No pending invitation found for this email and company code." };
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    try {
        // Create user in Firebase Auth
        const userRecord = await adminAuth.createUser({
            email,
            password,
            displayName: userData.name,
        });

        // Update user document in Firestore to 'active' and link UID
        await userDoc.ref.update({
            status: 'active',
            id: userRecord.uid, // Replace temporary ID with real UID
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


const createTeamSchema = z.object({
    name: z.string().min(2, "Please enter your full name."),
    email: z.string().email("Invalid email address."),
    password: z.string().min(8, "Password must be at least 8 characters long."),
});

export async function createTeam(prevState: any, formData: FormData) {
    const validatedFields = createTeamSchema.safeParse(Object.fromEntries(formData));

    if (!validatedFields.success) {
        const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0];
        return {
          success: false,
          message: firstError || "Invalid form data. Please check your entries.",
        };
    }
    
    const { email, password, name } = validatedFields.data;

    try {
        const companyId = `COMP-${Date.now()}`;
        const companyName = "AttendWise Company"; // Default name
        
        // 1. Create Firebase Auth user
        const userRecord = await adminAuth.createUser({
            email,
            password,
            displayName: name,
        });
        
        const uid = userRecord.uid;

        // Use a batch to perform atomic writes
        const batch = db.batch();

        // 2. Create company document in Firestore
        const companyDocRef = db.collection('companies').doc(companyId);
        batch.set(companyDocRef, {
            id: companyId,
            name: companyName,
            subscriptionPlan: 'Pro',
            userLimit: 10,
            recordLimit: 1000,
            usedSlots: 1,
        });

        // 3. Create user document in Firestore, linking to the new company
        const userDocRef = db.collection('users').doc(uid);
        batch.set(userDocRef, {
            id: uid,
            companyId: companyId,
            email: email,
            name: name, // Save the full name
            role: 'Global Admin',
            status: 'active',
        });

        // 4. Set global admin role in a separate collection for security rules
        const adminRoleRef = db.collection('roles_admin').doc(uid);
        batch.set(adminRoleRef, { admin: true });

        // Commit the batch
        await batch.commit();

        return { success: true, message: `Team '${companyName}' created successfully. You can now log in.` };

    } catch (error: any) {
        console.error("Error creating team:", error);
        if (error.code === 'auth/email-already-exists') {
            return { success: false, message: "This email is already in use. Please try another one." };
        }
        return { success: false, message: error.message || "An unexpected error occurred." };
    }
}

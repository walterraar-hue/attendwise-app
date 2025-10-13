"use server";

import { z } from 'zod';
import { company, users } from './data';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseConfig } from '@/firebase/config'; // Using client config is okay for admin actions

if (!getApps().length) {
  initializeApp({
    // As this is a server action, we can't rely on client-side automatic config.
    // We will use the public config, but in a real-world secure backend,
    // you would use service account credentials.
  });
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

  // 1. Re-verify user limits
  if (company.subscription.usedSlots >= company.subscription.userLimit) {
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

  // 2. Check if user already exists (active or pending)
  const existingUser = users.find(u => u.email === validatedFields.data.email);
  if (existingUser) {
    return { success: false, message: `User with email ${validatedFields.data.email} already exists.` };
  }

  // 3. Simulate creating a 'pending' user document and updating company slots
  console.log("Simulating: Invite successful for", validatedFields.data.name);
  
  company.subscription.usedSlots += 1;
  users.push({
    id: `usr-new-${Date.now()}`,
    ...validatedFields.data,
    status: 'pending',
    avatarUrl: `https://picsum.photos/seed/${users.length + 1}/200/200`,
  });

  return { success: true, message: `Invitation sent to ${validatedFields.data.name}.` };
}

const activateSchema = z.object({
    email: z.string().email("Invalid email address."),
    companyCode: z.string().refine(code => code === company.id, { message: "Invalid company code." }),
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
    
    // 1. Find the pending user in Firestore
    // This part remains conceptual as we don't have the full user list from firestore yet
    console.log(`Simulating: Activating user ${validatedFields.data.email}`);
    
    return { success: true, message: "Account activated successfully! You can now log in." };
}


const createTeamSchema = z.object({
    email: z.string().email("Invalid email address."),
    password: z.string().min(8, "Password must be at least 8 characters long."),
});

export async function createTeam(prevState: any, formData: FormData) {
    const validatedFields = createTeamSchema.safeParse({
        email: formData.get('email'),
        password: formData.get('password'),
    });

    if (!validatedFields.success) {
        return {
          success: false,
          message: "Invalid form data.",
          errors: validatedFields.error.flatten().fieldErrors,
        };
    }
    
    const { email, password } = validatedFields.data;

    try {
        const companyId = `COMP-${Date.now()}`;
        const companyName = "AttendWise Company"; // Default name
        
        // 1. Create Firebase Auth user
        const userRecord = await adminAuth.createUser({
            email,
            password,
            displayName: "Global Admin", // Default name for first user
        });
        
        const uid = userRecord.uid;

        // 2. Create company document in Firestore
        const companyDocRef = db.collection('companies').doc(companyId);
        await companyDocRef.set({
            id: companyId,
            name: companyName,
            subscriptionPlan: 'Pro',
            userLimit: 10,
            recordLimit: 1000,
            usedSlots: 1,
        });

        // 3. Create user document in Firestore
        const userDocRef = db.collection('users').doc(uid);
        await userDocRef.set({
            id: uid,
            companyId: companyId,
            email: email,
            role: 'Global Admin',
            status: 'active',
        });

        // 4. Set global admin role
        await db.collection('roles_admin').doc(uid).set({ admin: true });


        return { success: true, message: `Team '${companyName}' created successfully. You can now log in.` };

    } catch (error: any) {
        console.error("Error creating team:", error);
        // Handle specific Firebase errors
        if (error.code === 'auth/email-already-exists') {
            return { success: false, message: "This email is already in use. Please try another one." };
        }
        return { success: false, message: error.message || "An unexpected error occurred." };
    }
}

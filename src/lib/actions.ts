"use server";

import { z } from 'zod';
import { company, users } from './data';

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
  // In a real app, you would:
  // - const newUser = await db.collection('users').add({ ...validatedFields.data, status: 'pending' });
  // - await db.collection('companies').doc(company.id).update({ usedSlots: FieldValue.increment(1) });
  
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
    // NOTE: In a real application, this would be a database transaction.
    // We simulate finding the pending user, creating auth, and updating status.

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
    
    // 1. Find the pending user
    const pendingUser = users.find(u => u.email === validatedFields.data.email && u.status === 'pending');
    if (!pendingUser) {
        return { success: false, message: "No pending invitation found for this email or account already active." };
    }

    // 2. Simulate creating a Firebase Auth account
    console.log(`Simulating: Creating Firebase Auth user for ${validatedFields.data.email}`);
    // In a real app: await auth.createUser({ email, password });

    // 3. Simulate updating the user document status to 'active'
    console.log(`Simulating: Activating user ${pendingUser.id}`);
    // In a real app: await db.collection('users').doc(pendingUser.id).update({ status: 'active' });
    const userIndex = users.findIndex(u => u.id === pendingUser.id);
    if (userIndex !== -1) {
        users[userIndex].status = 'active';
    }
    
    return { success: true, message: "Account activated successfully! You can now log in." };
}
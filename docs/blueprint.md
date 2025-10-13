# **App Name**: AttendWise

## Core Features:

- Company Creation with Subscription: Create a company document in Firestore with subscription details (plan, userLimit, recordLimit, usedSlots).
- User Limit Validation: Read the company document to display and validate user limits before inviting new users.
- Invitation Flow: Global Admin can invite new users with roles allowed by their plan. Invited users are created with a 'pending' status.
- Firestore Transaction - Invitation: Transaction to re-verify user limits, create a 'pending' user document, and update the company's usedSlots counter.
- Member Activation Flow: New user activates their account by providing company code and setting a password.
- Firestore Transaction - Activation: Transaction to find the 'pending' user, create a Firebase Auth account, and update the user document status to 'active'.
- Attendance Summarization: Use a LLM tool to create weekly/monthly attendance summaries with at-risk attendance patterns surfaced for managers and global admins

## Style Guidelines:

- Primary color: Vibrant orange (#FF9800) to convey energy and optimism, fitting for a modern attendance system.
- Background color: Light gray (#F5F5F5), providing a neutral backdrop that enhances readability and reduces eye strain.
- Accent color: White (#FFFFFF) for highlights and key interactive elements, ensuring clarity and focus.
- Font pairing: 'Roboto' (sans-serif) for both headlines and body text to maintain a clean and accessible appearance.
- Code font: 'Source Code Pro' for any instances of displaying code or company ID snippets, ensuring readability and distinction.
- Use simple, geometric icons to represent attendance status, roles, and actions, maintaining a consistent and intuitive user experience.
- Subtle transitions and loading animations to provide feedback during data processing and minimize perceived wait times, enhancing user satisfaction.
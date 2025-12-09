# Firebase Setup Guide for ElderEase

Follow these steps to configure Firebase for the ElderEase system.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `elderease` (or your preferred name)
4. Disable Google Analytics (optional)
5. Click **"Create project"**

## Step 2: Register Your Web App

1. In your Firebase project dashboard, click the **Web icon** (`</>`)
2. Register app with nickname: `ElderEase Web App`
3. **Do NOT** check "Also set up Firebase Hosting"
4. Click **"Register app"**
5. Copy the `firebaseConfig` object (you'll need these values)

## Step 3: Enable Authentication

1. In Firebase Console, go to **Build → Authentication**
2. Click **"Get started"**
3. Go to **"Sign-in method"** tab
4. Enable **"Email/Password"** provider
5. Click **"Save"**

## Step 4: Create Firestore Database

1. In Firebase Console, go to **Build → Firestore Database**
2. Click **"Create database"**
3. Select **"Start in test mode"** (for development)
4. Choose your preferred location
5. Click **"Enable"**

## Step 5: Enable Storage

1. In Firebase Console, go to **Build → Storage**
2. Click **"Get started"**
3. Select **"Start in test mode"** (for development)
4. Click **"Done"**

## Step 6: Configure Environment Variables

1. In your project root directory, create a file named `.env.local`
2. Add the following content (replace with your actual Firebase config values):

\`\`\`env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
\`\`\`

### Where to Find These Values:

1. Go to Firebase Console → Project Settings (gear icon)
2. Scroll down to **"Your apps"** section
3. Find your web app and click the config icon
4. Copy each value to your `.env.local` file

## Step 7: Restart Development Server

After creating `.env.local`, restart your development server:

\`\`\`bash
# Stop the server (Ctrl+C in terminal)
# Then restart:
npm run dev
\`\`\`

## Step 8: Set Up Firestore Security Rules (Production)

For production, update your Firestore rules:

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Clinics collection
    match /clinics/{clinicId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'clinic';
    }
    
    // Medicines collection
    match /medicines/{medicineId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'clinic';
    }
    
    // Orders collection
    match /orders/{orderId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
    
    // Posts collection
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Messages collection
    match /messages/{messageId} {
      allow read, write: if request.auth != null;
    }
    
    // Events collection
    match /events/{eventId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'clinic';
    }
    
    // Tutorials collection rules
    match /tutorials/{tutorialId} {
      allow read: if request.auth != null;
      // Allow create for authenticated users; enforce fields
      allow create: if request.auth != null
        && request.resource.data.keys().hasAll(['title','progress','favorites','completed','createdAt'])
        && request.resource.data.title is string
        && request.resource.data.progress is number
        && request.resource.data.favorites is bool
        && request.resource.data.completed is bool
        && request.resource.data.createdAt is timestamp;

      // Allow update only by authenticated users and restrict field types
      allow update: if request.auth != null
        && request.resource.data.title is string
        && request.resource.data.progress is number
        && request.resource.data.favorites is bool
        && request.resource.data.completed is bool;

      // Allow delete only for authenticated users with role 'clinic' or admin flag in user doc
      allow delete: if request.auth != null
        && (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'clinic'
            || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
    }
  }
}
\`\`\`

## Troubleshooting

### Error: "Firebase: Error (auth/invalid-api-key)"
- Make sure `.env.local` file exists in the root directory
- Verify all environment variables are correctly copied
- Restart the development server after creating `.env.local`

### Error: "Missing permissions"
- Check that Firestore is in "test mode" for development
- For production, update security rules as shown above

### Error: "Storage upload failed"
- Verify Storage is enabled in Firebase Console
- Check Storage rules are set to test mode

## Next Steps

Once Firebase is configured:

1. Access the app at `http://localhost:3000`
2. Register accounts for each portal:
   - Clinic: `http://localhost:3000/clinic/register`
   - Elder: `http://localhost:3000/elder/register`
   - Rider: `http://localhost:3000/rider/register`
3. Start using the ElderEase system!

## Support

If you encounter issues, check:
- Firebase Console for any error messages
- Browser console (F12) for detailed error logs
- Ensure all Firebase services are enabled

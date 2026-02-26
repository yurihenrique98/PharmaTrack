# Firebase Frontend Setup
1. Create a file named '.env.local' in the root directory.
2. Add the following keys (values can be found in Firebase Console > Project Settings):

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Security Rules
The rules in 'firestore.rules' should be copied and pasted into the 
Firebase Console 'Rules' tab to ensure Role-Based Access Control (RBAC) works.
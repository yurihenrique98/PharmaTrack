# Firebase Frontend Setup
1. Create a file named '.env.local' in the root directory.
2. Add the following keys (values can be found in Firebase Console > Project Settings):

NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Security Rules
The rules in 'firestore.rules' should be copied and pasted into the 
Firebase Console 'Rules' tab to ensure Role-Based Access Control (RBAC) works.

// Uses a service account JSON file or environment variable.
// Runtime is Node (not Edge).
import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import * as path from "path";

let app: App;
if (!getApps().length) {
  let credential;

  // Use environment variable first (better for deployment)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const svc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      credential = cert(svc);
      console.log('Initializing Firebase Admin with project:', svc.project_id);
    } catch (envError) {
      console.error('Failed to parse service account JSON from environment variable:', envError);
      throw new Error(`Failed to parse service account json file: ${envError}`);
    }
  } else {
    // Fallback to service account file (for local development)
    try {
      const serviceAccountPath = path.join(process.cwd(), 'ah-testimony-library-firebase-adminsdk-fbsvc-b2539354b4.json');
      credential = cert(serviceAccountPath);
      console.log('Using service account file:', serviceAccountPath);
    } catch (fileError) {
      console.error('Service account file not found and no environment variable set:', fileError);
      throw new Error(`Failed to initialize Firebase Admin: File error: ${fileError}`);
    }
  }

  app = initializeApp({ credential });
  console.log('Firebase Admin initialized successfully');
} else {
  app = getApps()[0]!;
  console.log('Using existing Firebase Admin app');
}

export const db = getFirestore(app);
export const adminAuth = getAuth(app);
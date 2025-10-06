// Uses a service account JSON file or environment variable.
// Runtime is Node (not Edge).
import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import * as path from "path";

let app: App;
if (!getApps().length) {
  let credential;

  // Try using service account file first
  try {
    const serviceAccountPath = path.join(process.cwd(), 'ah-testimony-library-firebase-adminsdk-fbsvc-b2539354b4.json');
    credential = cert(serviceAccountPath);
    console.log('Using service account file:', serviceAccountPath);
  } catch (fileError) {
    // Fallback to environment variable
    try {
      const svc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON!);
      credential = cert(svc);
      console.log('Using service account from environment variable');
    } catch (envError) {
      throw new Error(`Failed to initialize Firebase Admin: File error: ${fileError}, Env error: ${envError}`);
    }
  }

  app = initializeApp({ credential });
} else {
  app = getApps()[0]!;
}

export const db = getFirestore(app);
export const adminAuth = getAuth(app);
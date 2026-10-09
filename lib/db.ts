import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { env, optionalEnv } from './env';

let instance: Firestore | undefined;

// Lazy singleton. A service-account key from env when present, otherwise Application Default Credentials (Cloud Run).
export function db(): Firestore {
  if (instance) return instance;
  const privateKey = optionalEnv('FIREBASE_PRIVATE_KEY');
  const app = getApps()[0] ?? initializeApp(
    privateKey
      ? {
          credential: cert({
            projectId: env('FIREBASE_PROJECT_ID'),
            clientEmail: env('FIREBASE_CLIENT_EMAIL'),
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
        }
      : { credential: applicationDefault(), projectId: optionalEnv('FIREBASE_PROJECT_ID') },
  );
  const firestore = getFirestore(app);
  firestore.settings({ ignoreUndefinedProperties: true });
  instance = firestore;
  return firestore;
}

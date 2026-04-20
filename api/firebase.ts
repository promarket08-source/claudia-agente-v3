import admin from "firebase-admin";

let db: admin.firestore.Firestore | null = null;

export function initFirebase(): void {
  if (admin.apps.length === 0 && process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      db = admin.firestore();
      console.log("🔥 Firebase conectado");
    } catch (e: any) {
      console.error("❌ Firebase init error:", e.message);
    }
  }
}

export async function getTareas(): Promise<any[]> {
  try {
    if (!db) return [];
    const snapshot = await db.collection("tareas").get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch {
    console.log("⚠️ Error getting tareas - returning empty");
    return [];
  }
}

export async function getClientes(): Promise<any[]> {
  try {
    if (!db) return [];
    const snapshot = await db.collection("clientes").get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch {
    console.log("⚠️ Error getting clientes - returning empty");
    return [];
  }
}
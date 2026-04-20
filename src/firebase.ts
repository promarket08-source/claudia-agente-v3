import admin from "firebase-admin";

let db: admin.firestore.Firestore | null = null;

export function initFirebase(): void {
  if (admin.apps.length === 0 && process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (e) {
      console.error("Firebase init error:", e);
    }
  }
  db = admin.firestore();
}

export function getFirestore(): admin.firestore.Firestore {
  if (!db) initFirebase();
  return db!;
}

export interface Tarea {
  id?: string;
  titulo: string;
  descripcion?: string;
  estado?: "pendiente" | "completada" | "en-progreso";
  createdAt?: string;
  updatedAt?: string;
}

export interface Cliente {
  id?: string;
  nombre: string;
  telefono: string;
  email?: string;
  interes?: string;
  presupuesto?: string;
  notas?: string;
  source?: string;
  createdAt?: string;
}

export async function getTareas(): Promise<Tarea[]> {
  try {
    const firestore = getFirestore();
    if (!firestore) return [];
    const snapshot = await firestore.collection("tareas").get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Tarea[];
  } catch {
    console.error("Error getting tareas:");
    return [];
  }
}

export async function getClientes(): Promise<Cliente[]> {
  try {
    const firestore = getFirestore();
    if (!firestore) return [];
    const snapshot = await firestore.collection("clientes").get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Cliente[];
  } catch {
    console.error("Error getting clientes:");
    return [];
  }
}
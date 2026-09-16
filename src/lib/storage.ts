import { Firestore } from '@google-cloud/firestore';
import {
  OpenItem,
  ADR,
  StrategyDoc,
  Deliverable,
  ActivityEvent,
} from './types';
import {
  initialStrategy,
  initialADRs,
  initialOpenItems,
  initialDeliverables,
  initialActivities,
} from './seed-data';
import fs from 'fs';
import path from 'path';

// Local storage fallback file path
const LOCAL_STORAGE_DIR = path.join(process.cwd(), '.data');
const LOCAL_STORAGE_FILE = path.join(LOCAL_STORAGE_DIR, 'hub-data.json');

interface DatabaseStore {
  strategy: StrategyDoc;
  adrs: ADR[];
  openItems: OpenItem[];
  deliverables: Deliverable[];
  activities: ActivityEvent[];
}

// In-memory fallback
let memoryStore: DatabaseStore | null = null;

function getLocalStore(): DatabaseStore {
  if (memoryStore) return memoryStore;

  try {
    if (fs.existsSync(LOCAL_STORAGE_FILE)) {
      const data = fs.readFileSync(LOCAL_STORAGE_FILE, 'utf-8');
      memoryStore = JSON.parse(data);
      return memoryStore!;
    }
  } catch (err) {
    console.warn('Could not read local store file, initializing default store.', err);
  }

  memoryStore = {
    strategy: initialStrategy,
    adrs: initialADRs,
    openItems: initialOpenItems,
    deliverables: initialDeliverables,
    activities: initialActivities,
  };

  saveLocalStore(memoryStore);
  return memoryStore;
}

function saveLocalStore(store: DatabaseStore) {
  try {
    if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
      fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
    }
    fs.writeFileSync(LOCAL_STORAGE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not persist local store to disk:', err);
  }
}

// Check if Firestore should be activated
const isFirestoreConfigured = Boolean(
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.GCP_PROJECT_ID ||
  process.env.FIRESTORE_EMULATOR_HOST
);

let firestoreClient: Firestore | null = null;

function getFirestore(): Firestore | null {
  if (!isFirestoreConfigured) return null;
  if (!firestoreClient) {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT_ID;
    firestoreClient = new Firestore({
      projectId: projectId || undefined,
    });
  }
  return firestoreClient;
}

// --- Strategy Store ---
export async function getStrategy(): Promise<StrategyDoc> {
  const db = getFirestore();
  if (db) {
    try {
      const doc = await db.collection('settings').doc('strategy').get();
      if (doc.exists) {
        return doc.data() as StrategyDoc;
      }
      // Seed if not exists
      await db.collection('settings').doc('strategy').set(initialStrategy);
      return initialStrategy;
    } catch (e) {
      console.warn('Firestore read failed for strategy, using fallback', e);
    }
  }
  return getLocalStore().strategy;
}

export async function updateStrategy(updated: Partial<StrategyDoc>): Promise<StrategyDoc> {
  const current = await getStrategy();
  const merged: StrategyDoc = {
    ...current,
    ...updated,
    updatedAt: new Date().toISOString(),
  };

  const db = getFirestore();
  if (db) {
    try {
      await db.collection('settings').doc('strategy').set(merged, { merge: true });
      return merged;
    } catch (e) {
      console.warn('Firestore write failed for strategy, using local fallback', e);
    }
  }

  const store = getLocalStore();
  store.strategy = merged;
  saveLocalStore(store);
  return merged;
}

// --- Open Items Store ---
export async function getOpenItems(): Promise<OpenItem[]> {
  const db = getFirestore();
  if (db) {
    try {
      const snapshot = await db.collection('openItems').orderBy('createdAt', 'desc').get();
      if (!snapshot.empty) {
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OpenItem));
      }
      // Seed if empty
      for (const item of initialOpenItems) {
        await db.collection('openItems').doc(item.id).set(item);
      }
      return initialOpenItems;
    } catch (e) {
      console.warn('Firestore read failed for openItems, using local fallback', e);
    }
  }
  return getLocalStore().openItems;
}

export async function createOpenItem(item: Omit<OpenItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<OpenItem> {
  const id = `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const newItem: OpenItem = {
    ...item,
    id,
    createdAt: now,
    updatedAt: now,
  };

  const db = getFirestore();
  if (db) {
    try {
      await db.collection('openItems').doc(id).set(newItem);
      return newItem;
    } catch (e) {
      console.warn('Firestore write failed for openItem, using fallback', e);
    }
  }

  const store = getLocalStore();
  store.openItems.unshift(newItem);
  saveLocalStore(store);
  return newItem;
}

export async function updateOpenItem(id: string, updates: Partial<OpenItem>): Promise<OpenItem | null> {
  const now = new Date().toISOString();
  const db = getFirestore();
  if (db) {
    try {
      const ref = db.collection('openItems').doc(id);
      const doc = await ref.get();
      if (doc.exists) {
        const updated = { ...doc.data(), ...updates, updatedAt: now } as OpenItem;
        await ref.update({ ...updates, updatedAt: now });
        return updated;
      }
    } catch (e) {
      console.warn('Firestore update failed for openItem, using fallback', e);
    }
  }

  const store = getLocalStore();
  const index = store.openItems.findIndex(i => i.id === id);
  if (index === -1) return null;
  store.openItems[index] = {
    ...store.openItems[index],
    ...updates,
    updatedAt: now,
  };
  saveLocalStore(store);
  return store.openItems[index];
}

export async function deleteOpenItem(id: string): Promise<boolean> {
  const db = getFirestore();
  if (db) {
    try {
      await db.collection('openItems').doc(id).delete();
    } catch (e) {
      console.warn('Firestore delete failed for openItem', e);
    }
  }

  const store = getLocalStore();
  store.openItems = store.openItems.filter(i => i.id !== id);
  saveLocalStore(store);
  return true;
}

// --- ADRs Store ---
export async function getADRs(): Promise<ADR[]> {
  const db = getFirestore();
  if (db) {
    try {
      const snapshot = await db.collection('adrs').orderBy('number', 'desc').get();
      if (!snapshot.empty) {
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ADR));
      }
      // Seed
      for (const adr of initialADRs) {
        await db.collection('adrs').doc(adr.id).set(adr);
      }
      return initialADRs;
    } catch (e) {
      console.warn('Firestore read failed for ADRs, using fallback', e);
    }
  }
  return getLocalStore().adrs;
}

export async function createADR(adr: Omit<ADR, 'id' | 'number' | 'createdAt' | 'updatedAt'>): Promise<ADR> {
  const current = await getADRs();
  const nextNum = current.length > 0 ? Math.max(...current.map(a => a.number || 0)) + 1 : 1;
  const id = `adr-${String(nextNum).padStart(3, '0')}`;
  const now = new Date().toISOString();
  const newADR: ADR = {
    ...adr,
    id,
    number: nextNum,
    createdAt: now,
    updatedAt: now,
  };

  const db = getFirestore();
  if (db) {
    try {
      await db.collection('adrs').doc(id).set(newADR);
      return newADR;
    } catch (e) {
      console.warn('Firestore write failed for ADR, using fallback', e);
    }
  }

  const store = getLocalStore();
  store.adrs.unshift(newADR);
  saveLocalStore(store);
  return newADR;
}

export async function updateADR(id: string, updates: Partial<ADR>): Promise<ADR | null> {
  const now = new Date().toISOString();
  const db = getFirestore();
  if (db) {
    try {
      const ref = db.collection('adrs').doc(id);
      const doc = await ref.get();
      if (doc.exists) {
        const updated = { ...doc.data(), ...updates, updatedAt: now } as ADR;
        await ref.update({ ...updates, updatedAt: now });
        return updated;
      }
    } catch (e) {
      console.warn('Firestore update failed for ADR, using fallback', e);
    }
  }

  const store = getLocalStore();
  const index = store.adrs.findIndex(a => a.id === id);
  if (index === -1) return null;
  store.adrs[index] = {
    ...store.adrs[index],
    ...updates,
    updatedAt: now,
  };
  saveLocalStore(store);
  return store.adrs[index];
}

// --- Deliverables Store ---
export async function getDeliverables(): Promise<Deliverable[]> {
  const db = getFirestore();
  if (db) {
    try {
      const snapshot = await db.collection('deliverables').orderBy('createdAt', 'desc').get();
      if (!snapshot.empty) {
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deliverable));
      }
      for (const del of initialDeliverables) {
        await db.collection('deliverables').doc(del.id).set(del);
      }
      return initialDeliverables;
    } catch (e) {
      console.warn('Firestore read failed for deliverables, using fallback', e);
    }
  }
  return getLocalStore().deliverables;
}

export async function createDeliverable(del: Omit<Deliverable, 'id' | 'createdAt' | 'updatedAt'>): Promise<Deliverable> {
  const id = `del-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const newDel: Deliverable = {
    ...del,
    id,
    createdAt: now,
    updatedAt: now,
  };

  const db = getFirestore();
  if (db) {
    try {
      await db.collection('deliverables').doc(id).set(newDel);
      return newDel;
    } catch (e) {
      console.warn('Firestore write failed for deliverable, using fallback', e);
    }
  }

  const store = getLocalStore();
  store.deliverables.unshift(newDel);
  saveLocalStore(store);
  return newDel;
}

export async function deleteDeliverable(id: string): Promise<boolean> {
  const db = getFirestore();
  if (db) {
    try {
      await db.collection('deliverables').doc(id).delete();
    } catch (e) {
      console.warn('Firestore delete failed for deliverable', e);
    }
  }

  const store = getLocalStore();
  store.deliverables = store.deliverables.filter(d => d.id !== id);
  saveLocalStore(store);
  return true;
}

// --- Activity Log Store ---
export async function getActivities(limit = 50): Promise<ActivityEvent[]> {
  const db = getFirestore();
  if (db) {
    try {
      const snapshot = await db.collection('activities').orderBy('timestamp', 'desc').limit(limit).get();
      if (!snapshot.empty) {
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityEvent));
      }
      for (const act of initialActivities) {
        await db.collection('activities').doc(act.id).set(act);
      }
      return initialActivities;
    } catch (e) {
      console.warn('Firestore read failed for activities, using fallback', e);
    }
  }
  return getLocalStore().activities.slice(0, limit);
}

export async function logActivity(event: Omit<ActivityEvent, 'id' | 'timestamp'>): Promise<ActivityEvent> {
  const id = `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const newEvent: ActivityEvent = {
    ...event,
    id,
    timestamp: now,
  };

  const db = getFirestore();
  if (db) {
    try {
      await db.collection('activities').doc(id).set(newEvent);
    } catch (e) {
      console.warn('Firestore write failed for activity', e);
    }
  }

  const store = getLocalStore();
  store.activities.unshift(newEvent);
  if (store.activities.length > 200) {
    store.activities = store.activities.slice(0, 200);
  }
  saveLocalStore(store);
  return newEvent;
}

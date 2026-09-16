import { Firestore } from '@google-cloud/firestore';
import {
  Project,
  OpenItem,
  ADR,
  StrategyDoc,
  Deliverable,
  ActivityEvent,
} from './types';
import {
  initialProjects,
  initialStrategy,
  createBlankStrategy,
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
  projects: Project[];
  strategies: Record<string, StrategyDoc>; // keyed by projectId
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
      const parsed = JSON.parse(data);
      if (parsed.projects && Array.isArray(parsed.projects)) {
        memoryStore = parsed;
        return memoryStore!;
      }
    }
  } catch (err) {
    console.warn('Could not read local store file, initializing default store.', err);
  }

  memoryStore = {
    projects: initialProjects,
    strategies: {
      'proj-mohawk': initialStrategy,
    },
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

// ==========================================
// Projects Store
// ==========================================
export async function getProjects(): Promise<Project[]> {
  const db = getFirestore();
  if (db) {
    try {
      const snapshot = await db.collection('projects').orderBy('createdAt', 'desc').get();
      if (!snapshot.empty) {
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      }
      for (const p of initialProjects) {
        await db.collection('projects').doc(p.id).set(p);
      }
      return initialProjects;
    } catch (e) {
      console.warn('Firestore read failed for projects, using fallback', e);
    }
  }
  return getLocalStore().projects;
}

export async function getProject(id: string): Promise<Project | null> {
  const projects = await getProjects();
  return projects.find(p => p.id === id) || null;
}

export async function createProject(project: {
  name: string;
  key: string;
  description: string;
  accentColor?: string;
}): Promise<Project> {
  const id = `proj-${project.key.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString(36)}`;
  const now = new Date().toISOString();
  const newProject: Project = {
    ...project,
    id,
    createdAt: now,
    updatedAt: now,
    status: 'active',
  };

  const db = getFirestore();
  if (db) {
    try {
      await db.collection('projects').doc(id).set(newProject);
      // Initialize blank strategy for new project
      const blankStrategy = createBlankStrategy(id, project.name);
      await db.collection('settings').doc(`strategy-${id}`).set(blankStrategy);
    } catch (e) {
      console.warn('Firestore write failed for project', e);
    }
  }

  const store = getLocalStore();
  store.projects.unshift(newProject);
  if (!store.strategies) store.strategies = {};
  store.strategies[id] = createBlankStrategy(id, project.name);
  saveLocalStore(store);

  return newProject;
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
  const now = new Date().toISOString();
  const db = getFirestore();
  if (db) {
    try {
      const ref = db.collection('projects').doc(id);
      await ref.update({ ...updates, updatedAt: now });
    } catch (e) {
      console.warn('Firestore update failed for project', e);
    }
  }

  const store = getLocalStore();
  const index = store.projects.findIndex(p => p.id === id);
  if (index === -1) return null;
  store.projects[index] = { ...store.projects[index], ...updates, updatedAt: now };
  saveLocalStore(store);
  return store.projects[index];
}

// ==========================================
// Strategy Store
// ==========================================
export async function getStrategy(projectId = 'proj-mohawk'): Promise<StrategyDoc> {
  const db = getFirestore();
  if (db) {
    try {
      const doc = await db.collection('settings').doc(`strategy-${projectId}`).get();
      if (doc.exists) {
        return doc.data() as StrategyDoc;
      }
      const blank = projectId === 'proj-mohawk' ? initialStrategy : createBlankStrategy(projectId);
      await db.collection('settings').doc(`strategy-${projectId}`).set(blank);
      return blank;
    } catch (e) {
      console.warn('Firestore read failed for strategy, using fallback', e);
    }
  }

  const store = getLocalStore();
  if (!store.strategies) store.strategies = {};
  if (!store.strategies[projectId]) {
    store.strategies[projectId] = projectId === 'proj-mohawk' ? initialStrategy : createBlankStrategy(projectId);
    saveLocalStore(store);
  }
  return store.strategies[projectId];
}

export async function updateStrategy(updated: Partial<StrategyDoc>, projectId = 'proj-mohawk'): Promise<StrategyDoc> {
  const current = await getStrategy(projectId);
  const merged: StrategyDoc = {
    ...current,
    ...updated,
    projectId,
    updatedAt: new Date().toISOString(),
  };

  const db = getFirestore();
  if (db) {
    try {
      await db.collection('settings').doc(`strategy-${projectId}`).set(merged, { merge: true });
      return merged;
    } catch (e) {
      console.warn('Firestore write failed for strategy, using local fallback', e);
    }
  }

  const store = getLocalStore();
  if (!store.strategies) store.strategies = {};
  store.strategies[projectId] = merged;
  saveLocalStore(store);
  return merged;
}

// ==========================================
// Open Items Store
// ==========================================
export async function getOpenItems(projectId?: string): Promise<OpenItem[]> {
  const db = getFirestore();
  if (db) {
    try {
      let query = db.collection('openItems').orderBy('createdAt', 'desc');
      if (projectId) {
        query = query.where('projectId', '==', projectId) as any;
      }
      const snapshot = await query.get();
      if (!snapshot.empty) {
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OpenItem));
      }
      if (!projectId || projectId === 'proj-mohawk') {
        for (const item of initialOpenItems) {
          await db.collection('openItems').doc(item.id).set(item);
        }
        return initialOpenItems;
      }
      return [];
    } catch (e) {
      console.warn('Firestore read failed for openItems, using local fallback', e);
    }
  }

  const allItems = getLocalStore().openItems;
  if (projectId) {
    return allItems.filter(i => (i.projectId || 'proj-mohawk') === projectId);
  }
  return allItems;
}

export async function createOpenItem(item: Omit<OpenItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<OpenItem> {
  const id = `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const newItem: OpenItem = {
    ...item,
    projectId: item.projectId || 'proj-mohawk',
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

// ==========================================
// ADRs Store
// ==========================================
export async function getADRs(projectId?: string): Promise<ADR[]> {
  const db = getFirestore();
  if (db) {
    try {
      let query = db.collection('adrs').orderBy('number', 'desc');
      if (projectId) {
        query = query.where('projectId', '==', projectId) as any;
      }
      const snapshot = await query.get();
      if (!snapshot.empty) {
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ADR));
      }
      if (!projectId || projectId === 'proj-mohawk') {
        for (const adr of initialADRs) {
          await db.collection('adrs').doc(adr.id).set(adr);
        }
        return initialADRs;
      }
      return [];
    } catch (e) {
      console.warn('Firestore read failed for ADRs, using fallback', e);
    }
  }

  const allADRs = getLocalStore().adrs;
  if (projectId) {
    return allADRs.filter(a => (a.projectId || 'proj-mohawk') === projectId);
  }
  return allADRs;
}

export async function createADR(adr: Omit<ADR, 'id' | 'number' | 'createdAt' | 'updatedAt'>): Promise<ADR> {
  const projectId = adr.projectId || 'proj-mohawk';
  const current = await getADRs(projectId);
  const nextNum = current.length > 0 ? Math.max(...current.map(a => a.number || 0)) + 1 : 1;
  const id = `adr-${projectId}-${String(nextNum).padStart(3, '0')}`;
  const now = new Date().toISOString();
  const newADR: ADR = {
    ...adr,
    id,
    projectId,
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

// ==========================================
// Deliverables Store
// ==========================================
export async function getDeliverables(projectId?: string): Promise<Deliverable[]> {
  const db = getFirestore();
  if (db) {
    try {
      let query = db.collection('deliverables').orderBy('createdAt', 'desc');
      if (projectId) {
        query = query.where('projectId', '==', projectId) as any;
      }
      const snapshot = await query.get();
      if (!snapshot.empty) {
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deliverable));
      }
      if (!projectId || projectId === 'proj-mohawk') {
        for (const del of initialDeliverables) {
          await db.collection('deliverables').doc(del.id).set(del);
        }
        return initialDeliverables;
      }
      return [];
    } catch (e) {
      console.warn('Firestore read failed for deliverables, using fallback', e);
    }
  }

  const allDel = getLocalStore().deliverables;
  if (projectId) {
    return allDel.filter(d => (d.projectId || 'proj-mohawk') === projectId);
  }
  return allDel;
}

export async function createDeliverable(del: Omit<Deliverable, 'id' | 'createdAt' | 'updatedAt'>): Promise<Deliverable> {
  const id = `del-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const newDel: Deliverable = {
    ...del,
    projectId: del.projectId || 'proj-mohawk',
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

// ==========================================
// Activity Log Store
// ==========================================
export async function getActivities(projectId?: string, limit = 50): Promise<ActivityEvent[]> {
  const db = getFirestore();
  if (db) {
    try {
      let query = db.collection('activities').orderBy('timestamp', 'desc');
      if (projectId) {
        query = query.where('projectId', '==', projectId) as any;
      }
      const snapshot = await query.limit(limit).get();
      if (!snapshot.empty) {
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityEvent));
      }
      if (!projectId || projectId === 'proj-mohawk') {
        for (const act of initialActivities) {
          await db.collection('activities').doc(act.id).set(act);
        }
        return initialActivities;
      }
      return [];
    } catch (e) {
      console.warn('Firestore read failed for activities, using fallback', e);
    }
  }

  const allActs = getLocalStore().activities;
  const filtered = projectId
    ? allActs.filter(a => (a.projectId || 'proj-mohawk') === projectId)
    : allActs;
  return filtered.slice(0, limit);
}

export async function logActivity(event: Omit<ActivityEvent, 'id' | 'timestamp'>): Promise<ActivityEvent> {
  const id = `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const newEvent: ActivityEvent = {
    ...event,
    projectId: event.projectId || 'proj-mohawk',
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

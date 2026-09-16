import { Firestore } from '@google-cloud/firestore';
import {
  Project,
  OpenItem,
  ADR,
  StrategyDoc,
  Deliverable,
  ActivityEvent,
  UserProfile,
  CollaboratorInvite,
  UserRole,
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
  users: UserProfile[];
  invites: CollaboratorInvite[];
}

// In-memory fallback
let memoryStore: DatabaseStore | null = null;
let isSaving = false;
let pendingSave = false;

function getLocalStore(): DatabaseStore {
  if (memoryStore) return memoryStore;

  try {
    if (fs.existsSync(LOCAL_STORAGE_FILE)) {
      const data = fs.readFileSync(LOCAL_STORAGE_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed.projects && Array.isArray(parsed.projects)) {
        if (!parsed.users) parsed.users = [];
        if (!parsed.invites) parsed.invites = [];
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
    users: [],
    invites: [],
  };

  scheduleSaveLocalStore(memoryStore);
  return memoryStore;
}

function scheduleSaveLocalStore(store: DatabaseStore) {
  if (isSaving) {
    pendingSave = true;
    return;
  }

  isSaving = true;
  try {
    if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
      fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
    }
    fs.writeFileSync(LOCAL_STORAGE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not persist local store to disk:', err);
  } finally {
    isSaving = false;
    if (pendingSave) {
      pendingSave = false;
      scheduleSaveLocalStore(store);
    }
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
      const snapshot = await db.collection('projects').get();
      if (!snapshot.empty) {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
  scheduleSaveLocalStore(store);

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
  scheduleSaveLocalStore(store);
  return store.projects[index];
}

export async function setDefaultProject(id: string): Promise<Project> {
  const projects = await getProjects();
  const target = projects.find(p => p.id === id);
  if (!target) throw new Error('Project not found');

  const now = new Date().toISOString();
  const db = getFirestore();
  if (db) {
    try {
      const snapshot = await db.collection('projects').get();
      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          isDefault: doc.id === id,
          updatedAt: now,
        });
      });
      await batch.commit();
    } catch (e) {
      console.warn('Firestore setDefaultProject failed', e);
    }
  }

  const store = getLocalStore();
  store.projects.forEach(p => {
    p.isDefault = p.id === id;
  });
  scheduleSaveLocalStore(store);

  return { ...target, isDefault: true, updatedAt: now };
}

export async function deleteProject(id: string): Promise<boolean> {
  const projects = await getProjects();
  if (projects.length <= 1) {
    throw new Error('Cannot delete the last remaining project workspace.');
  }

  const target = projects.find(p => p.id === id);
  if (target?.isDefault) {
    throw new Error('Cannot delete the active default workspace. Promote another workspace to default first.');
  }

  const db = getFirestore();
  if (db) {
    try {
      await db.collection('projects').doc(id).delete();
      await db.collection('settings').doc(`strategy-${id}`).delete();

      const collections = ['items', 'decisions', 'deliverables', 'activity'];
      for (const collName of collections) {
        const snapshot = await db.collection(collName).where('projectId', '==', id).get();
        if (!snapshot.empty) {
          const batch = db.batch();
          snapshot.docs.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
        }
      }
    } catch (e) {
      console.warn('Firestore delete failed for project', e);
    }
  }

  const store = getLocalStore();
  store.projects = store.projects.filter(p => p.id !== id);
  if (store.strategies && store.strategies[id]) {
    delete store.strategies[id];
  }
  store.openItems = store.openItems.filter(i => i.projectId !== id);
  store.adrs = store.adrs.filter(d => d.projectId !== id);
  store.deliverables = store.deliverables.filter(d => d.projectId !== id);
  store.activities = store.activities.filter(a => a.projectId !== id);
  scheduleSaveLocalStore(store);

  return true;
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
    scheduleSaveLocalStore(store);
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
  scheduleSaveLocalStore(store);
  return merged;
}

// ==========================================
// Open Items Store (Composite-Index Safe)
// ==========================================
export async function getOpenItems(projectId?: string): Promise<OpenItem[]> {
  const db = getFirestore();
  if (db) {
    try {
      let snapshot;
      if (projectId) {
        // Query by single field to avoid composite index requirement in Firestore
        snapshot = await db.collection('openItems').where('projectId', '==', projectId).get();
      } else {
        snapshot = await db.collection('openItems').get();
      }

      if (!snapshot.empty) {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OpenItem));
        // In-memory sort by createdAt descending
        return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
  const filtered = projectId
    ? allItems.filter(i => (i.projectId || 'proj-mohawk') === projectId)
    : allItems;
  return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
  scheduleSaveLocalStore(store);
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
  scheduleSaveLocalStore(store);
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
  scheduleSaveLocalStore(store);
  return true;
}

// ==========================================
// ADRs Store (Composite-Index Safe)
// ==========================================
export async function getADRs(projectId?: string): Promise<ADR[]> {
  const db = getFirestore();
  if (db) {
    try {
      let snapshot;
      if (projectId) {
        snapshot = await db.collection('adrs').where('projectId', '==', projectId).get();
      } else {
        snapshot = await db.collection('adrs').get();
      }

      if (!snapshot.empty) {
        const adrs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ADR));
        return adrs.sort((a, b) => (b.number || 0) - (a.number || 0));
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
  const filtered = projectId
    ? allADRs.filter(a => (a.projectId || 'proj-mohawk') === projectId)
    : allADRs;
  return filtered.sort((a, b) => (b.number || 0) - (a.number || 0));
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
  scheduleSaveLocalStore(store);
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
  scheduleSaveLocalStore(store);
  return store.adrs[index];
}

// ==========================================
// Deliverables Store (Composite-Index Safe)
// ==========================================
export async function getDeliverables(projectId?: string): Promise<Deliverable[]> {
  const db = getFirestore();
  if (db) {
    try {
      let snapshot;
      if (projectId) {
        snapshot = await db.collection('deliverables').where('projectId', '==', projectId).get();
      } else {
        snapshot = await db.collection('deliverables').get();
      }

      if (!snapshot.empty) {
        const delivs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deliverable));
        return delivs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
  const filtered = projectId
    ? allDel.filter(d => (d.projectId || 'proj-mohawk') === projectId)
    : allDel;
  return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
  scheduleSaveLocalStore(store);
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
  scheduleSaveLocalStore(store);
  return true;
}

// ==========================================
// Activity Log Store (Composite-Index Safe)
// ==========================================
export async function getActivities(projectId?: string, limit = 50): Promise<ActivityEvent[]> {
  const db = getFirestore();
  if (db) {
    try {
      let snapshot;
      if (projectId) {
        snapshot = await db.collection('activities').where('projectId', '==', projectId).get();
      } else {
        snapshot = await db.collection('activities').get();
      }

      if (!snapshot.empty) {
        const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityEvent));
        const sorted = events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return sorted.slice(0, limit);
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
  return filtered
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
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
  scheduleSaveLocalStore(store);
  return newEvent;
}

// ==========================================
// Users & Collaborator RBAC Store
// ==========================================
export async function getUsers(): Promise<UserProfile[]> {
  const db = getFirestore();
  if (db) {
    try {
      const snapshot = await db.collection('users').get();
      if (!snapshot.empty) {
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
      }
    } catch (e) {
      console.warn('Firestore read failed for users, using fallback', e);
    }
  }
  return getLocalStore().users || [];
}

export async function getUser(emailOrId: string): Promise<UserProfile | null> {
  const normalized = emailOrId.toLowerCase().trim();
  const users = await getUsers();
  return users.find(u => u.email.toLowerCase() === normalized || u.id === emailOrId) || null;
}

export async function upsertUser(data: Partial<UserProfile> & { email: string }): Promise<UserProfile> {
  const normalizedEmail = data.email.toLowerCase().trim();
  const existing = await getUser(normalizedEmail);
  const now = new Date().toISOString();

  const allUsers = await getUsers();
  const isFirstUserEver = allUsers.length === 0;
  const isExplicitAdmin = (process.env.ADMIN_EMAIL || '').toLowerCase().trim() === normalizedEmail;

  // Root admin bootstrapping: first user or configured admin email becomes 'admin'
  let role: UserRole = data.role || existing?.role || (isFirstUserEver || isExplicitAdmin ? 'admin' : 'member');
  let assignedProjectIds = data.assignedProjectIds || existing?.assignedProjectIds || (role === 'admin' ? ['*'] : ['proj-mohawk']);

  // Check if invited
  const invites = await getCollaboratorInvites();
  const matchingInvite = invites.find(i => i.email.toLowerCase() === normalizedEmail);
  if (matchingInvite) {
    role = matchingInvite.role;
    assignedProjectIds = matchingInvite.assignedProjectIds;
  }

  const id = existing?.id || data.id || `usr-${normalizedEmail.replace(/[^a-z0-9]/g, '')}`;

  const updatedUser: UserProfile = {
    id,
    email: normalizedEmail,
    name: data.name || existing?.name || normalizedEmail.split('@')[0],
    image: data.image || existing?.image,
    role,
    assignedProjectIds,
    defaultProjectId: data.defaultProjectId || existing?.defaultProjectId,
    status: 'active',
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    lastLoginAt: now,
  };

  const db = getFirestore();
  if (db) {
    try {
      await db.collection('users').doc(id).set(updatedUser, { merge: true });
    } catch (e) {
      console.warn('Firestore write failed for user', e);
    }
  }

  const store = getLocalStore();
  if (!store.users) store.users = [];
  const idx = store.users.findIndex(u => u.email.toLowerCase() === normalizedEmail || u.id === id);
  if (idx >= 0) {
    store.users[idx] = updatedUser;
  } else {
    store.users.push(updatedUser);
  }
  scheduleSaveLocalStore(store);

  return updatedUser;
}

export async function getCollaboratorInvites(): Promise<CollaboratorInvite[]> {
  const db = getFirestore();
  if (db) {
    try {
      const snapshot = await db.collection('invites').get();
      if (!snapshot.empty) {
        return snapshot.docs.map(d => ({ email: d.id, ...d.data() } as CollaboratorInvite));
      }
    } catch (e) {
      console.warn('Firestore read failed for invites', e);
    }
  }
  return getLocalStore().invites || [];
}

export async function inviteCollaborator(invite: CollaboratorInvite): Promise<CollaboratorInvite> {
  const normalizedEmail = invite.email.toLowerCase().trim();
  const cleanInvite: CollaboratorInvite = {
    ...invite,
    email: normalizedEmail,
    invitedAt: new Date().toISOString(),
  };

  const db = getFirestore();
  if (db) {
    try {
      await db.collection('invites').doc(normalizedEmail).set(cleanInvite);
    } catch (e) {
      console.warn('Firestore invite save failed', e);
    }
  }

  const store = getLocalStore();
  if (!store.invites) store.invites = [];
  const idx = store.invites.findIndex(i => i.email.toLowerCase() === normalizedEmail);
  if (idx >= 0) {
    store.invites[idx] = cleanInvite;
  } else {
    store.invites.push(cleanInvite);
  }
  scheduleSaveLocalStore(store);

  // If user already registered, update their assigned projects & role
  const existingUser = await getUser(normalizedEmail);
  if (existingUser) {
    await upsertUser({
      ...existingUser,
      role: cleanInvite.role,
      assignedProjectIds: cleanInvite.assignedProjectIds,
    });
  }

  return cleanInvite;
}

export async function deleteCollaborator(email: string): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();
  const db = getFirestore();
  if (db) {
    try {
      await db.collection('invites').doc(normalizedEmail).delete();
      const userSnap = await db.collection('users').where('email', '==', normalizedEmail).get();
      const batch = db.batch();
      userSnap.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    } catch (e) {
      console.warn('Firestore delete invite failed', e);
    }
  }

  const store = getLocalStore();
  if (store.invites) {
    store.invites = store.invites.filter(i => i.email.toLowerCase() !== normalizedEmail);
  }
  if (store.users) {
    store.users = store.users.filter(u => u.email.toLowerCase() !== normalizedEmail);
  }
  scheduleSaveLocalStore(store);
  return true;
}

export async function setUserDefaultProject(email: string, projectId: string): Promise<UserProfile | null> {
  const normalized = email.toLowerCase().trim();
  const user = await getUser(normalized);
  if (!user) return null;

  return upsertUser({
    ...user,
    defaultProjectId: projectId,
  });
}


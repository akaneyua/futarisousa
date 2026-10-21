import {
  SituationInvestigation,
  CharacterClass,
  CharacterSkill,
  GuestCharacter,
  SessionSummary,
  SessionNote
} from '../types.ts';

export interface AppDataBundle {
  situations: SituationInvestigation[];
  characterClasses: CharacterClass[];
  signatureSkills: CharacterSkill[];
  autoSkills: CharacterSkill[];
  guests: GuestCharacter[];
  sessionSummaries: SessionSummary[];
  sessionNotes: SessionNote[];
  updatedAt: string;
}

const DB_NAME = 'FutarisousaDossierDB';
const DB_VERSION = 1;
const STORE_NAME = 'app_data';
const DATA_KEY = 'main_bundle';
const LOCAL_STORAGE_KEY = 'futarisousa_persistent_data_backup_v1';

// Open IndexedDB instance safely
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not available'));
      return;
    }
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed to open IndexedDB'));
  });
}

// Save complete bundle to IndexedDB & LocalStorage
export async function savePersistentData(data: Partial<AppDataBundle>): Promise<void> {
  // Read existing bundle first so partial updates NEVER wipe out other stores!
  let existing: AppDataBundle | null = null;
  try {
    existing = await loadPersistentData();
  } catch {
    // ignore
  }

  const bundle: AppDataBundle = {
    situations: data.situations !== undefined ? data.situations : (existing?.situations || []),
    characterClasses: data.characterClasses !== undefined ? data.characterClasses : (existing?.characterClasses || []),
    signatureSkills: data.signatureSkills !== undefined ? data.signatureSkills : (existing?.signatureSkills || []),
    autoSkills: data.autoSkills !== undefined ? data.autoSkills : (existing?.autoSkills || []),
    guests: data.guests !== undefined ? data.guests : (existing?.guests || []),
    sessionSummaries: data.sessionSummaries !== undefined ? data.sessionSummaries : (existing?.sessionSummaries || []),
    sessionNotes: data.sessionNotes !== undefined ? data.sessionNotes : (existing?.sessionNotes || []),
    updatedAt: new Date().toISOString()
  };

  // 1. Save to IndexedDB
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(bundle, DATA_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[PersistentStorage] Failed to save to IndexedDB:', err);
  }

  // 2. Also save to LocalStorage as immediate fallback (safely ignoring quota issues)
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      // Create a lightweight version if images are huge
      const serialized = JSON.stringify(bundle);
      window.localStorage.setItem(LOCAL_STORAGE_KEY, serialized);
    }
  } catch (err) {
    console.warn('[PersistentStorage] Failed to save to LocalStorage fallback:', err);
  }
}

// Load complete bundle from IndexedDB or LocalStorage fallback
export async function loadPersistentData(): Promise<AppDataBundle | null> {
  // 1. Try IndexedDB first
  try {
    const db = await openDB();
    const result = await new Promise<AppDataBundle | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(DATA_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
    if (result && typeof result === 'object' && Array.isArray(result.situations)) {
      return result;
    }
  } catch (err) {
    console.warn('[PersistentStorage] Failed to load from IndexedDB, trying LocalStorage fallback:', err);
  }

  // 2. Try LocalStorage fallback
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return {
            situations: Array.isArray(parsed.situations) ? parsed.situations : [],
            characterClasses: Array.isArray(parsed.characterClasses) ? parsed.characterClasses : [],
            signatureSkills: Array.isArray(parsed.signatureSkills) ? parsed.signatureSkills : [],
            autoSkills: Array.isArray(parsed.autoSkills) ? parsed.autoSkills : [],
            guests: Array.isArray(parsed.guests) ? parsed.guests : [],
            sessionSummaries: Array.isArray(parsed.sessionSummaries) ? parsed.sessionSummaries : [],
            sessionNotes: Array.isArray(parsed.sessionNotes) ? parsed.sessionNotes : [],
            updatedAt: parsed.updatedAt || new Date().toISOString()
          };
        }
      }
    }
  } catch (err) {
    console.warn('[PersistentStorage] Failed to load from LocalStorage fallback:', err);
  }

  return null;
}

// Clear all local persistent data (when user explicitly clicks "まっさらにする")
export async function clearPersistentData(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(DATA_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[PersistentStorage] Failed to clear IndexedDB:', err);
  }

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  } catch (err) {
    console.warn('[PersistentStorage] Failed to clear LocalStorage:', err);
  }
}

// Check if bundle contains any user data
export function hasAnyData(bundle: Partial<AppDataBundle> | null): boolean {
  if (!bundle) return false;
  return (
    (bundle.situations && bundle.situations.length > 0) ||
    (bundle.characterClasses && bundle.characterClasses.length > 0) ||
    (bundle.signatureSkills && bundle.signatureSkills.length > 0) ||
    (bundle.autoSkills && bundle.autoSkills.length > 0) ||
    (bundle.guests && bundle.guests.length > 0) ||
    (bundle.sessionSummaries && bundle.sessionSummaries.length > 0) ||
    (bundle.sessionNotes && bundle.sessionNotes.length > 0)
  ) ? true : false;
}

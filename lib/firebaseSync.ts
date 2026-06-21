import { db, auth } from './firebase';
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { DesignItem, portfolioItems, allExtendedAssets } from './data';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  const serialized = JSON.stringify(errInfo);
  console.error("Firestore Permission Error Context:", serialized);
  throw new Error(serialized);
}

function addLocalTrashItem(id: string, type: 'design' | 'asset', item: DesignItem) {
  if (typeof window === 'undefined') return;
  const local = localStorage.getItem('fanratech_trash_local');
  let list = local ? JSON.parse(local) : [];
  list = list.filter((x: any) => x.id !== id);
  list.push({
    id,
    type,
    item,
    deletedAt: new Date().toISOString()
  });
  localStorage.setItem('fanratech_trash_local', JSON.stringify(list));
}

function removeLocalTrashItem(id: string) {
  if (typeof window === 'undefined') return;
  const local = localStorage.getItem('fanratech_trash_local');
  if (local) {
    let list = JSON.parse(local);
    list = list.filter((x: any) => x.id !== id);
    localStorage.setItem('fanratech_trash_local', JSON.stringify(list));
  }
}

// Keep track of setup needed state in memory and localStorage for Firebase Setup
export function getFirebaseSetupState(): { designsNeeded: boolean; assetsNeeded: boolean } {
  if (typeof window === 'undefined') return { designsNeeded: false, assetsNeeded: false };
  const dNeeded = localStorage.getItem('fanratech_firebase_designs_needed') === 'true';
  const aNeeded = localStorage.getItem('fanratech_firebase_assets_needed') === 'true';
  return { designsNeeded: dNeeded, assetsNeeded: aNeeded };
}

export function setFirebaseSetupState(designsNeeded: boolean, assetsNeeded: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('fanratech_firebase_designs_needed', String(designsNeeded));
  localStorage.setItem('fanratech_firebase_assets_needed', String(assetsNeeded));
}

// Backward Compatibility Aliases for Dashboard
export function getSupabaseSetupState(): { designsNeeded: boolean; assetsNeeded: boolean } {
  return getFirebaseSetupState();
}

export function setSupabaseSetupState(designsNeeded: boolean, assetsNeeded: boolean) {
  setFirebaseSetupState(designsNeeded, assetsNeeded);
}

// 1. DESIGNS SYNC OPERATIONS (Firebase Firestore)
export async function syncDesignsFromCloud(forceSeed = false): Promise<DesignItem[]> {
  try {
    const colRef = collection(db, 'fanratech_designs');
    const snapshot = await getDocs(colRef);
    const list: DesignItem[] = [];
    let isSeededInCloud = false;

    snapshot.forEach(docSnap => {
      if (docSnap.id === '_is_seeded') {
        isSeededInCloud = true;
        return;
      }
      const row = docSnap.data();
      list.push({
        id: docSnap.id,
        title: row.title,
        category: row.category,
        description: row.description,
        longDescription: row.longDescription || row.description,
        image: row.image,
        colors: Array.isArray(row.colors) ? row.colors : [],
        fonts: Array.isArray(row.fonts) ? row.fonts : [],
        software: Array.isArray(row.software) ? row.software : [],
        elements: Array.isArray(row.elements) ? row.elements : [],
        sourceFile: row.sourceFile || '',
        svgContent: row.svgContent || '',
        aspectRatioClass: row.aspectRatioClass || 'aspect-square',
        dimensions: row.dimensions || { type: 'Standard', pixels: '1080x1080px', ratio: '1:1', docs: '' },
        order: typeof row.order === 'number' ? row.order : null,
        // Timestamps to safely preserve sorting
        created_at: row.created_at || row.updated_at || '',
        updated_at: row.updated_at || row.created_at || ''
      } as any);
    });

    // Urutkan secara custom order: jika order terdefinisi, dahulukan terkecil. Jika sama/bawaan, urutkan berdasarkan waktu terbaru di atas
    list.sort((a: any, b: any) => {
      const orderA = typeof a.order === 'number' ? a.order : 999999;
      const orderB = typeof b.order === 'number' ? b.order : 999999;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
      const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
      return timeB - timeA;
    });

    setFirebaseSetupState(false, getFirebaseSetupState().assetsNeeded);

    if (list.length > 0 || isSeededInCloud) {
      if (list.length > 0 && !isSeededInCloud) {
        const metaDocRef = doc(db, 'fanratech_designs', '_is_seeded');
        setDoc(metaDocRef, { seeded: true, seededAt: new Date().toISOString() }).catch(console.error);
      }
      localStorage.setItem('fanratech_designs', JSON.stringify(list));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('fanratech_data_updated'));
      }
      return list;
    } else {
      // Hanya lakukan seeding jika forceSeed = true atau sedang berada di halaman admin / dashboard
      const isDashboard = typeof window !== 'undefined' && window.location.pathname.startsWith('/dashboard');
      if (forceSeed || isDashboard) {
        const local = localStorage.getItem('fanratech_designs');
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed.length > 0) {
            await seedDesignsToCloud(parsed);
            return parsed;
          }
        }
        localStorage.setItem('fanratech_designs', JSON.stringify(portfolioItems));
        await seedDesignsToCloud(portfolioItems);
        return portfolioItems;
      } else {
        // Untuk pengunjung biasa, biarkan kosong tanpa melakukan seeding balik ke cloud
        localStorage.setItem('fanratech_designs', JSON.stringify([]));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('fanratech_data_updated'));
        }
        return [];
      }
    }
  } catch (err: any) {
    console.error('syncDesignsFromCloud error:', err);
    
    // Check for missing permission error
    if (err && (err.code === 'permission-denied' || String(err).includes('permission') || String(err).includes('Permission'))) {
      handleFirestoreError(err, OperationType.GET, 'fanratech_designs');
    }

    const local = localStorage.getItem('fanratech_designs');
    if (local) {
      return JSON.parse(local);
    }
    return [];
  }
}

export async function seedDesignsToCloud(items: DesignItem[]): Promise<boolean> {
  try {
    for (const item of items) {
      const docRef = doc(db, 'fanratech_designs', item.id);
      await setDoc(docRef, {
        title: item.title,
        category: item.category,
        description: item.description,
        longDescription: item.longDescription,
        image: item.image,
        colors: item.colors,
        fonts: item.fonts,
        software: item.software,
        elements: item.elements,
        sourceFile: item.sourceFile,
        svgContent: item.svgContent || '',
        aspectRatioClass: item.aspectRatioClass || 'aspect-square',
        dimensions: item.dimensions,
        created_at: new Date().toISOString()
      }, { merge: true });
    }
    const metaDocRef = doc(db, 'fanratech_designs', '_is_seeded');
    await setDoc(metaDocRef, { seeded: true, seededAt: new Date().toISOString() });
    setFirebaseSetupState(false, getFirebaseSetupState().assetsNeeded);
    return true;
  } catch (e) {
    console.error('seedDesignsToCloud error:', e);
    return false;
  }
}

export async function upsertDesignItemCloud(item: DesignItem): Promise<boolean> {
  try {
    const local = localStorage.getItem('fanratech_designs');
    let list: DesignItem[] = local ? JSON.parse(local) : [...portfolioItems];
    const index = list.findIndex(d => d.id === item.id);
    if (index !== -1) {
      list[index] = item;
    } else {
      list.unshift(item);
    }
    localStorage.setItem('fanratech_designs', JSON.stringify(list));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('fanratech_data_updated'));
    }

    const docRef = doc(db, 'fanratech_designs', item.id);
    await setDoc(docRef, {
      title: item.title,
      category: item.category,
      description: item.description,
      longDescription: item.longDescription,
      image: item.image,
      colors: item.colors,
      fonts: item.fonts,
      software: item.software,
      elements: item.elements,
      sourceFile: item.sourceFile,
      svgContent: item.svgContent || '',
      aspectRatioClass: item.aspectRatioClass || 'aspect-square',
      dimensions: item.dimensions,
      order: typeof item.order === 'number' ? item.order : null,
      updated_at: new Date().toISOString()
    }, { merge: true });

    const metaDocRef = doc(db, 'fanratech_designs', '_is_seeded');
    await setDoc(metaDocRef, { seeded: true, seededAt: new Date().toISOString() }, { merge: true });

    setFirebaseSetupState(false, getFirebaseSetupState().assetsNeeded);
    return true;
  } catch (err: any) {
    console.error('upsertDesignItemCloud error:', err);
    if (err && (err.code === 'permission-denied' || String(err).includes('permission') || String(err).includes('Permission'))) {
      handleFirestoreError(err, OperationType.WRITE, `fanratech_designs/${item.id}`);
    }
    return false;
  }
}

export async function updateDesignsOrderCloud(items: DesignItem[]): Promise<boolean> {
  try {
    // 1. Tambahkan properti order sesuai dengan urutan indeks barunya
    const orderedItems = items.map((item, idx) => ({
      ...item,
      order: idx
    }));

    // 2. Simpan ke local storage agar UX sangat instan
    localStorage.setItem('fanratech_designs', JSON.stringify(orderedItems));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('fanratech_data_updated'));
    }

    // 3. Jalankan query setDoc paralel untuk setiap item untuk mengimbangi order field
    const promises = orderedItems.map((item) => {
      const docRef = doc(db, 'fanratech_designs', item.id);
      return setDoc(docRef, { order: item.order, updated_at: new Date().toISOString() }, { merge: true });
    });

    await Promise.all(promises);
    return true;
  } catch (err: any) {
    console.error('updateDesignsOrderCloud error:', err);
    if (err && (err.code === 'permission-denied' || String(err).includes('permission') || String(err).includes('Permission'))) {
      handleFirestoreError(err, OperationType.WRITE, `fanratech_designs/bulk_order_update`);
    }
    return false;
  }
}

export async function deleteDesignItemCloud(id: string): Promise<boolean> {
  try {
    const local = localStorage.getItem('fanratech_designs');
    if (local) {
      let list: DesignItem[] = JSON.parse(local);
      list = list.filter(d => d.id !== id);
      localStorage.setItem('fanratech_designs', JSON.stringify(list));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('fanratech_data_updated'));
      }
    }

    const docRef = doc(db, 'fanratech_designs', id);
    await deleteDoc(docRef);
    const metaDocRef = doc(db, 'fanratech_designs', '_is_seeded');
    await setDoc(metaDocRef, { seeded: true, seededAt: new Date().toISOString() }, { merge: true });
    setFirebaseSetupState(false, getFirebaseSetupState().assetsNeeded);
    return true;
  } catch (err: any) {
    console.error('deleteDesignItemCloud error:', err);
    if (err && (err.code === 'permission-denied' || String(err).includes('permission') || String(err).includes('Permission'))) {
      handleFirestoreError(err, OperationType.DELETE, `fanratech_designs/${id}`);
    }
    return false;
  }
}


// 2. COMPANION ASSETS SYNC OPERATIONS
export async function syncAssetsFromCloud(forceSeed = false): Promise<DesignItem[]> {
  try {
    const colRef = collection(db, 'fanratech_assets');
    const snapshot = await getDocs(colRef);
    const list: DesignItem[] = [];
    let isSeededInCloud = false;

    snapshot.forEach(docSnap => {
      if (docSnap.id === '_is_seeded') {
        isSeededInCloud = true;
        return;
      }
      const row = docSnap.data();
      list.push({
        id: docSnap.id,
        title: row.title,
        category: row.category,
        description: row.description,
        longDescription: row.longDescription || row.description,
        image: row.image,
        colors: Array.isArray(row.colors) ? row.colors : [],
        fonts: Array.isArray(row.fonts) ? row.fonts : [],
        software: Array.isArray(row.software) ? row.software : [],
        elements: Array.isArray(row.elements) ? row.elements : [],
        sourceFile: row.sourceFile || '',
        svgContent: row.svgContent || '',
        aspectRatioClass: row.aspectRatioClass || 'aspect-square',
        dimensions: row.dimensions || { type: 'Standard', pixels: '1080x1080px', ratio: '1:1', docs: '' },
        // Timestamps to safely preserve sorting
        created_at: row.created_at || row.updated_at || '',
        updated_at: row.updated_at || row.created_at || ''
      } as any);
    });

    // Urutkan secara kronologis: terbaru diletakkan di paling depan (menyerupai unshift)
    list.sort((a: any, b: any) => {
      const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
      const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
      return timeB - timeA;
    });

    setFirebaseSetupState(getFirebaseSetupState().designsNeeded, false);

    if (list.length > 0 || isSeededInCloud) {
      if (list.length > 0 && !isSeededInCloud) {
        const metaDocRef = doc(db, 'fanratech_assets', '_is_seeded');
        setDoc(metaDocRef, { seeded: true, seededAt: new Date().toISOString() }).catch(console.error);
      }
      localStorage.setItem('fanratech_assets', JSON.stringify(list));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('fanratech_data_updated'));
      }
      return list;
    } else {
      // Hanya lakukan seeding jika forceSeed = true atau sedang berada di halaman admin / dashboard
      const isDashboard = typeof window !== 'undefined' && window.location.pathname.startsWith('/dashboard');
      if (forceSeed || isDashboard) {
        const local = localStorage.getItem('fanratech_assets');
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed.length > 0) {
            await seedAssetsToCloud(parsed);
            return parsed;
          }
        }
        localStorage.setItem('fanratech_assets', JSON.stringify(allExtendedAssets));
        await seedAssetsToCloud(allExtendedAssets);
        return allExtendedAssets;
      } else {
        // Untuk pengunjung biasa, biarkan kosong tanpa melakukan seeding balik ke cloud
        localStorage.setItem('fanratech_assets', JSON.stringify([]));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('fanratech_data_updated'));
        }
        return [];
      }
    }
  } catch (err: any) {
    console.error('syncAssetsFromCloud error:', err);
    if (err && (err.code === 'permission-denied' || String(err).includes('permission') || String(err).includes('Permission'))) {
      handleFirestoreError(err, OperationType.GET, 'fanratech_assets');
    }

    const local = localStorage.getItem('fanratech_assets');
    if (local) {
      return JSON.parse(local);
    }
    return [];
  }
}

export async function seedAssetsToCloud(items: DesignItem[]): Promise<boolean> {
  try {
    for (const item of items) {
      const docRef = doc(db, 'fanratech_assets', item.id);
      await setDoc(docRef, {
        title: item.title,
        category: item.category,
        description: item.description,
        longDescription: item.longDescription,
        image: item.image,
        colors: item.colors,
        fonts: item.fonts,
        software: item.software,
        elements: item.elements,
        sourceFile: item.sourceFile,
        svgContent: item.svgContent || '',
        aspectRatioClass: item.aspectRatioClass || 'aspect-square',
        dimensions: item.dimensions,
        created_at: new Date().toISOString()
      }, { merge: true });
    }
    const metaDocRef = doc(db, 'fanratech_assets', '_is_seeded');
    await setDoc(metaDocRef, { seeded: true, seededAt: new Date().toISOString() });
    setFirebaseSetupState(getFirebaseSetupState().designsNeeded, false);
    return true;
  } catch (e) {
    console.error('seedAssetsToCloud error:', e);
    return false;
  }
}

export async function upsertAssetItemCloud(item: DesignItem): Promise<boolean> {
  try {
    const local = localStorage.getItem('fanratech_assets');
    let list: DesignItem[] = local ? JSON.parse(local) : [...allExtendedAssets];
    const index = list.findIndex(a => a.id === item.id);
    if (index !== -1) {
      list[index] = item;
    } else {
      list.unshift(item);
    }
    localStorage.setItem('fanratech_assets', JSON.stringify(list));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('fanratech_data_updated'));
    }

    const docRef = doc(db, 'fanratech_assets', item.id);
    await setDoc(docRef, {
      title: item.title,
      category: item.category,
      description: item.description,
      longDescription: item.longDescription,
      image: item.image,
      colors: item.colors,
      fonts: item.fonts,
      software: item.software,
      elements: item.elements,
      sourceFile: item.sourceFile,
      svgContent: item.svgContent || '',
      aspectRatioClass: item.aspectRatioClass || 'aspect-square',
      dimensions: item.dimensions,
      updated_at: new Date().toISOString()
    }, { merge: true });

    const metaDocRef = doc(db, 'fanratech_assets', '_is_seeded');
    await setDoc(metaDocRef, { seeded: true, seededAt: new Date().toISOString() }, { merge: true });

    setFirebaseSetupState(getFirebaseSetupState().designsNeeded, false);
    return true;
  } catch (err: any) {
    console.error('upsertAssetItemCloud error:', err);
    if (err && (err.code === 'permission-denied' || String(err).includes('permission') || String(err).includes('Permission'))) {
      handleFirestoreError(err, OperationType.WRITE, `fanratech_assets/${item.id}`);
    }
    return false;
  }
}

export async function deleteAssetItemCloud(id: string): Promise<boolean> {
  try {
    const local = localStorage.getItem('fanratech_assets');
    if (local) {
      let list: DesignItem[] = JSON.parse(local);
      list = list.filter(a => a.id !== id);
      localStorage.setItem('fanratech_assets', JSON.stringify(list));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('fanratech_data_updated'));
      }
    }

    const docRef = doc(db, 'fanratech_assets', id);
    await deleteDoc(docRef);
    const metaDocRef = doc(db, 'fanratech_assets', '_is_seeded');
    await setDoc(metaDocRef, { seeded: true, seededAt: new Date().toISOString() }, { merge: true });
    setFirebaseSetupState(getFirebaseSetupState().designsNeeded, false);
    return true;
  } catch (err: any) {
    console.error('deleteAssetItemCloud error:', err);
    if (err && (err.code === 'permission-denied' || String(err).includes('permission') || String(err).includes('Permission'))) {
      handleFirestoreError(err, OperationType.DELETE, `fanratech_assets/${id}`);
    }
    return false;
  }
}


// 3. REAL TRAFFIC & VIEW STATS TRACKING (ASLI / NYATA)
export async function recordPageHit(): Promise<void> {
  if (typeof window === 'undefined') return;

  const tzoffset = (new Date()).getTimezoneOffset() * 60000;
  const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 10);

  const isNewSession = !sessionStorage.getItem('fanratech_session_hit_logged');
  if (isNewSession) {
    sessionStorage.setItem('fanratech_session_hit_logged', 'true');
  }

  try {
    const localStore = localStorage.getItem('fanratech_local_traffic');
    let dataMap = localStore ? JSON.parse(localStore) : {};
    if (!dataMap[localISOTime]) {
      dataMap[localISOTime] = { views: 0, visitors: 0 };
    }
    dataMap[localISOTime].views += 1;
    if (isNewSession) {
      dataMap[localISOTime].visitors += 1;
    }
    localStorage.setItem('fanratech_local_traffic', JSON.stringify(dataMap));
    window.dispatchEvent(new Event('fanratech_traffic_updated'));
  } catch (e) {
    console.warn('Local traffic tracking error:', e);
  }

  try {
    const docRef = doc(db, 'fanratech_traffic', localISOTime);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const todayRow = docSnap.data();
      await setDoc(docRef, {
        views: (todayRow.views || 0) + 1,
        visitors: (todayRow.visitors || 0) + (isNewSession ? 1 : 0)
      }, { merge: true });
    } else {
      await setDoc(docRef, {
        views: 1,
        visitors: 1,
        created_at: new Date().toISOString()
      });
    }
  } catch (err: any) {
    console.log('Firestore traffic syncing deferred - using local fallback cache.');
  }
}

export async function getTrafficStats(timeRange: '7d' | '30d' | '12m'): Promise<{ label: string; val: number; views: number }[]> {
  let localData: Record<string, { views: number; visitors: number }> = {};
  if (typeof window !== 'undefined') {
    try {
      const store = localStorage.getItem('fanratech_local_traffic');
      if (store) localData = JSON.parse(store);
    } catch (e) {}
  }

  let cloudData: any[] = [];
  try {
    const colRef = collection(db, 'fanratech_traffic');
    const qSnapshot = await getDocs(colRef);
    qSnapshot.forEach(docSnap => {
      cloudData.push({ id: docSnap.id, ...docSnap.data() });
    });
    cloudData.sort((a, b) => a.id.localeCompare(b.id));
  } catch (e) {}

  const mergedMap: Record<string, { views: number; visitors: number }> = {};

  const INDO_DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const INDO_MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

  const getLocalDateString = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    const tzoffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzoffset).toISOString().slice(0, 10);
  };

  // Initialize the past 30 days to 0 views & 0 visitors
  for (let i = 0; i < 30; i++) {
    const dateStr = getLocalDateString(i);
    mergedMap[dateStr] = { views: 0, visitors: 0 };
  }

  // Merge actual Cloud Traffic Data
  if (cloudData.length > 0) {
    cloudData.forEach(row => {
      if (row.id) {
        mergedMap[row.id] = {
          views: row.views || 0,
          visitors: row.visitors || 0
        };
      }
    });
  }

  // Merge/Combine local storage page hits to ensure real-time responsiveness
  Object.keys(localData).forEach(dateStr => {
    if (!mergedMap[dateStr]) {
      mergedMap[dateStr] = { views: 0, visitors: 0 };
    }
    // Set to whichever is higher to avoid double-counting local vs synced cloud data
    mergedMap[dateStr].views = Math.max(mergedMap[dateStr].views, localData[dateStr].views || 0);
    mergedMap[dateStr].visitors = Math.max(mergedMap[dateStr].visitors, localData[dateStr].visitors || 0);
  });

  if (timeRange === '7d') {
    const list = [];
    for (let i = 6; i >= 0; i--) {
      const dateStr = getLocalDateString(i);
      const valObj = mergedMap[dateStr] || { views: 0, visitors: 0 };
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = INDO_DAYS[d.getDay()];
      list.push({
        label: label + (i === 0 ? " (Hari Ini)" : ""),
        val: valObj.visitors,
        views: valObj.views
      });
    }
    return list;
  } else if (timeRange === '30d') {
    const list = [];
    for (let w = 3; w >= 0; w--) {
      let viewsSum = 0;
      let visitorsSum = 0;
      for (let i = 0; i < 7; i++) {
        const dateStr = getLocalDateString(w * 7 + i);
        const valObj = mergedMap[dateStr] || { views: 0, visitors: 0 };
        viewsSum += valObj.views;
        visitorsSum += valObj.visitors;
      }
      list.push({
        label: `Minggu ${4 - w}`,
        val: Math.floor(visitorsSum),
        views: Math.floor(viewsSum)
      });
    }
    return list;
  } else {
    // 12 Months: calculate by summing days corresponding to each month prefix
    const list = [];
    for (let m = 5; m >= 0; m--) {
      const d = new Date();
      d.setMonth(d.getMonth() - m);
      const year = d.getFullYear();
      const monthStr = String(d.getMonth() + 1).padStart(2, '0');
      const prefix = `${year}-${monthStr}`;

      let viewsSum = 0;
      let visitorsSum = 0;
      Object.keys(mergedMap).forEach(dateKey => {
        if (dateKey.startsWith(prefix)) {
          viewsSum += mergedMap[dateKey].views;
          visitorsSum += mergedMap[dateKey].visitors;
        }
      });

      const label = INDO_MONTHS[d.getMonth()];
      list.push({
        label,
        val: visitorsSum,
        views: viewsSum
      });
    }
    return list;
  }
}

export async function getLiveTrafficCount(): Promise<{ totalViews: number; activeNow: number }> {
  const tzoffset = (new Date()).getTimezoneOffset() * 60000;
  const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 10);

  let todayViews = 0;
  let totalViews = 0;

  // 1. Fetch total views across all time from cloud
  try {
    const colRef = collection(db, 'fanratech_traffic');
    const qSnapshot = await getDocs(colRef);
    qSnapshot.forEach(docSnap => {
      const data = docSnap.data();
      totalViews += data.views || 0;
      if (docSnap.id === localISOTime) {
        todayViews = data.views || 0;
      }
    });
  } catch(e) {}

  // 2. Fetch local storage hits to merge
  if (typeof window !== 'undefined') {
    try {
      const store = localStorage.getItem('fanratech_local_traffic');
      if (store) {
        const local = JSON.parse(store);
        if (local[localISOTime]) {
          const lv = local[localISOTime].views || 0;
          if (lv > todayViews) {
            totalViews += (lv - todayViews);
            todayViews = lv;
          }
        }
      }
    } catch(e){}
  }

  // Real-time active users estimation based strictly on fresh todayViews
  const activeNow = todayViews > 0 ? (todayViews > 5 ? Math.min(10, Math.floor(todayViews / 3)) : 1) : 1;

  return {
    totalViews: Math.max(1, totalViews),
    activeNow: activeNow
  };
}

// --- TRASH & SOFT-DELETE OPERATIONS (KERANJANG SAMPAH) ---

export interface TrashItem {
  id: string;
  type: 'design' | 'asset';
  item: DesignItem;
  deletedAt: string;
}

/**
 * Soft delete a design item (copies to trash bin & deletes from active collection)
 */
export async function softDeleteDesignItemCloud(item: DesignItem): Promise<boolean> {
  try {
    // 1. Update local cache
    const local = localStorage.getItem('fanratech_designs');
    if (local) {
      let list: DesignItem[] = JSON.parse(local);
      list = list.filter(d => d.id !== item.id);
      localStorage.setItem('fanratech_designs', JSON.stringify(list));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('fanratech_data_updated'));
      }
    }

    // 2. Put in trash collection
    addLocalTrashItem(item.id, 'design', item);
    const trashDocRef = doc(db, 'fanratech_trash', item.id);
    await setDoc(trashDocRef, {
      id: item.id,
      type: 'design',
      item: item,
      deletedAt: new Date().toISOString()
    });

    // 3. Remove from original collection
    const docRef = doc(db, 'fanratech_designs', item.id);
    await deleteDoc(docRef);
    const metaDocRef = doc(db, 'fanratech_designs', '_is_seeded');
    await setDoc(metaDocRef, { seeded: true, seededAt: new Date().toISOString() }, { merge: true });

    setFirebaseSetupState(false, getFirebaseSetupState().assetsNeeded);
    return true;
  } catch (err: any) {
    console.error('softDeleteDesignItemCloud error:', err);
    if (err && (err.code === 'permission-denied' || String(err).includes('permission') || String(err).includes('Permission'))) {
      handleFirestoreError(err, OperationType.WRITE, 'fanratech_trash');
    }
    return false;
  }
}

/**
 * Soft delete an asset item (copies to trash bin & deletes from active collection)
 */
export async function softDeleteAssetItemCloud(item: DesignItem): Promise<boolean> {
  try {
    // 1. Update local cache
    const local = localStorage.getItem('fanratech_assets');
    if (local) {
      let list: DesignItem[] = JSON.parse(local);
      list = list.filter(a => a.id !== item.id);
      localStorage.setItem('fanratech_assets', JSON.stringify(list));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('fanratech_data_updated'));
      }
    }

    // 2. Put in trash collection
    addLocalTrashItem(item.id, 'asset', item);
    const trashDocRef = doc(db, 'fanratech_trash', item.id);
    await setDoc(trashDocRef, {
      id: item.id,
      type: 'asset',
      item: item,
      deletedAt: new Date().toISOString()
    });

    // 3. Remove from original collection
    const docRef = doc(db, 'fanratech_assets', item.id);
    await deleteDoc(docRef);
    const metaDocRef = doc(db, 'fanratech_assets', '_is_seeded');
    await setDoc(metaDocRef, { seeded: true, seededAt: new Date().toISOString() }, { merge: true });

    setFirebaseSetupState(getFirebaseSetupState().designsNeeded, false);
    return true;
  } catch (err: any) {
    console.error('softDeleteAssetItemCloud error:', err);
    if (err && (err.code === 'permission-denied' || String(err).includes('permission') || String(err).includes('Permission'))) {
      handleFirestoreError(err, OperationType.WRITE, 'fanratech_trash');
    }
    return false;
  }
}

/**
 * Bulk soft delete designs
 */
export async function bulkSoftDeleteDesignsCloud(items: DesignItem[]): Promise<boolean> {
  try {
    // 1. Update local cache
    const local = localStorage.getItem('fanratech_designs');
    if (local) {
      let list: DesignItem[] = JSON.parse(local);
      const idsToRemove = new Set(items.map(item => item.id));
      list = list.filter(d => !idsToRemove.has(d.id));
      localStorage.setItem('fanratech_designs', JSON.stringify(list));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('fanratech_data_updated'));
      }
    }

    // 2. Clear items
    for (const item of items) {
      addLocalTrashItem(item.id, 'design', item);
      const trashDocRef = doc(db, 'fanratech_trash', item.id);
      await setDoc(trashDocRef, {
        id: item.id,
        type: 'design',
        item: item,
        deletedAt: new Date().toISOString()
      });

      const docRef = doc(db, 'fanratech_designs', item.id);
      await deleteDoc(docRef);
    }

    const metaDocRef = doc(db, 'fanratech_designs', '_is_seeded');
    await setDoc(metaDocRef, { seeded: true, seededAt: new Date().toISOString() }, { merge: true });

    setFirebaseSetupState(false, getFirebaseSetupState().assetsNeeded);
    return true;
  } catch (err: any) {
    console.error('bulkSoftDeleteDesignsCloud error:', err);
    if (err && (err.code === 'permission-denied' || String(err).includes('permission') || String(err).includes('Permission'))) {
      handleFirestoreError(err, OperationType.WRITE, 'fanratech_trash');
    }
    return false;
  }
}

/**
 * Bulk soft delete assets
 */
export async function bulkSoftDeleteAssetsCloud(items: DesignItem[]): Promise<boolean> {
  try {
    // 1. Update local cache
    const local = localStorage.getItem('fanratech_assets');
    if (local) {
      let list: DesignItem[] = JSON.parse(local);
      const idsToRemove = new Set(items.map(item => item.id));
      list = list.filter(a => !idsToRemove.has(a.id));
      localStorage.setItem('fanratech_assets', JSON.stringify(list));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('fanratech_data_updated'));
      }
    }

    // 2. Put in trash collection
    for (const item of items) {
      addLocalTrashItem(item.id, 'asset', item);
      const trashDocRef = doc(db, 'fanratech_trash', item.id);
      await setDoc(trashDocRef, {
        id: item.id,
        type: 'asset',
        item: item,
        deletedAt: new Date().toISOString()
      });

      const docRef = doc(db, 'fanratech_assets', item.id);
      await deleteDoc(docRef);
    }

    const metaDocRef = doc(db, 'fanratech_assets', '_is_seeded');
    await setDoc(metaDocRef, { seeded: true, seededAt: new Date().toISOString() }, { merge: true });

    setFirebaseSetupState(getFirebaseSetupState().designsNeeded, false);
    return true;
  } catch (err: any) {
    console.error('bulkSoftDeleteAssetsCloud error:', err);
    if (err && (err.code === 'permission-denied' || String(err).includes('permission') || String(err).includes('Permission'))) {
      handleFirestoreError(err, OperationType.WRITE, 'fanratech_trash');
    }
    return false;
  }
}

/**
 * Sync trash items from Firestore with automatic 2-month purging
 */
export async function syncTrashFromCloud(): Promise<TrashItem[]> {
  try {
    const colRef = collection(db, 'fanratech_trash');
    const snapshot = await getDocs(colRef);
    const list: TrashItem[] = [];

    const now = new Date();
    // 60 days in milliseconds (~2 months)
    const purgeLimitMs = 60 * 24 * 60 * 60 * 1000;

    for (const docSnap of snapshot.docs) {
      const row = docSnap.data();
      const deletedAtStr = row.deletedAt || new Date().toISOString();
      const deletedAtDate = new Date(deletedAtStr);

      // Automatically purge if older than 2 months (60 days)
      if (now.getTime() - deletedAtDate.getTime() > purgeLimitMs) {
        deleteDoc(doc(db, 'fanratech_trash', docSnap.id)).catch(console.error);
        continue;
      }

      list.push({
        id: docSnap.id,
        type: (row.type || 'design') as 'design' | 'asset',
        item: row.item,
        deletedAt: deletedAtStr
      });
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('fanratech_trash_local', JSON.stringify(list));
    }
    return list;
  } catch (err: any) {
    console.error('syncTrashFromCloud error:', err);
    let fallbackList: TrashItem[] = [];
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem('fanratech_trash_local');
      if (local) {
        try {
          fallbackList = JSON.parse(local);
        } catch (e) {}
      }
    }
    
    // Check for missing permissions error
    if (err && (err.code === 'permission-denied' || String(err).includes('permission') || String(err).includes('Permission'))) {
      handleFirestoreError(err, OperationType.GET, 'fanratech_trash');
    }
    
    return fallbackList;
  }
}

/**
 * Restore a soft-deleted item
 */
export async function restoreTrashItemCloud(id: string, type: 'design' | 'asset', item: DesignItem): Promise<boolean> {
  try {
    // 1. Delete from trash
    removeLocalTrashItem(id);
    const trashDocRef = doc(db, 'fanratech_trash', id);
    await deleteDoc(trashDocRef);

    // 2. Put back to original
    if (type === 'design') {
      await upsertDesignItemCloud(item);
    } else {
      await upsertAssetItemCloud(item);
    }

    return true;
  } catch (err: any) {
    console.error('restoreTrashItemCloud error:', err);
    if (err && (err.code === 'permission-denied' || String(err).includes('permission') || String(err).includes('Permission'))) {
      handleFirestoreError(err, OperationType.DELETE, `fanratech_trash/${id}`);
    }
    return false;
  }
}

/**
 * Delete trash item permanently
 */
export async function deleteTrashItemPermanentlyCloud(id: string): Promise<boolean> {
  try {
    removeLocalTrashItem(id);
    const trashDocRef = doc(db, 'fanratech_trash', id);
    await deleteDoc(trashDocRef);
    return true;
  } catch (err: any) {
    console.error('deleteTrashItemPermanentlyCloud error:', err);
    if (err && (err.code === 'permission-denied' || String(err).includes('permission') || String(err).includes('Permission'))) {
      handleFirestoreError(err, OperationType.DELETE, `fanratech_trash/${id}`);
    }
    return false;
  }
}

/**
 * Bulk restore trash items
 */
export async function bulkRestoreTrashItemsCloud(items: { id: string; type: 'design' | 'asset'; item: DesignItem }[]): Promise<boolean> {
  try {
    for (const trash of items) {
      removeLocalTrashItem(trash.id);
      const trashDocRef = doc(db, 'fanratech_trash', trash.id);
      await deleteDoc(trashDocRef);

      if (trash.type === 'design') {
        await upsertDesignItemCloud(trash.item);
      } else {
        await upsertAssetItemCloud(trash.item);
      }
    }
    return true;
  } catch (err: any) {
    console.error('bulkRestoreTrashItemsCloud error:', err);
    if (err && (err.code === 'permission-denied' || String(err).includes('permission') || String(err).includes('Permission'))) {
      handleFirestoreError(err, OperationType.DELETE, 'fanratech_trash');
    }
    return false;
  }
}

/**
 * Bulk delete entries permanently from trash bin
 */
export async function bulkDeleteTrashPermanentlyCloud(ids: string[]): Promise<boolean> {
  try {
    for (const id of ids) {
      removeLocalTrashItem(id);
      const trashDocRef = doc(db, 'fanratech_trash', id);
      await deleteDoc(trashDocRef);
    }
    return true;
  } catch (err: any) {
    console.error('bulkDeleteTrashPermanentlyCloud error:', err);
    if (err && (err.code === 'permission-denied' || String(err).includes('permission') || String(err).includes('Permission'))) {
      handleFirestoreError(err, OperationType.DELETE, 'fanratech_trash');
    }
    return false;
  }
}

/**
 * Empties the complete trash bin
 */
export async function emptyTrashBinCloud(items: TrashItem[]): Promise<boolean> {
  try {
    for (const t of items) {
      removeLocalTrashItem(t.id);
      const trashDocRef = doc(db, 'fanratech_trash', t.id);
      await deleteDoc(trashDocRef);
    }
    return true;
  } catch (err: any) {
    console.error('emptyTrashBinCloud error:', err);
    if (err && (err.code === 'permission-denied' || String(err).includes('permission') || String(err).includes('Permission'))) {
      handleFirestoreError(err, OperationType.DELETE, 'fanratech_trash');
    }
    return false;
  }
}

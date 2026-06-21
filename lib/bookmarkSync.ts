import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface UserBookmarks {
  saved_designs: string[];
  saved_assets: string[];
  updated_at: string;
}

// Helper to safely get user email on client side
export function getLoggedUserEmail(): string | null {
  if (typeof window === 'undefined') return null;
  const storedSession = localStorage.getItem('fanratech_session');
  if (storedSession) {
    try {
      const parsed = JSON.parse(storedSession);
      return parsed.email || null;
    } catch {
      return null;
    }
  }
  return null;
}

// 1. Sync local storage bookmarks with Firestore cloud for persistent cross-device syncing
export async function syncBookmarksWithCloud(): Promise<void> {
  if (typeof window === 'undefined') return;

  const email = getLoggedUserEmail();
  if (!email) return;

  try {
    const docRef = doc(db, 'fanratech_user_bookmarks', email);
    const docSnap = await getDoc(docRef);

    const localDesignsRaw = localStorage.getItem('fanratech_saved_designs');
    const localAssetsRaw = localStorage.getItem('fanratech_saved_assets');

    let localDesigns: string[] = [];
    let localAssets: string[] = [];

    try {
      localDesigns = localDesignsRaw ? JSON.parse(localDesignsRaw) : [];
    } catch {
      localDesigns = [];
    }

    try {
      localAssets = localAssetsRaw ? JSON.parse(localAssetsRaw) : [];
    } catch {
      localAssets = [];
    }

    if (docSnap.exists()) {
      const data = docSnap.data() as UserBookmarks;
      const cloudDesigns = data.saved_designs || [];
      const cloudAssets = data.saved_assets || [];

      // Merge local and cloud securely (avoid duplicates)
      const mergedDesigns = Array.from(new Set([...localDesigns, ...cloudDesigns]));
      const mergedAssets = Array.from(new Set([...localAssets, ...cloudAssets]));

      // Update local storage representation
      localStorage.setItem('fanratech_saved_designs', JSON.stringify(mergedDesigns));
      localStorage.setItem('fanratech_saved_assets', JSON.stringify(mergedAssets));

      // Push merged list back to firestore to keep server fully updated
      const isDesignsDiff = mergedDesigns.length !== cloudDesigns.length || mergedDesigns.some((id, idx) => id !== cloudDesigns[idx]);
      const isAssetsDiff = mergedAssets.length !== cloudAssets.length || mergedAssets.some((id, idx) => id !== cloudAssets[idx]);

      if (isDesignsDiff || isAssetsDiff || localDesigns.length === 0) {
        await setDoc(docRef, {
          saved_designs: mergedDesigns,
          saved_assets: mergedAssets,
          updated_at: new Date().toISOString()
        }, { merge: true });
      }
    } else {
      // Create a fresh cloud bookmark document for this brand new user
      await setDoc(docRef, {
        saved_designs: localDesigns,
        saved_assets: localAssets,
        updated_at: new Date().toISOString()
      });
    }

    // Inform all components on the instant visual page of the changes
    window.dispatchEvent(new Event('fanratech_data_updated'));
  } catch (error) {
    console.log("Artistic bookmark sync deferred - using client-only fallback mode (waiting for valid auth).");
  }
}

// 2. Track toggles on the active viewport or detail popups & automatically upload if logged in
export async function persistBookmarkToggle(itemId: string, type: 'design' | 'asset'): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const lang = localStorage.getItem('fanratech_language') || 'id';

  const email = getLoggedUserEmail();
  if (!email) {
    const errorMsg = lang === 'id' 
      ? "Silakan masuk akun terlebih dahulu untuk menyimpan." 
      : "Please log in first to save this item.";
    window.dispatchEvent(new CustomEvent('fanratech_toast', {
      detail: {
        message: errorMsg,
        type: "error"
      }
    }));
    return false;
  }

  const key = type === 'design' ? 'fanratech_saved_designs' : 'fanratech_saved_assets';
  const localRaw = localStorage.getItem(key);
  let list: string[] = [];

  try {
    list = localRaw ? JSON.parse(localRaw) : [];
  } catch {
    list = [];
  }

  const isSaved = list.includes(itemId);
  if (isSaved) {
    list = list.filter(id => id !== itemId);
  } else {
    list = [...list, itemId];
  }

  localStorage.setItem(key, JSON.stringify(list));
  window.dispatchEvent(new Event('fanratech_data_updated'));

  // Ambil nama tipe untuk pesan toast yang bersahabat
  const label = type === 'design' 
    ? (lang === 'id' ? 'Desain' : 'Design') 
    : (lang === 'id' ? 'Aset' : 'Asset');
  const msg = isSaved 
    ? (lang === 'id' ? `${label} dihapus dari daftar simpan.` : `${label} removed from saved list.`) 
    : (lang === 'id' ? `${label} berhasil disimpan di preferensi Anda.` : `${label} successfully saved to your preferences.`);

  window.dispatchEvent(new CustomEvent('fanratech_toast', {
    detail: {
      message: msg,
      type: "success"
    }
  }));

  // Immediately push update to firestore if logged in
  if (email) {
    try {
      const docRef = doc(db, 'fanratech_user_bookmarks', email);
      
      // Get other key to push a complete model update
      const otherKey = type === 'design' ? 'fanratech_saved_assets' : 'fanratech_saved_designs';
      const otherRaw = localStorage.getItem(otherKey);
      let otherList: string[] = [];
      try {
        otherList = otherRaw ? JSON.parse(otherRaw) : [];
      } catch {
        otherList = [];
      }

      await setDoc(docRef, {
        saved_designs: type === 'design' ? list : otherList,
        saved_assets: type === 'asset' ? list : otherList,
        updated_at: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.log("Persisting bookmark toggle to cloud deferred (client-only fallback active).");
    }
  }

  return true;
}

// 3. Clear all active bookmarks on logout so the next user has an empty/clean slate
export function handleLogoutClearBookmarks(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('fanratech_saved_designs');
  localStorage.removeItem('fanratech_saved_assets');
  window.dispatchEvent(new Event('fanratech_data_updated'));
}

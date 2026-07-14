import { initializeApp } from 'firebase/app';
import { 
  initializeFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  arrayUnion,
  query,
  where
} from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { Anime, User, SystemSettings, Comment } from '../types';
import { INITIAL_ANIME_DATABASE, DEFAULT_USERS, INITIAL_SYSTEM_SETTINGS } from '../data';
const firebaseConfig: {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  firestoreDatabaseId?: string;
} = {
  apiKey: "AIzaSyAxZkobhWA83pZCEEaKTIYltR6l3thUEVM",
  authDomain: "gen-lang-client-0321820300.firebaseapp.com",
  projectId: "gen-lang-client-0321820300",
  storageBucket: "gen-lang-client-0321820300.firebasestorage.app",
  messagingSenderId: "662555381867",
  appId: "1:662555381867:web:189db809e752fc2a43212e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Use custom database ID from config with forced long polling for reliable connectivity in iframe environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
}, firebaseConfig.firestoreDatabaseId || '(default)');
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Setup Google Auth Provider details
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// --- Firestore Error Handling ---
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
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Handles Google Sign-In with Firebase Auth
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const googleUser = result.user;
    
    if (!googleUser.email) {
      throw new Error('Google account does not have an email address.');
    }
    
    const emailKey = googleUser.email.toLowerCase().trim();
    const isAdminEmail = emailKey === 'donemq2000@gmail.com' || emailKey === 'admin@nekonime.com';

    // Check if user already exists in Firestore Users collection
    const existingUser = await getUserByEmail(emailKey);
    if (existingUser) {
      if (existingUser.isBlocked) {
        throw new Error('Akun Anda ditangguhkan sementara oleh Administrator!');
      }
      if (isAdminEmail && existingUser.role !== 'Admin') {
        existingUser.role = 'Admin';
        await saveUser(existingUser);
      }
      return existingUser;
    }
    
    // If not exists, create a new User document in Firestore
    const newUser: User = {
      email: emailKey,
      username: googleUser.displayName || 'Wibu Google',
      avatarBg: 'bg-indigo-600',
      role: isAdminEmail ? 'Admin' : 'Standard User',
      isBlocked: false
    };
    
    await saveUser(newUser);
    return newUser;
  } catch (error: any) {
    console.error('[Firebase Auth] Google Sign-In failed:', error);
    if (error && (error.code === 'auth/unauthorized-domain' || (error.message && error.message.includes('unauthorized-domain')))) {
      const hostname = window.location.hostname;
      throw new Error(`Domain ini (${hostname}) belum diotorisasi untuk Google Sign-In di proyek Firebase Anda. Harap masuk ke Firebase Console, buka menu Authentication > Settings > Authorized domains, dan tambahkan "${hostname}" ke daftar domain yang diizinkan. Link konfigurasi: https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`);
    }
    throw error;
  }
}

/**
 * Log in using Firebase Auth, then fetch or create user in Firestore
 */
export async function loginWithEmailPassword(email: string, pass: string): Promise<User> {
  const normalizedEmail = email.toLowerCase().trim();
  try {
    // 1. Try signing in with Firebase Auth
    let authUser;
    try {
      const result = await signInWithEmailAndPassword(auth, normalizedEmail, pass);
      authUser = result.user;
    } catch (authError: any) {
      if (authError && (authError.code === 'auth/operation-not-allowed' || (authError.message && authError.message.includes('operation-not-allowed')))) {
        throw new Error(`Metode login Email/Password dinonaktifkan di Firebase Console. Harap aktifkan di: https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers atau gunakan Google Sign-In.`);
      }
      // If auth account doesn't exist yet, but they are in DEFAULT_USERS or in Firestore collection,
      // let's try creating an auth account for them!
      const existingUser = await getUserByEmail(normalizedEmail);
      if (existingUser && (existingUser.password === pass || normalizedEmail === 'admin@nekonime.com' || normalizedEmail === 'wibu@nekonime.com')) {
        try {
          const result = await createUserWithEmailAndPassword(auth, normalizedEmail, pass);
          authUser = result.user;
        } catch (createError: any) {
          if (createError && (createError.code === 'auth/operation-not-allowed' || (createError.message && createError.message.includes('operation-not-allowed')))) {
            throw new Error('Metode login Email/Password dinonaktifkan di Firebase Console. Harap aktifkan di: https://console.firebase.google.com/project/gen-lang-client-0378800207/authentication/providers atau gunakan Google Sign-In.');
          }
          throw createError;
        }
      } else {
        throw authError;
      }
    }

    // 2. Fetch the corresponding Firestore document
    const userDoc = await getUserByEmail(normalizedEmail);
    if (userDoc) {
      if (userDoc.isBlocked) {
        throw new Error('Akun Anda ditangguhkan sementara oleh Administrator!');
      }
      const isSpecialAdmin = normalizedEmail === 'donemq2000@gmail.com' || normalizedEmail === 'admin@nekonime.com';
      if (isSpecialAdmin && userDoc.role !== 'Admin') {
        userDoc.role = 'Admin';
        await saveUser(userDoc);
      }
      return userDoc;
    }

    // 3. Fallback: create a Firestore user profile if not exists
    const isSpecialAdmin = normalizedEmail === 'donemq2000@gmail.com' || normalizedEmail === 'admin@nekonime.com';
    const newUser: User = {
      email: normalizedEmail,
      username: normalizedEmail.split('@')[0],
      avatarBg: 'bg-purple-600',
      role: isSpecialAdmin ? 'Admin' : 'Standard User',
      isBlocked: false,
      password: pass
    };
    await saveUser(newUser);
    return newUser;
  } catch (error: any) {
    console.error('[Firebase Auth] Email Login failed:', error);
    if (error && (error.code === 'auth/operation-not-allowed' || (error.message && error.message.includes('operation-not-allowed')))) {
      throw new Error(`Metode login Email/Password dinonaktifkan di Firebase Console. Harap aktifkan di: https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers atau gunakan Google Sign-In.`);
    }
    throw error;
  }
}

/**
 * Register a new user with Firebase Auth and sync with Firestore
 */
export async function registerWithEmailPassword(username: string, email: string, pass: string): Promise<User> {
  const normalizedEmail = email.toLowerCase().trim();
  try {
    // 1. Create account in Firebase Auth
    const result = await createUserWithEmailAndPassword(auth, normalizedEmail, pass);
    const authUser = result.user;

    // 2. Create profile in Firestore
    const isSpecialAdmin = normalizedEmail === 'donemq2000@gmail.com' || normalizedEmail === 'admin@nekonime.com';
    const newUser: User = {
      email: normalizedEmail,
      username: username.trim(),
      avatarBg: 'bg-purple-600',
      role: isSpecialAdmin ? 'Admin' : 'Standard User',
      isBlocked: false,
      password: pass
    };
    await saveUser(newUser);
    return newUser;
  } catch (error: any) {
    console.error('[Firebase Auth] Email Register failed:', error);
    if (error && (error.code === 'auth/operation-not-allowed' || (error.message && error.message.includes('operation-not-allowed')))) {
      throw new Error(`Metode login Email/Password dinonaktifkan di Firebase Console. Harap aktifkan di: https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers atau gunakan Google Sign-In.`);
    }
    throw error;
  }
}

// Collections References
const ANIMES_COLL = 'animes';
const USERS_COLL = 'users';
const SETTINGS_COLL = 'settings';

/**
 * Seeding the database with initial default data if it's empty
 */
export async function seedDatabaseIfEmpty() {
  try {
    // 1. Check & Seed Settings
    const settingsDocRef = doc(db, SETTINGS_COLL, 'system');
    const settingsSnap = await getDoc(settingsDocRef);
    if (!settingsSnap.exists()) {
      await setDoc(settingsDocRef, INITIAL_SYSTEM_SETTINGS);
      console.log('[Firebase] Settings seeded successfully.');
    }

    // 2. Check & Seed Users
    const usersCollRef = collection(db, USERS_COLL);
    const usersSnap = await getDocs(usersCollRef);
    if (usersSnap.empty) {
      for (const u of DEFAULT_USERS) {
        await setDoc(doc(db, USERS_COLL, u.email), u);
      }
      console.log('[Firebase] Users seeded successfully.');
    }

    // 3. Check & Seed Anime List
    const animeCollRef = collection(db, ANIMES_COLL);
    const animeSnap = await getDocs(animeCollRef);
    if (animeSnap.empty) {
      for (const anime of INITIAL_ANIME_DATABASE) {
        await setDoc(doc(db, ANIMES_COLL, anime.id), anime);
      }
      console.log('[Firebase] Anime database seeded successfully.');
    }
  } catch (error) {
    console.warn('[Firebase] Error seeding database:', error);
  }
}

/**
 * Fetches all anime items from Firestore
 */
export async function getAnimes(): Promise<Anime[]> {
  try {
    const q = collection(db, ANIMES_COLL);
    const snap = await getDocs(q);
    const list: Anime[] = [];
    snap.forEach((doc) => {
      list.push(doc.data() as Anime);
    });
    return list;
  } catch (error) {
    console.warn('[Firebase] Error getting animes:', error);
    try {
      handleFirestoreError(error, OperationType.GET, ANIMES_COLL);
    } catch (e) {
      // rethrow or fallback
    }
    return INITIAL_ANIME_DATABASE; // Fallback to memory
  }
}

/**
 * Saves (adds or overwrites) an anime doc
 */
export async function saveAnime(anime: Anime): Promise<void> {
  try {
    const docRef = doc(db, ANIMES_COLL, anime.id);
    const cleanedAnime: any = { ...anime };
    Object.keys(cleanedAnime).forEach(key => {
      if (cleanedAnime[key] === undefined) {
        delete cleanedAnime[key];
      }
    });
    await setDoc(docRef, cleanedAnime);
  } catch (error) {
    console.error('[Firebase] Error saving anime:', error);
    handleFirestoreError(error, OperationType.WRITE, `${ANIMES_COLL}/${anime.id}`);
  }
}

/**
 * Deletes an anime doc
 */
export async function deleteAnime(id: string): Promise<void> {
  try {
    const docRef = doc(db, ANIMES_COLL, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('[Firebase] Error deleting anime:', error);
    handleFirestoreError(error, OperationType.DELETE, `${ANIMES_COLL}/${id}`);
  }
}

/**
 * Adds a comment to a specific anime
 */
export async function addAnimeComment(animeId: string, comment: Comment): Promise<void> {
  try {
    const docRef = doc(db, ANIMES_COLL, animeId);
    await updateDoc(docRef, {
      comments: arrayUnion(comment)
    });
  } catch (error) {
    console.error('[Firebase] Error adding comment:', error);
    handleFirestoreError(error, OperationType.WRITE, `${ANIMES_COLL}/${animeId}`);
  }
}

/**
 * Fetches user profile by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const docRef = doc(db, USERS_COLL, email.toLowerCase().trim());
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as User;
    }
    return null;
  } catch (error) {
    console.warn('[Firebase] Error getting user by email:', error);
    try {
      handleFirestoreError(error, OperationType.GET, `${USERS_COLL}/${email}`);
    } catch (e) {
      // fallback
    }
    return null;
  }
}

/**
 * Saves/updates user profile
 */
export async function saveUser(user: User): Promise<void> {
  const emailKey = user.email.toLowerCase().trim();
  try {
    const docRef = doc(db, USERS_COLL, emailKey);
    const cleanedUser: any = { ...user, email: emailKey };
    Object.keys(cleanedUser).forEach(key => {
      if (cleanedUser[key] === undefined) {
        delete cleanedUser[key];
      }
    });
    await setDoc(docRef, cleanedUser, { merge: true });
  } catch (error) {
    console.error('[Firebase] Error saving user:', error);
    handleFirestoreError(error, OperationType.WRITE, `${USERS_COLL}/${emailKey}`);
  }
}

/**
 * Fetches all user profiles (Admin utility)
 */
export async function getAllUsers(): Promise<User[]> {
  try {
    const q = collection(db, USERS_COLL);
    const snap = await getDocs(q);
    const list: User[] = [];
    snap.forEach((doc) => {
      list.push(doc.data() as User);
    });
    return list;
  } catch (error) {
    console.warn('[Firebase] Error getting all users:', error);
    try {
      handleFirestoreError(error, OperationType.GET, USERS_COLL);
    } catch (e) {
      // fallback
    }
    return DEFAULT_USERS;
  }
}

/**
 * Fetches system configuration settings
 */
export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    const docRef = doc(db, SETTINGS_COLL, 'system');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as SystemSettings;
    }
    return INITIAL_SYSTEM_SETTINGS;
  } catch (error) {
    console.warn('[Firebase] Error getting settings:', error);
    try {
      handleFirestoreError(error, OperationType.GET, `${SETTINGS_COLL}/system`);
    } catch (e) {
      // fallback
    }
    return INITIAL_SYSTEM_SETTINGS;
  }
}

/**
 * Saves system configuration settings
 */
export async function saveSystemSettings(settings: SystemSettings): Promise<void> {
  try {
    const docRef = doc(db, SETTINGS_COLL, 'system');
    const cleanedSettings: any = { ...settings };
    Object.keys(cleanedSettings).forEach(key => {
      if (cleanedSettings[key] === undefined) {
        delete cleanedSettings[key];
      }
    });
    await setDoc(docRef, cleanedSettings);
  } catch (error) {
    console.error('[Firebase] Error saving settings:', error);
    handleFirestoreError(error, OperationType.WRITE, `${SETTINGS_COLL}/system`);
  }
}

/**
 * Signs out current user from Firebase Auth
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('[Firebase Auth] Sign out failed:', error);
  }
}

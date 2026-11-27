import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  setDoc,
  where,
} from "firebase/firestore";
import { distanceKm, isValidGeoPoint, LEAD_RADIUS_KM } from "@/lib/geo";
import { omitUndefinedFields } from "@/lib/utils";
import {
  AppSettings,
  CoinWallet,
  LeadContact,
  LeadProfile,
  LeadUnlock,
  ServiceProviderProfile,
  UserProfile,
} from "@/types";

const leadProfilesRef = collection(db, "leadProfiles");
const leadContactsRef = collection(db, "leadContacts");
const walletsRef = collection(db, "wallets");
const leadUnlocksRef = collection(db, "leadUnlocks");
const settingsRef = doc(db, "settings", "app_settings");

export const DEFAULT_PROVIDER_COINS = 100;
export const DEFAULT_LEAD_UNLOCK_COST = 10;

export type NearbyLead = LeadProfile & { distanceKm: number };

export async function getLeadSettings(): Promise<{ defaultProviderCoins: number; leadUnlockCost: number }> {
  const snap = await getDoc(settingsRef);
  const data = snap.exists() ? (snap.data() as AppSettings) : null;
  return {
    defaultProviderCoins: data?.defaultProviderCoins ?? DEFAULT_PROVIDER_COINS,
    leadUnlockCost: data?.leadUnlockCost ?? DEFAULT_LEAD_UNLOCK_COST,
  };
}

/** Keeps public directory data separate from private contact details. */
export async function syncLeadRegistration(profile: UserProfile): Promise<void> {
  const coordinates = { lat: profile.lat, lng: profile.lng };
  if (profile.role === "SUPER_ADMIN" || !isValidGeoPoint(coordinates)) return;

  const providerType = (profile as ServiceProviderProfile).providerType;
  const directoryProfile = omitUndefinedFields<LeadProfile>({
    uid: profile.uid,
    displayName: profile.displayName,
    role: profile.role,
    providerType,
    lat: coordinates.lat,
    lng: coordinates.lng,
    state: profile.state,
    district: profile.district,
    city: profile.city,
    hasPhone: Boolean(profile.phoneNumber?.trim()),
    updatedAt: Date.now(),
  });
  const contact: LeadContact = {
    uid: profile.uid,
    email: profile.email,
    phoneNumber: profile.phoneNumber || "",
  };

  await Promise.all([
    setDoc(doc(leadProfilesRef, profile.uid), directoryProfile, { merge: true }),
    setDoc(doc(leadContactsRef, profile.uid), contact, { merge: true }),
  ]);
}

export async function ensureProviderWallet(uid: string): Promise<CoinWallet> {
  const walletRef = doc(walletsRef, uid);
  const existing = await getDoc(walletRef);
  if (existing.exists()) return { uid, ...existing.data() } as CoinWallet;

  const { defaultProviderCoins } = await getLeadSettings();
  const wallet: CoinWallet = {
    uid,
    balance: defaultProviderCoins,
    lastUnlockId: "",
    updatedAt: Date.now(),
  };
  await setDoc(walletRef, wallet);
  return wallet;
}

export async function getProviderWallet(uid: string): Promise<CoinWallet> {
  return ensureProviderWallet(uid);
}

export async function getAllWallets(): Promise<CoinWallet[]> {
  const snap = await getDocs(walletsRef);
  return snap.docs.map((wallet) => ({ uid: wallet.id, ...wallet.data() }) as CoinWallet);
}

export async function getNearbyLeads(provider: UserProfile): Promise<NearbyLead[]> {
  if (!isValidGeoPoint(provider)) {
    throw new Error("Your registration location is missing. Please update your profile coordinates first.");
  }

  const snap = await getDocs(leadProfilesRef);
  return snap.docs
    .map((lead) => lead.data() as LeadProfile)
    .filter((lead) => lead.uid !== provider.uid && lead.role !== "SUPER_ADMIN" && isValidGeoPoint(lead))
    .map((lead) => ({
      ...lead,
      distanceKm: distanceKm(provider, lead),
    }))
    .filter((lead) => lead.distanceKm <= LEAD_RADIUS_KM)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export async function getProviderUnlocks(providerId: string): Promise<LeadUnlock[]> {
  const snap = await getDocs(query(leadUnlocksRef, where("providerId", "==", providerId)));
  return snap.docs.map((unlock) => ({ id: unlock.id, ...unlock.data() }) as LeadUnlock);
}

export async function getUnlockedContact(providerId: string, leadId: string): Promise<LeadContact | null> {
  const unlockSnap = await getDoc(doc(leadUnlocksRef, `${providerId}_${leadId}`));
  if (!unlockSnap.exists()) return null;
  const contactSnap = await getDoc(doc(leadContactsRef, leadId));
  return contactSnap.exists() ? (contactSnap.data() as LeadContact) : null;
}

export interface UnlockLeadResult {
  contact: LeadContact | null;
  balance: number;
  alreadyUnlocked: boolean;
}

/** Atomically spends coins and creates the permanent unlock receipt. */
export async function unlockLead(providerId: string, leadId: string): Promise<UnlockLeadResult> {
  const { leadUnlockCost } = await getLeadSettings();
  const unlockId = `${providerId}_${leadId}`;
  const walletRef = doc(walletsRef, providerId);
  const unlockRef = doc(leadUnlocksRef, unlockId);

  const result = await runTransaction(db, async (transaction) => {
    const [walletSnap, unlockSnap] = await Promise.all([
      transaction.get(walletRef),
      transaction.get(unlockRef),
    ]);

    if (!walletSnap.exists()) {
      throw new Error("Your coin wallet is not initialized. Reload the page and try again.");
    }

    const wallet = walletSnap.data() as CoinWallet;
    if (unlockSnap.exists()) {
      return { balance: wallet.balance, alreadyUnlocked: true };
    }
    if (wallet.balance < leadUnlockCost) {
      throw new Error(`Insufficient coins. You need ${leadUnlockCost} coins to unlock this number.`);
    }

    const now = Date.now();
    const balance = wallet.balance - leadUnlockCost;
    transaction.update(walletRef, { balance, lastUnlockId: unlockId, updatedAt: now });
    transaction.set(unlockRef, {
      providerId,
      leadId,
      coinsSpent: leadUnlockCost,
      createdAt: now,
    });
    return { balance, alreadyUnlocked: false };
  });

  const contactSnap = await getDoc(doc(leadContactsRef, leadId));
  return {
    ...result,
    contact: contactSnap.exists() ? (contactSnap.data() as LeadContact) : null,
  };
}

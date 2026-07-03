import { auth, db } from "./firebase";
import { 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { UserProfile } from "@/types";

export const login = async (email: string, pass: string) => {
  return await signInWithEmailAndPassword(auth, email, pass);
};

export const logout = async () => {
  return await signOut(auth);
};

export const register = async (
  email: string, 
  pass: string, 
  profile: UserProfile
) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const user = userCredential.user;

  // Update auth profile
  await updateProfile(user, {
    displayName: profile.displayName,
    photoURL: profile.photoURL || undefined,
  });

  // Create Firestore profile
  await setDoc(doc(db, "users", user.uid), {
    ...profile,
    uid: user.uid,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  return userCredential.user;
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userDoc = await getDoc(doc(db, "users", uid));
  if (userDoc.exists()) {
    return userDoc.data() as UserProfile;
  }
  return null;
};
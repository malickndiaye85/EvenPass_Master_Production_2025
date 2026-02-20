import { db } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  getDocs,
  updateDoc,
  Timestamp
} from 'firebase/firestore';

export interface AccessCode {
  code: string;
  type: 'vehicle' | 'staff';
  vehicleId?: string;
  vehiclePlate?: string;
  staffName?: string;
  staffRole?: string;
  companyId?: string;
  isActive: boolean;
  createdAt: Timestamp;
  lastUsed?: Timestamp;
  usageCount: number;
}

const ACCESS_CODES_COLLECTION = 'access_codes';

export async function generateUniqueCode(): Promise<string> {
  let code: string;
  let exists = true;

  while (exists) {
    code = Math.floor(100000 + Math.random() * 900000).toString();

    const q = query(
      collection(db, ACCESS_CODES_COLLECTION),
      where('code', '==', code)
    );
    const snapshot = await getDocs(q);
    exists = !snapshot.empty;
  }

  return code!;
}

export async function createVehicleAccessCode(
  vehicleId: string,
  vehiclePlate: string,
  companyId?: string
): Promise<string> {
  const code = await generateUniqueCode();

  const accessCodeData: AccessCode = {
    code,
    type: 'vehicle',
    vehicleId,
    vehiclePlate,
    companyId,
    isActive: true,
    createdAt: Timestamp.now(),
    usageCount: 0
  };

  await setDoc(doc(db, ACCESS_CODES_COLLECTION, code), accessCodeData);

  return code;
}

export async function createStaffAccessCode(
  staffName: string,
  staffRole: string,
  companyId?: string
): Promise<string> {
  const code = await generateUniqueCode();

  const accessCodeData: AccessCode = {
    code,
    type: 'staff',
    staffName,
    staffRole,
    companyId,
    isActive: true,
    createdAt: Timestamp.now(),
    usageCount: 0
  };

  await setDoc(doc(db, ACCESS_CODES_COLLECTION, code), accessCodeData);

  return code;
}

export async function validateAccessCode(code: string): Promise<AccessCode | null> {
  const docRef = doc(db, ACCESS_CODES_COLLECTION, code);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const accessCode = docSnap.data() as AccessCode;

  if (!accessCode.isActive) {
    return null;
  }

  await updateDoc(docRef, {
    lastUsed: Timestamp.now(),
    usageCount: accessCode.usageCount + 1
  });

  return accessCode;
}

export async function getAccessCodeByVehicle(vehicleId: string): Promise<AccessCode | null> {
  const q = query(
    collection(db, ACCESS_CODES_COLLECTION),
    where('vehicleId', '==', vehicleId),
    where('isActive', '==', true)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].data() as AccessCode;
}

export async function deactivateAccessCode(code: string): Promise<void> {
  const docRef = doc(db, ACCESS_CODES_COLLECTION, code);
  await updateDoc(docRef, {
    isActive: false
  });
}

export async function reactivateAccessCode(code: string): Promise<void> {
  const docRef = doc(db, ACCESS_CODES_COLLECTION, code);
  await updateDoc(docRef, {
    isActive: true
  });
}

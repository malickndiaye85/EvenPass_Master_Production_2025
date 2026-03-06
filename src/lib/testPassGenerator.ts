import { ref, push, set, get, remove } from 'firebase/database';
import { db } from '../firebase';

export interface TestSAMAPass {
  id: string;
  qr_code: string;
  full_name: string;
  subscriber_phone: string;
  start_date: string;
  end_date: string;
  status: 'active';
  subscription_type: 'monthly';
  subscription_tier: 'eco';
  route_id: string;
  route_name: string;
  created_at: string;
  test_pass: boolean;
  photo_url?: string;
}

function generateTestPhoneNumber(): string {
  const operators = ['77', '78', '76', '70'];
  const operator = operators[Math.floor(Math.random() * operators.length)];
  const number = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return `221${operator}${number}`;
}

function generateTestQRCode(phone: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 100000);
  return `SAMAPASS-${phone}-${timestamp}${random}`;
}

export async function generateTestSAMAPass(): Promise<TestSAMAPass> {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + 30);

  const phoneNumber = generateTestPhoneNumber();
  const qrCode = generateTestQRCode(phoneNumber);

  const testPass: Omit<TestSAMAPass, 'id'> = {
    qr_code: qrCode,
    full_name: `Test User ${Math.floor(Math.random() * 1000)}`,
    subscriber_phone: phoneNumber,
    start_date: now.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    status: 'active',
    subscription_type: 'monthly',
    subscription_tier: 'eco',
    route_id: 'test-route',
    route_name: 'Ligne Test DEM-DEM',
    created_at: now.toISOString(),
    test_pass: true
  };

  const abonnementsRef = ref(db, 'abonnements_express');
  const newPassRef = push(abonnementsRef);

  await set(newPassRef, testPass);

  console.log('[TEST-PASS] ✅ Pass de test créé:', {
    id: newPassRef.key,
    qr_code: qrCode,
    phone: phoneNumber
  });

  return {
    id: newPassRef.key!,
    ...testPass
  };
}

export async function deleteAllTestPasses(): Promise<number> {
  const abonnementsRef = ref(db, 'abonnements_express');
  const snapshot = await get(abonnementsRef);

  if (!snapshot.exists()) {
    return 0;
  }

  let deletedCount = 0;
  const deletePromises: Promise<void>[] = [];

  snapshot.forEach((childSnapshot) => {
    const pass = childSnapshot.val();
    if (pass.test_pass === true) {
      const passRef = ref(db, `abonnements_express/${childSnapshot.key}`);
      deletePromises.push(remove(passRef));
      deletedCount++;
    }
  });

  await Promise.all(deletePromises);

  console.log(`[TEST-PASS] 🗑️ ${deletedCount} pass de test supprimés`);

  return deletedCount;
}

export async function getTestPassesCount(): Promise<number> {
  const abonnementsRef = ref(db, 'abonnements_express');
  const snapshot = await get(abonnementsRef);

  if (!snapshot.exists()) {
    return 0;
  }

  let count = 0;
  snapshot.forEach((childSnapshot) => {
    const pass = childSnapshot.val();
    if (pass.test_pass === true) {
      count++;
    }
  });

  return count;
}

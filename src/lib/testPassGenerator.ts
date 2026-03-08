import { ref, push, set, get, remove } from 'firebase/database';
import { db } from '../firebase';

export interface TestSAMAPass {
  id: string;
  qrCode: string;
  passengerName: string;
  passengerPhone: string;
  startDate: number;
  endDate: number;
  expiresAt: number;
  status: 'active';
  subscriptionType: 'monthly' | 'weekly';
  subscriptionTier: 'eco' | 'standard' | 'prestige';
  routeId: string;
  routeName: string;
  createdAt: number;
  test_pass: boolean;
  photoUrl?: string;
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

// Lignes disponibles pour les tests
const TEST_ROUTES = [
  { id: 'keur-massar-ucad', name: 'Keur Massar ⇄ UCAD' },
  { id: 'keur-massar-petersen', name: 'Keur Massar ⇄ Petersen' },
  { id: 'keur-massar-centre', name: 'Keur Massar ⇄ Dakar Centre' },
  { id: 'pikine-plateau', name: 'Pikine ⇄ Plateau' },
  { id: 'guediawaye-centre', name: 'Guédiawaye ⇄ Centre-ville' }
];

const FIRST_NAMES = ['Amadou', 'Fatou', 'Moussa', 'Aïssatou', 'Cheikh', 'Mariama', 'Ousmane', 'Khady', 'Ibrahima', 'Binta'];
const LAST_NAMES = ['Diallo', 'Ndiaye', 'Sow', 'Diop', 'Fall', 'Sarr', 'Ba', 'Sy', 'Gueye', 'Thiam'];

export async function generateTestSAMAPass(
  routeId?: string,
  tier: 'eco' | 'standard' | 'prestige' = 'eco',
  type: 'weekly' | 'monthly' = 'monthly'
): Promise<TestSAMAPass> {
  const now = Date.now();
  const durationDays = type === 'weekly' ? 7 : 30;
  const endDate = now + (durationDays * 24 * 60 * 60 * 1000);

  const phoneNumber = generateTestPhoneNumber();
  const qrCode = generateTestQRCode(phoneNumber);

  // Sélectionner une ligne aléatoire si non spécifiée
  const selectedRoute = routeId
    ? TEST_ROUTES.find(r => r.id === routeId) || TEST_ROUTES[0]
    : TEST_ROUTES[Math.floor(Math.random() * TEST_ROUTES.length)];

  // Générer un nom sénégalais aléatoire
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];

  const testPass: Omit<TestSAMAPass, 'id'> = {
    qrCode: qrCode,
    passengerName: `${firstName} ${lastName}`,
    passengerPhone: phoneNumber,
    startDate: now,
    endDate: endDate,
    expiresAt: endDate,
    status: 'active',
    subscriptionType: type,
    subscriptionTier: tier,
    routeId: selectedRoute.id,
    routeName: selectedRoute.name,
    createdAt: now,
    test_pass: true
  };

  // Enregistrer dans demdem/sama_passes (chemin utilisé par EPscanT)
  const abonnementsRef = ref(db, 'demdem/sama_passes');
  const newPassRef = push(abonnementsRef);

  await set(newPassRef, testPass);

  console.log('[TEST-PASS] ✅ Pass de test créé:', {
    id: newPassRef.key,
    qrCode: qrCode,
    phone: phoneNumber,
    name: testPass.passengerName,
    route: selectedRoute.name,
    tier: tier,
    type: type,
    path: 'demdem/sama_passes'
  });

  return {
    id: newPassRef.key!,
    ...testPass
  };
}

export async function deleteAllTestPasses(): Promise<number> {
  const abonnementsRef = ref(db, 'demdem/sama_passes');
  const snapshot = await get(abonnementsRef);

  if (!snapshot.exists()) {
    return 0;
  }

  let deletedCount = 0;
  const deletePromises: Promise<void>[] = [];

  snapshot.forEach((childSnapshot) => {
    const pass = childSnapshot.val();
    if (pass.test_pass === true) {
      const passRef = ref(db, `demdem/sama_passes/${childSnapshot.key}`);
      deletePromises.push(remove(passRef));
      deletedCount++;
    }
  });

  await Promise.all(deletePromises);

  console.log(`[TEST-PASS] 🗑️ ${deletedCount} pass de test supprimés de demdem/sama_passes`);

  return deletedCount;
}

export async function getTestPassesCount(): Promise<number> {
  const abonnementsRef = ref(db, 'demdem/sama_passes');
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

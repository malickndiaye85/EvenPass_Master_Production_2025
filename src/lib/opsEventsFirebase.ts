import { database, firestore } from '../firebase';
import { ref, push, set, get, update, remove, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { collection, query as firestoreQuery, getDocs, orderBy as firestoreOrderBy, where } from 'firebase/firestore';

export interface Controller {
  id: string;
  name: string;
  code: string;
  eventId: string;
  position: string;
  createdAt: number;
  isActive: boolean;
  totalScans: number;
  fraudAttempts: number;
  lastScanAt?: number;
}

export interface ScanRecord {
  id: string;
  controllerId: string;
  controllerName: string;
  eventId: string;
  ticketId: string;
  timestamp: number;
  isFraud: boolean;
  ticketType?: string;
  attendeeName?: string;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  date: number;
  location: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  totalTickets: number;
  scannedTickets: number;
  activeControllers: number;
  createdAt: number;
  completedAt?: number;
}

export interface ControllerStats {
  controllerId: string;
  controllerName: string;
  totalScans: number;
  fraudAttempts: number;
  lastScanAt: number;
  position: string;
}

// Generate unique 6-digit code
export function generateControllerCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Verify code is unique
export async function isCodeUnique(code: string): Promise<boolean> {
  const controllersRef = ref(database, 'opsEvents/controllers');
  const codeQuery = query(controllersRef, orderByChild('code'), equalTo(code));
  const snapshot = await get(codeQuery);
  return !snapshot.exists();
}

// Create controller
export async function createController(
  eventId: string,
  name: string,
  position: string
): Promise<Controller> {
  console.log('[CREATE CONTROLLER] Starting creation for:', { eventId, name, position });

  try {
    let code = generateControllerCode();
    console.log('[CREATE CONTROLLER] Generated code:', code);

    // Ensure code is unique
    let attempts = 0;
    while (!(await isCodeUnique(code)) && attempts < 10) {
      code = generateControllerCode();
      attempts++;
      console.log('[CREATE CONTROLLER] Code collision, retry:', attempts);
    }

    if (attempts >= 10) {
      throw new Error('Impossible de générer un code unique après 10 tentatives');
    }

    const controllersRef = ref(database, 'opsEvents/controllers');
    const newControllerRef = push(controllersRef);
    console.log('[CREATE CONTROLLER] Generated controller ID:', newControllerRef.key);

    const controller: Controller = {
      id: newControllerRef.key!,
      name,
      code,
      eventId,
      position,
      createdAt: Date.now(),
      isActive: true,
      totalScans: 0,
      fraudAttempts: 0
    };

    console.log('[CREATE CONTROLLER] Saving to database:', controller);
    await set(newControllerRef, controller);
    console.log('[CREATE CONTROLLER] Successfully created controller');

    return controller;
  } catch (error) {
    console.error('[CREATE CONTROLLER] Error creating controller:', error);
    throw error;
  }
}

// Get controller by code
export async function getControllerByCode(code: string): Promise<Controller | null> {
  const controllersRef = ref(database, 'opsEvents/controllers');
  const codeQuery = query(controllersRef, orderByChild('code'), equalTo(code));
  const snapshot = await get(codeQuery);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.val();
  const controllerId = Object.keys(data)[0];
  return { ...data[controllerId], id: controllerId };
}

// Update controller
export async function updateController(
  controllerId: string,
  updates: Partial<Controller>
): Promise<void> {
  const controllerRef = ref(database, `opsEvents/controllers/${controllerId}`);
  await update(controllerRef, updates);
}

// Delete controller
export async function deleteController(controllerId: string): Promise<void> {
  const controllerRef = ref(database, `opsEvents/controllers/${controllerId}`);
  await remove(controllerRef);
}

// Get all controllers for an event
export async function getEventControllers(eventId: string): Promise<Controller[]> {
  const controllersRef = ref(database, 'opsEvents/controllers');
  const eventQuery = query(controllersRef, orderByChild('eventId'), equalTo(eventId));
  const snapshot = await get(eventQuery);

  if (!snapshot.exists()) {
    return [];
  }

  const controllers: Controller[] = [];
  snapshot.forEach((child) => {
    controllers.push({ ...child.val(), id: child.key });
  });

  return controllers;
}

// Record a scan
export async function recordScan(
  controllerId: string,
  controllerName: string,
  eventId: string,
  ticketId: string,
  isFraud: boolean,
  ticketType?: string,
  attendeeName?: string
): Promise<void> {
  const scansRef = ref(database, 'opsEvents/scans');
  const newScanRef = push(scansRef);

  const scan: ScanRecord = {
    id: newScanRef.key!,
    controllerId,
    controllerName,
    eventId,
    ticketId,
    timestamp: Date.now(),
    isFraud,
    ticketType,
    attendeeName
  };

  await set(newScanRef, scan);

  // Update controller stats
  const controllerRef = ref(database, `opsEvents/controllers/${controllerId}`);
  const controllerSnap = await get(controllerRef);

  if (controllerSnap.exists()) {
    const controller = controllerSnap.val();
    await update(controllerRef, {
      totalScans: (controller.totalScans || 0) + 1,
      fraudAttempts: (controller.fraudAttempts || 0) + (isFraud ? 1 : 0),
      lastScanAt: Date.now()
    });
  }

  // Update event stats (only if not fraud)
  if (!isFraud) {
    const eventRef = ref(database, `opsEvents/events/${eventId}`);
    const eventSnap = await get(eventRef);

    if (eventSnap.exists()) {
      const event = eventSnap.val();
      await update(eventRef, {
        scannedTickets: (event.scannedTickets || 0) + 1
      });
    }
  }
}

// Get event scans
export async function getEventScans(eventId: string): Promise<ScanRecord[]> {
  const scansRef = ref(database, 'opsEvents/scans');
  const eventQuery = query(scansRef, orderByChild('eventId'), equalTo(eventId));
  const snapshot = await get(eventQuery);

  if (!snapshot.exists()) {
    return [];
  }

  const scans: ScanRecord[] = [];
  snapshot.forEach((child) => {
    scans.push({ ...child.val(), id: child.key });
  });

  return scans.sort((a, b) => b.timestamp - a.timestamp);
}

// Get all events from global Firestore collection and sync to OPS tracking
export async function getAllEventsFromFirestore(): Promise<Event[]> {
  try {
    const eventsRef = collection(firestore, 'events');

    // FORCE : AUCUN FILTRE - LECTURE BRUTE DE TOUS LES DOCUMENTS
    const snapshot = await getDocs(eventsRef);

    console.log('🔍 [OPS EVENTS DEBUG] Collection "events" - Nombre total de documents:', snapshot.size);

    if (snapshot.empty) {
      console.error('❌ [OPS EVENTS] COLLECTION VIDE - Aucun document trouvé dans "events"');
      return [];
    }

    const events: Event[] = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();

      console.log('📄 [OPS EVENTS] Document trouvé:', {
        id: docSnap.id,
        allFields: Object.keys(data),
        title: data.title,
        name: data.name,
        status: data.status,
        statut: data.statut,
        start_date: data.start_date,
        date: data.date,
        venue_name: data.venue_name,
        venue_city: data.venue_city
      });

      // Mapping flexible - accepte plusieurs variations de champs
      const eventName = data.title || data.name || 'Événement sans titre';
      const eventDate = data.start_date?.toMillis
        ? data.start_date.toMillis()
        : (data.date?.toMillis ? data.date.toMillis() : Date.now());

      const now = Date.now();
      let status: 'upcoming' | 'ongoing' | 'completed' = 'upcoming';

      if (eventDate < now) {
        const endDate = data.end_date?.toMillis ? data.end_date.toMillis() : eventDate + 86400000;
        status = endDate < now ? 'completed' : 'ongoing';
      }

      const event: Event = {
        id: docSnap.id,
        name: eventName,
        description: data.description || '',
        date: eventDate,
        location: `${data.venue_name || ''}, ${data.venue_city || ''}`.trim() || 'Lieu non spécifié',
        status,
        totalTickets: data.total_capacity || data.capacity || 1000,
        scannedTickets: 0,
        activeControllers: 0,
        createdAt: data.created_at?.toMillis ? data.created_at.toMillis() : Date.now()
      };

      // Vérifier si l'événement a des données OPS (optionnel, ne bloque pas si permission denied)
      try {
        const opsEventRef = ref(database, `opsEvents/events/${docSnap.id}`);
        const opsSnapshot = await get(opsEventRef);

        if (opsSnapshot.exists()) {
          const opsData = opsSnapshot.val();
          event.scannedTickets = opsData.scannedTickets || 0;
          event.activeControllers = opsData.activeControllers || 0;
          console.log('📊 [OPS EVENTS] Données OPS chargées pour:', eventName);
        }
      } catch (dbError) {
        console.warn('⚠️ [OPS EVENTS] Impossible de charger les données OPS Realtime Database (permission denied), continuons avec Firestore uniquement:', eventName);
      }

      events.push(event);
      console.log('✅ [OPS EVENTS] Événement ajouté:', eventName);
    }

    console.log('📊 [OPS EVENTS] Total événements chargés:', events.length);

    return events;
  } catch (error) {
    console.error('❌ [OPS EVENTS] ERREUR lors du chargement:', error);
    return [];
  }
}

// Update event
export async function updateEvent(
  eventId: string,
  updates: Partial<Event>
): Promise<void> {
  const eventRef = ref(database, `opsEvents/events/${eventId}`);
  await update(eventRef, updates);
}

// Legacy: Get all events from OPS tracking only (deprecated, use getAllEventsFromFirestore)
export async function getAllEvents(): Promise<Event[]> {
  return getAllEventsFromFirestore();
}

// Get event
export async function getEvent(eventId: string): Promise<Event | null> {
  const eventRef = ref(database, `opsEvents/events/${eventId}`);
  const snapshot = await get(eventRef);

  if (!snapshot.exists()) {
    return null;
  }

  return { ...snapshot.val(), id: eventId };
}

// Listen to event changes
export function listenToEvent(
  eventId: string,
  callback: (event: Event | null) => void
): () => void {
  const eventRef = ref(database, `opsEvents/events/${eventId}`);

  const unsubscribe = onValue(eventRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ ...snapshot.val(), id: eventId });
    } else {
      callback(null);
    }
  });

  return unsubscribe;
}

// Listen to controllers
export function listenToEventControllers(
  eventId: string,
  callback: (controllers: Controller[]) => void
): () => void {
  const controllersRef = ref(database, 'opsEvents/controllers');
  const eventQuery = query(controllersRef, orderByChild('eventId'), equalTo(eventId));

  const unsubscribe = onValue(eventQuery, (snapshot) => {
    const controllers: Controller[] = [];
    snapshot.forEach((child) => {
      controllers.push({ ...child.val(), id: child.key });
    });
    callback(controllers);
  });

  return unsubscribe;
}

// Listen to scans
export function listenToEventScans(
  eventId: string,
  callback: (scans: ScanRecord[]) => void
): () => void {
  const scansRef = ref(database, 'opsEvents/scans');
  const eventQuery = query(scansRef, orderByChild('eventId'), equalTo(eventId));

  const unsubscribe = onValue(eventQuery, (snapshot) => {
    const scans: ScanRecord[] = [];
    snapshot.forEach((child) => {
      scans.push({ ...child.val(), id: child.key });
    });
    callback(scans.sort((a, b) => b.timestamp - a.timestamp));
  });

  return unsubscribe;
}

// Complete mission (deactivate all controllers)
export async function completeMission(eventId: string): Promise<void> {
  const controllers = await getEventControllers(eventId);

  const updates: Record<string, any> = {};
  controllers.forEach((controller) => {
    updates[`opsEvents/controllers/${controller.id}/isActive`] = false;
  });

  // Update event status
  updates[`opsEvents/events/${eventId}/status`] = 'completed';
  updates[`opsEvents/events/${eventId}/completedAt`] = Date.now();

  const dbRef = ref(database);
  await update(dbRef, updates);
}

// Get controller statistics
export async function getControllerStats(eventId: string): Promise<ControllerStats[]> {
  const controllers = await getEventControllers(eventId);

  return controllers.map((controller) => ({
    controllerId: controller.id,
    controllerName: controller.name,
    totalScans: controller.totalScans || 0,
    fraudAttempts: controller.fraudAttempts || 0,
    lastScanAt: controller.lastScanAt || 0,
    position: controller.position
  })).sort((a, b) => b.totalScans - a.totalScans);
}

// Get affluence data (scans per 15min interval)
export async function getAffluenceData(eventId: string): Promise<{ time: string; scans: number }[]> {
  const scans = await getEventScans(eventId);

  // Group by 15-minute intervals
  const intervals: Record<string, number> = {};

  scans.forEach((scan) => {
    if (!scan.isFraud) {
      const date = new Date(scan.timestamp);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = Math.floor(date.getMinutes() / 15) * 15;
      const minutesStr = minutes.toString().padStart(2, '0');
      const key = `${hours}:${minutesStr}`;

      intervals[key] = (intervals[key] || 0) + 1;
    }
  });

  return Object.entries(intervals)
    .map(([time, scans]) => ({ time, scans }))
    .sort((a, b) => a.time.localeCompare(b.time));
}

// Export report data
export interface ReportData {
  event: Event;
  controllers: ControllerStats[];
  scans: ScanRecord[];
  affluence: { time: string; scans: number }[];
  summary: {
    totalScans: number;
    validScans: number;
    fraudAttempts: number;
    totalControllers: number;
  };
}

export async function generateReportData(eventId: string): Promise<ReportData> {
  const event = await getEvent(eventId);
  if (!event) {
    throw new Error('Event not found');
  }

  const controllers = await getControllerStats(eventId);
  const scans = await getEventScans(eventId);
  const affluence = await getAffluenceData(eventId);

  const validScans = scans.filter(s => !s.isFraud).length;
  const fraudAttempts = scans.filter(s => s.isFraud).length;

  return {
    event,
    controllers,
    scans,
    affluence,
    summary: {
      totalScans: scans.length,
      validScans,
      fraudAttempts,
      totalControllers: controllers.length
    }
  };
}

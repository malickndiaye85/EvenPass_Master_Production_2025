import { ref, onValue, push, set, remove, update, get, Database } from 'firebase/database';
import { db } from '../firebase';

export interface TransportLine {
  id: string;
  name: string;
  route: string;
  price_weekly: number;
  price_monthly: number;
  price_quarterly: number;
  is_active: boolean;
  created_at: string;
}

export interface BusRouteDisplay {
  id: string;
  routeNumber: number;
  name: string;
  origin: string;
  destination: string;
  distance: number;
  duration: number;
  pricing: {
    eco: number;
    comfort: number;
  };
  schedule: {
    eco: {
      firstDeparture: string;
      lastDeparture: string;
      frequency: number;
    };
    comfort: {
      firstDeparture: string;
      lastDeparture: string;
      frequency: number;
    };
  };
  isActive: boolean;
}

export async function getActiveTransportLines(): Promise<BusRouteDisplay[]> {
  if (!db) {
    console.error('[DEBUG-ROUTES] Database not initialized');
    return [];
  }

  try {
    const linesRef = ref(db, 'transport_lines');
    const snapshot = await get(linesRef);

    console.log('[DEBUG-ROUTES] Snapshot exists:', snapshot.exists());

    if (!snapshot.exists()) {
      console.log('[DEBUG-ROUTES] No data found in transport_lines');
      return [];
    }

    const data = snapshot.val();
    console.log('[DEBUG-ROUTES] Raw data from Firebase:', data);

    const linesArray: TransportLine[] = Object.keys(data).map(key => ({
      id: key,
      ...data[key]
    }));

    console.log('[DEBUG-ROUTES] Parsed lines array:', linesArray);

    const activeLines = linesArray.filter(line => line.is_active);
    console.log('[DEBUG-ROUTES] Active lines:', activeLines);

    const displayRoutes: BusRouteDisplay[] = activeLines.map((line, index) => {
      const [origin, destination] = line.route.split('⇄').map(s => s.trim());

      return {
        id: line.id,
        routeNumber: index + 1,
        name: line.name,
        origin: origin || 'Origine',
        destination: destination || 'Destination',
        distance: 50,
        duration: 60,
        pricing: {
          eco: line.price_weekly,
          comfort: line.price_monthly
        },
        schedule: {
          eco: {
            firstDeparture: '05:00',
            lastDeparture: '22:00',
            frequency: 30
          },
          comfort: {
            firstDeparture: '05:00',
            lastDeparture: '22:00',
            frequency: 45
          }
        },
        isActive: line.is_active
      };
    });

    console.log('[DEBUG-ROUTES] Transformed display routes:', displayRoutes);

    return displayRoutes;
  } catch (error) {
    console.error('[DEBUG-ROUTES] Error fetching transport lines:', error);
    return [];
  }
}

export function subscribeToTransportLines(
  callback: (lines: TransportLine[]) => void
): () => void {
  if (!db) {
    console.error('Database not initialized');
    return () => {};
  }

  const linesRef = ref(db, 'transport_lines');

  const unsubscribe = onValue(linesRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const linesArray = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
      callback(linesArray);
    } else {
      callback([]);
    }
  });

  return unsubscribe;
}

export async function createTransportLine(
  lineData: Omit<TransportLine, 'id' | 'created_at'>
): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  const linesRef = ref(db, 'transport_lines');
  const newLineRef = push(linesRef);

  await set(newLineRef, {
    ...lineData,
    created_at: new Date().toISOString()
  });
}

export async function updateLineStatus(
  lineId: string,
  isActive: boolean
): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  const lineRef = ref(db, `transport_lines/${lineId}`);
  await update(lineRef, { is_active: isActive });
}

export async function deleteLine(lineId: string): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  const lineRef = ref(db, `transport_lines/${lineId}`);
  await remove(lineRef);
}

import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp, orderBy } from 'firebase/firestore';
import { firestore } from '../firebase';
import type { Vessel, PassTicket, Cargo, Manifest, MaritimeUser, VoyageStats } from '../types/maritime';

export const VESSELS: Vessel[] = [
  {
    id: 'ferry-1',
    name: 'Ferry Dakar 1',
    type: 'ferry',
    capacity_passengers: 500,
    capacity_vehicles: 50,
    capacity_cargo_kg: 100000,
    route: 'Dakar - Ziguinchor',
    status: 'active',
    created_at: new Date()
  },
  {
    id: 'ferry-2',
    name: 'Ferry Dakar 2',
    type: 'ferry',
    capacity_passengers: 500,
    capacity_vehicles: 50,
    capacity_cargo_kg: 100000,
    route: 'Dakar - Ziguinchor',
    status: 'active',
    created_at: new Date()
  },
  {
    id: 'ferry-3',
    name: 'Ferry Casamance 1',
    type: 'ferry',
    capacity_passengers: 450,
    capacity_vehicles: 45,
    capacity_cargo_kg: 90000,
    route: 'Dakar - Ziguinchor',
    status: 'active',
    created_at: new Date()
  },
  {
    id: 'ferry-4',
    name: 'Ferry Casamance 2',
    type: 'ferry',
    capacity_passengers: 450,
    capacity_vehicles: 45,
    capacity_cargo_kg: 90000,
    route: 'Dakar - Ziguinchor',
    status: 'active',
    created_at: new Date()
  },
  {
    id: 'chaloupe-1',
    name: 'Chaloupe Gorée 1',
    type: 'chaloupe',
    capacity_passengers: 200,
    capacity_vehicles: 0,
    capacity_cargo_kg: 5000,
    route: 'Dakar - Gorée',
    status: 'active',
    created_at: new Date()
  },
  {
    id: 'chaloupe-2',
    name: 'Chaloupe Gorée 2',
    type: 'chaloupe',
    capacity_passengers: 200,
    capacity_vehicles: 0,
    capacity_cargo_kg: 5000,
    route: 'Dakar - Gorée',
    status: 'active',
    created_at: new Date()
  }
];

export async function getTicketsByVessel(vesselId: string, departureDate: string): Promise<PassTicket[]> {
  try {
    const ticketsRef = collection(firestore, 'pass_tickets');
    const q = query(
      ticketsRef,
      where('vessel_id', '==', vesselId),
      where('departure_date', '==', departureDate),
      where('status', '!=', 'cancelled')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PassTicket[];
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return [];
  }
}

export async function getCargoByVessel(vesselId: string, date: string): Promise<Cargo[]> {
  try {
    const cargoRef = collection(firestore, 'cargo');
    const q = query(
      cargoRef,
      where('vessel_id', '==', vesselId),
      where('status', '!=', 'unloaded')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Cargo[];
  } catch (error) {
    console.error('Error fetching cargo:', error);
    return [];
  }
}

export async function generateManifest(vesselId: string, departureDate: string, departureTime: string): Promise<Manifest | null> {
  try {
    const vessel = VESSELS.find(v => v.id === vesselId);
    if (!vessel) return null;

    const passengers = await getTicketsByVessel(vesselId, departureDate);
    const cargo = await getCargoByVessel(vesselId, departureDate);

    const totalCargoWeight = cargo.reduce((sum, c) => sum + c.weight_kg, 0);
    const totalVehicles = cargo.filter(c => c.cargo_type === 'vehicle').length;

    const manifest: Manifest = {
      id: `manifest-${vesselId}-${Date.now()}`,
      vessel_id: vesselId,
      vessel_name: vessel.name,
      route: vessel.route,
      departure_date: departureDate,
      departure_time: departureTime,
      total_passengers: passengers.length,
      total_cargo_weight: totalCargoWeight,
      total_vehicles: totalVehicles,
      passengers,
      cargo,
      status: 'ready',
      generated_by: 'system',
      generated_at: Timestamp.now()
    };

    const manifestRef = await addDoc(collection(firestore, 'manifests'), manifest);
    return { ...manifest, id: manifestRef.id };
  } catch (error) {
    console.error('Error generating manifest:', error);
    return null;
  }
}

export async function updateTicketStatus(ticketId: string, status: 'confirmed' | 'boarded' | 'cancelled', boardedBy?: string): Promise<void> {
  try {
    const ticketRef = doc(firestore, 'pass_tickets', ticketId);
    const updateData: any = { status };

    if (status === 'boarded') {
      updateData.boarded_at = Timestamp.now();
      updateData.boarded_by = boardedBy || 'unknown';
    }

    await updateDoc(ticketRef, updateData);
  } catch (error) {
    console.error('Error updating ticket status:', error);
    throw error;
  }
}

export async function registerCargo(cargoData: Partial<Cargo>): Promise<string> {
  try {
    const cargoRef = await addDoc(collection(firestore, 'cargo'), {
      ...cargoData,
      status: 'registered',
      created_at: Timestamp.now()
    });
    return cargoRef.id;
  } catch (error) {
    console.error('Error registering cargo:', error);
    throw error;
  }
}

export async function getVoyageStats(vesselId: string, startDate: string, endDate: string): Promise<VoyageStats[]> {
  try {
    const ticketsRef = collection(firestore, 'pass_tickets');
    const q = query(
      ticketsRef,
      where('vessel_id', '==', vesselId),
      where('departure_date', '>=', startDate),
      where('departure_date', '<=', endDate),
      where('status', '==', 'boarded')
    );

    const snapshot = await getDocs(q);
    const tickets = snapshot.docs.map(doc => doc.data()) as PassTicket[];

    const statsByDate: { [date: string]: VoyageStats } = {};

    tickets.forEach(ticket => {
      const date = ticket.departure_date;
      if (!statsByDate[date]) {
        const vessel = VESSELS.find(v => v.id === vesselId);
        statsByDate[date] = {
          vessel_id: vesselId,
          date,
          total_capacity: vessel?.capacity_passengers || 0,
          passengers_boarded: 0,
          fill_rate: 0,
          revenue_passengers: 0,
          revenue_cargo: 0,
          total_revenue: 0,
          cargo_weight: 0,
          vehicles_count: 0
        };
      }

      statsByDate[date].passengers_boarded++;
      statsByDate[date].revenue_passengers += ticket.price;
    });

    Object.keys(statsByDate).forEach(date => {
      const stats = statsByDate[date];
      stats.fill_rate = (stats.passengers_boarded / stats.total_capacity) * 100;
      stats.total_revenue = stats.revenue_passengers + stats.revenue_cargo;
    });

    return Object.values(statsByDate);
  } catch (error) {
    console.error('Error getting voyage stats:', error);
    return [];
  }
}

export async function getMaritimeUser(uid: string): Promise<MaritimeUser | null> {
  try {
    const usersRef = collection(firestore, 'maritime_users');
    const q = query(usersRef, where('id', '==', uid));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    return snapshot.docs[0].data() as MaritimeUser;
  } catch (error) {
    console.error('Error fetching maritime user:', error);
    return null;
  }
}

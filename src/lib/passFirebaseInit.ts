import { ref, set } from 'firebase/database';
import { db } from '../firebase';

export const initializePassData = async () => {
  const passRef = ref(db, 'pass');

  const passData = {
    lmdg: {
      tarifs: {
        national: {
          adulte: 1500,
          enfant: 1000
        },
        resident: {
          adulte: 2500,
          enfant: 1500
        },
        non_resident: {
          adulte: 5200,
          enfant: 2600
        },
        goreen: {
          adulte: 1000,
          enfant: 500
        }
      },
      schedules: {
        dakar_to_goree: [
          '06:30', '07:30', '08:30', '09:30', '10:30', '11:30', '12:30',
          '13:30', '14:30', '15:30', '16:30', '17:30', '18:30', '19:30',
          '20:30', '21:30', '22:30'
        ],
        goree_to_dakar: [
          '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
          '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
          '21:00', '22:00', '23:00'
        ]
      },
      bookings: {}
    },
    cosama: {
      cabin_types: {
        cabin_2: {
          name: 'Cabine 2 places',
          capacity: 2,
          price: 45000,
          description: 'Cabine confortable pour 2 personnes avec vue mer',
          amenities: ['Climatisation', 'Salle de bain privée', '2 lits superposés', 'Hublot']
        },
        cabin_4: {
          name: 'Cabine 4 places',
          capacity: 4,
          price: 35000,
          description: 'Cabine familiale spacieuse pour 4 personnes',
          amenities: ['Climatisation', 'Salle de bain privée', '4 lits superposés', 'Hublot']
        },
        cabin_8: {
          name: 'Cabine 8 places',
          capacity: 8,
          price: 25000,
          description: 'Cabine économique pour groupe de 8 personnes',
          amenities: ['Ventilation', 'Salle de bain commune', '8 lits superposés']
        },
        pullman: {
          name: 'Fauteuil Pullman',
          capacity: 1,
          price: 15000,
          description: 'Siège inclinable climatisé',
          amenities: ['Climatisation', 'Siège inclinable', 'Accoudoirs']
        }
      },
      schedules: {},
      inventory: {},
      bookings: {},
      supplements: {
        enfant: { name: 'Enfant (2-12 ans)', price: 8000 },
        bebe: { name: 'Bébé (0-2 ans)', price: 0 },
        vehicule_moto: { name: 'Moto/Scooter', price: 15000 },
        vehicule_voiture: { name: 'Voiture', price: 45000 },
        vehicule_camion: { name: 'Camion/4x4', price: 75000 }
      }
    },
    interregional: {
      routes: {
        'dakar-thies': { from: 'Dakar', to: 'Thiès', price: 2500, distance: 70, duration: 1.5 },
        'dakar-mbour': { from: 'Dakar', to: 'Mbour', price: 3000, distance: 80, duration: 2.0 },
        'dakar-kaolack': { from: 'Dakar', to: 'Kaolack', price: 5000, distance: 190, duration: 3.5 },
        'dakar-saintlouis': { from: 'Dakar', to: 'Saint-Louis', price: 6500, distance: 270, duration: 4.5 },
        'dakar-touba': { from: 'Dakar', to: 'Touba', price: 5500, distance: 190, duration: 4.0 },
        'dakar-tambacounda': { from: 'Dakar', to: 'Tambacounda', price: 9000, distance: 450, duration: 7.0 },
        'dakar-ziguinchor': { from: 'Dakar', to: 'Ziguinchor', price: 10000, distance: 450, duration: 8.0 },
        'dakar-kolda': { from: 'Dakar', to: 'Kolda', price: 9500, distance: 420, duration: 7.5 },
        'saintlouis-dakar': { from: 'Saint-Louis', to: 'Dakar', price: 6500, distance: 270, duration: 4.5 },
        'saintlouis-louga': { from: 'Saint-Louis', to: 'Louga', price: 3000, distance: 90, duration: 2.0 },
        'saintlouis-richardtoll': { from: 'Saint-Louis', to: 'Richard-Toll', price: 3500, distance: 100, duration: 2.5 },
        'thies-dakar': { from: 'Thiès', to: 'Dakar', price: 2500, distance: 70, duration: 1.5 },
        'thies-mbour': { from: 'Thiès', to: 'Mbour', price: 2000, distance: 60, duration: 1.5 },
        'thies-kaolack': { from: 'Thiès', to: 'Kaolack', price: 4000, distance: 120, duration: 2.5 },
        'kaolack-dakar': { from: 'Kaolack', to: 'Dakar', price: 5000, distance: 190, duration: 3.5 },
        'kaolack-tambacounda': { from: 'Kaolack', to: 'Tambacounda', price: 6000, distance: 260, duration: 4.0 },
        'kaolack-ziguinchor': { from: 'Kaolack', to: 'Ziguinchor', price: 7000, distance: 280, duration: 5.0 },
        'ziguinchor-dakar': { from: 'Ziguinchor', to: 'Dakar', price: 10000, distance: 450, duration: 8.0 },
        'ziguinchor-kolda': { from: 'Ziguinchor', to: 'Kolda', price: 4500, distance: 150, duration: 3.0 },
        'ziguinchor-bignona': { from: 'Ziguinchor', to: 'Bignona', price: 2500, distance: 60, duration: 1.5 },
        'tambacounda-dakar': { from: 'Tambacounda', to: 'Dakar', price: 9000, distance: 450, duration: 7.0 },
        'tambacounda-kaolack': { from: 'Tambacounda', to: 'Kaolack', price: 6000, distance: 260, duration: 4.0 },
        'tambacounda-kedougou': { from: 'Tambacounda', to: 'Kédougou', price: 6500, distance: 220, duration: 4.5 }
      },
      schedules: {},
      bookings: {}
    }
  };

  try {
    await set(passRef, passData);
    console.log('Pass data initialized successfully');
  } catch (error) {
    console.error('Error initializing pass data:', error);
  }
};

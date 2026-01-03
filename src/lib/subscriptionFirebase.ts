import { db } from '../firebase';
import { ref, set, get, push, query, orderByChild, equalTo } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface Subscription {
  id: string;
  subscription_number: string;
  holder_name: string;
  holder_cni: string;
  holder_phone: string;
  photo_url: string;
  subscription_type: 'monthly' | 'annual';
  route: string;
  start_date: string;
  end_date: string;
  amount_paid: number;
  payment_status: 'pending' | 'paid';
  created_at: number;
  qr_code: string;
}

export const initializeSubscriptionsStructure = async () => {
  const subscriptionsRef = ref(db, 'transport/abonnements');
  const snapshot = await get(subscriptionsRef);

  if (!snapshot.exists()) {
    await set(ref(db, 'transport/abonnements/config'), {
      monthly_price: 25000,
      annual_price: 250000,
      routes: {
        dakar_thies: { name: 'Dakar - Thiès', active: true },
        dakar_mbour: { name: 'Dakar - Mbour', active: true },
        dakar_kaolack: { name: 'Dakar - Kaolack', active: true },
        dakar_saint_louis: { name: 'Dakar - Saint-Louis', active: true }
      }
    });
  }
};

export const uploadSubscriptionPhoto = async (file: File, subscriptionNumber: string): Promise<string> => {
  const storage = getStorage();
  const photoRef = storageRef(storage, `subscriptions/${subscriptionNumber}_${Date.now()}.jpg`);

  const snapshot = await uploadBytes(photoRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);

  return downloadURL;
};

export const createSubscription = async (data: Omit<Subscription, 'id' | 'created_at'>): Promise<string> => {
  const subscriptionsRef = ref(db, 'transport/abonnements/subscriptions');
  const newSubscriptionRef = push(subscriptionsRef);

  const subscription: Subscription = {
    ...data,
    id: newSubscriptionRef.key!,
    created_at: Date.now()
  };

  await set(newSubscriptionRef, subscription);

  return newSubscriptionRef.key!;
};

export const getSubscriptionByNumber = async (subscriptionNumber: string): Promise<Subscription | null> => {
  const subscriptionsRef = ref(db, 'transport/abonnements/subscriptions');
  const subscriptionQuery = query(subscriptionsRef, orderByChild('subscription_number'), equalTo(subscriptionNumber));

  const snapshot = await get(subscriptionQuery);

  if (snapshot.exists()) {
    const data = snapshot.val();
    const key = Object.keys(data)[0];
    return data[key];
  }

  return null;
};

export const generateSubscriptionNumber = (): string => {
  const prefix = 'GG';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
};

export const calculateEndDate = (startDate: string, type: 'monthly' | 'annual'): string => {
  const start = new Date(startDate);
  if (type === 'monthly') {
    start.setMonth(start.getMonth() + 1);
  } else {
    start.setFullYear(start.getFullYear() + 1);
  }
  return start.toISOString().split('T')[0];
};

export const saveSubscriptionToLocalStorage = (subscription: Subscription) => {
  const subscriptions = getLocalSubscriptions();
  subscriptions[subscription.subscription_number] = subscription;
  localStorage.setItem('genaa_gaaw_subscriptions', JSON.stringify(subscriptions));
};

export const getLocalSubscriptions = (): Record<string, Subscription> => {
  const data = localStorage.getItem('genaa_gaaw_subscriptions');
  return data ? JSON.parse(data) : {};
};

export const getLocalSubscriptionByNumber = (subscriptionNumber: string): Subscription | null => {
  const subscriptions = getLocalSubscriptions();
  return subscriptions[subscriptionNumber] || null;
};

export const isSubscriptionValid = (subscription: Subscription): boolean => {
  const now = new Date();
  const endDate = new Date(subscription.end_date);
  return endDate >= now && subscription.payment_status === 'paid';
};

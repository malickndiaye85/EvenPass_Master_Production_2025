import { ref, get, set } from 'firebase/database';
import { db } from '../firebase';

export interface HomeAdsConfig {
  evenBackgroundUrl: string;
  passBackgroundUrl: string;
  lastUpdated: number;
  updatedBy: string;
}

const DEFAULT_EVEN_BG = 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=1920';
const DEFAULT_PASS_BG = 'https://images.pexels.com/photos/3408356/pexels-photo-3408356.jpeg?auto=compress&cs=tinysrgb&w=1920';

export async function getHomeAdsConfig(): Promise<HomeAdsConfig> {
  try {
    const adsRef = ref(db, 'evenpass/global_config/home_ads');
    const snapshot = await get(adsRef);

    if (snapshot.exists()) {
      return snapshot.val();
    }

    return {
      evenBackgroundUrl: DEFAULT_EVEN_BG,
      passBackgroundUrl: DEFAULT_PASS_BG,
      lastUpdated: Date.now(),
      updatedBy: 'system'
    };
  } catch (error) {
    console.error('Error fetching home ads config:', error);
    return {
      evenBackgroundUrl: DEFAULT_EVEN_BG,
      passBackgroundUrl: DEFAULT_PASS_BG,
      lastUpdated: Date.now(),
      updatedBy: 'system'
    };
  }
}

export async function updateHomeAdsConfig(config: HomeAdsConfig): Promise<void> {
  try {
    const adsRef = ref(db, 'evenpass/global_config/home_ads');
    await set(adsRef, config);
  } catch (error) {
    console.error('Error updating home ads config:', error);
    throw error;
  }
}

import { useState, useEffect } from 'react';
import { ref, get, set } from 'firebase/database';
import { db } from '../firebase';

export interface LandingBackground {
  section: 'express' | 'evenement';
  imageUrl: string;
  isActive: boolean;
  uploadedBy?: string;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_BACKGROUNDS: Record<string, string> = {
  express: 'https://images.pexels.com/photos/1562983/pexels-photo-1562983.jpeg?auto=compress&cs=tinysrgb&w=1920',
  evenement: 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=1920'
};

export function useLandingBackgrounds() {
  const [backgrounds, setBackgrounds] = useState<Record<string, string>>(DEFAULT_BACKGROUNDS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBackgrounds();
  }, []);

  const loadBackgrounds = async () => {
    if (!db) {
      console.warn('[LANDING BACKGROUNDS] Firebase DB not configured, using defaults');
      setLoading(false);
      return;
    }

    try {
      const backgroundsRef = ref(db, 'landing_backgrounds');
      const snapshot = await get(backgroundsRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const loadedBackgrounds: Record<string, string> = {};

        Object.keys(data).forEach(key => {
          const bg = data[key];
          if (bg.isActive) {
            loadedBackgrounds[bg.section] = bg.imageUrl;
          }
        });

        if (Object.keys(loadedBackgrounds).length > 0) {
          setBackgrounds({ ...DEFAULT_BACKGROUNDS, ...loadedBackgrounds });
        }
      }
    } catch (error) {
      console.error('[LANDING BACKGROUNDS] Error loading backgrounds:', error);
    } finally {
      setLoading(false);
    }
  };

  return { backgrounds, loading };
}

export async function updateLandingBackground(
  section: 'express' | 'evenement',
  imageUrl: string,
  uploadedBy: string
): Promise<{ success: boolean; error?: string }> {
  if (!db) {
    return { success: false, error: 'Firebase DB not configured' };
  }

  try {
    const backgroundRef = ref(db, `landing_backgrounds/${section}`);
    await set(backgroundRef, {
      section,
      imageUrl,
      isActive: true,
      uploadedBy,
      updatedAt: new Date().toISOString()
    });

    return { success: true };
  } catch (error: any) {
    console.error('[LANDING BACKGROUNDS] Error updating background:', error);
    return { success: false, error: error.message };
  }
}

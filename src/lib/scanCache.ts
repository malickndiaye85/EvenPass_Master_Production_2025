interface CachedTicket {
  ticket_id: string;
  ticket_number: string;
  qr_code: string;
  holder_name: string;
  holder_email: string | null;
  holder_phone: string;
  zone_name: string;
  zone_color: string;
  access_gate: string;
  event_title: string;
  status: string;
  check_in_time: string | null;
  price_paid: number;
  cached_at: number;
}

interface ScanStats {
  totalScans: number;
  validScans: number;
  invalidScans: number;
  scansToday: number;
  lastSync: number;
}

const CACHE_KEY = 'evenpass_scan_cache';
const STATS_KEY = 'evenpass_scan_stats';
const CACHE_DURATION = 1000 * 60 * 60 * 2;

export const ScanCache = {
  saveTicket(ticket: CachedTicket): void {
    try {
      const cache = this.getAllTickets();
      cache[ticket.qr_code] = {
        ...ticket,
        cached_at: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  },

  getTicket(qrCode: string): CachedTicket | null {
    try {
      const cache = this.getAllTickets();
      const ticket = cache[qrCode];

      if (!ticket) return null;

      if (Date.now() - ticket.cached_at > CACHE_DURATION) {
        delete cache[qrCode];
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        return null;
      }

      return ticket;
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  },

  getAllTickets(): Record<string, CachedTicket> {
    try {
      const data = localStorage.getItem(CACHE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error reading cache:', error);
      return {};
    }
  },

  clearCache(): void {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  },

  getStats(): ScanStats {
    try {
      const data = localStorage.getItem(STATS_KEY);
      return data ? JSON.parse(data) : {
        totalScans: 0,
        validScans: 0,
        invalidScans: 0,
        scansToday: 0,
        lastSync: Date.now(),
      };
    } catch (error) {
      return {
        totalScans: 0,
        validScans: 0,
        invalidScans: 0,
        scansToday: 0,
        lastSync: Date.now(),
      };
    }
  },

  updateStats(isValid: boolean): void {
    try {
      const stats = this.getStats();
      stats.totalScans++;
      stats.scansToday++;
      if (isValid) {
        stats.validScans++;
      } else {
        stats.invalidScans++;
      }
      stats.lastSync = Date.now();
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  },

  resetDailyStats(): void {
    try {
      const stats = this.getStats();
      stats.scansToday = 0;
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('Error resetting daily stats:', error);
    }
  },
};

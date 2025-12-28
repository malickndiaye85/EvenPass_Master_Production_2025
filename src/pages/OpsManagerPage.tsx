import { useState, useEffect } from 'react';
import { Calendar, Users, BarChart3, TrendingUp, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Event, Booking, TicketScan } from '../types';

export default function OpsManagerPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [scans, setScans] = useState<TicketScan[]>([]);
  const [stats, setStats] = useState({
    upcomingEvents: 0,
    totalBookings: 0,
    totalScans: 0,
    scanRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [eventsRes, bookingsRes, scansRes] = await Promise.all([
        supabase
          .from('events')
          .select(`
            *,
            organizer:organizers(organization_name),
            category:event_categories(name_fr, color)
          `)
          .eq('status', 'published')
          .gte('start_date', new Date().toISOString())
          .order('start_date'),
        supabase
          .from('bookings')
          .select('*')
          .eq('status', 'confirmed')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('ticket_scans')
          .select('*')
          .order('scan_time', { ascending: false })
          .limit(100)
      ]);

      if (eventsRes.data) {
        setEvents(eventsRes.data as Event[]);
        setStats(prev => ({ ...prev, upcomingEvents: eventsRes.data.length }));
      }

      if (bookingsRes.data) {
        setBookings(bookingsRes.data);
        setStats(prev => ({ ...prev, totalBookings: bookingsRes.data.length }));
      }

      if (scansRes.data) {
        setScans(scansRes.data);
        setStats(prev => ({ ...prev, totalScans: scansRes.data.length }));
      }

      const { count: totalTickets } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'valid');

      const scanRate = totalTickets ? (scansRes.data?.length || 0) / totalTickets * 100 : 0;
      setStats(prev => ({ ...prev, scanRate }));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-900 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white">Ops Manager</h1>
          <p className="text-slate-400 mt-1">Gestion opérationnelle et logistique</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-8 h-8" />
            </div>
            <p className="text-3xl font-bold mb-1">{stats.upcomingEvents}</p>
            <p className="text-sm opacity-75">Événements à venir</p>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8" />
            </div>
            <p className="text-3xl font-bold mb-1">{stats.totalBookings}</p>
            <p className="text-sm opacity-75">Réservations confirmées</p>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="w-8 h-8" />
            </div>
            <p className="text-3xl font-bold mb-1">{stats.totalScans}</p>
            <p className="text-sm opacity-75">Billets scannés</p>
          </div>

          <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8" />
            </div>
            <p className="text-3xl font-bold mb-1">{stats.scanRate.toFixed(1)}%</p>
            <p className="text-sm opacity-75">Taux de présence</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Événements Prochains</h2>

            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {events.map((event) => (
                <div key={event.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-white mb-1">{event.title}</h3>
                      <p className="text-sm text-slate-400">{(event as any).organizer?.organization_name}</p>
                    </div>
                    {event.category && (
                      <span
                        className="px-2 py-1 rounded-full text-xs font-bold text-white ml-2"
                        style={{ backgroundColor: (event.category as any).color }}
                      >
                        {(event.category as any).name_fr}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                    <div>
                      <p className="text-slate-400">Date</p>
                      <p className="text-white font-medium flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(event.start_date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Heure</p>
                      <p className="text-white font-medium flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        {new Date(event.start_date).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-400">Lieu</p>
                      <p className="text-white font-medium">{event.venue_name}, {event.venue_city}</p>
                    </div>
                  </div>

                  {event.capacity && (
                    <div className="mt-3 pt-3 border-t border-slate-600">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Capacité</span>
                        <span className="text-white font-medium">{event.capacity} places</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-6">Réservations Récentes</h2>

              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {bookings.slice(0, 10).map((booking) => (
                  <div key={booking.id} className="bg-slate-700/30 rounded-lg p-3 border border-slate-600">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-white">{booking.customer_name}</p>
                        <p className="text-xs text-slate-400">{booking.booking_number}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-400">{booking.total_amount.toLocaleString()} FCFA</p>
                        <p className="text-xs text-slate-400">
                          {new Date(booking.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h2 className="text-xl font-bold text-white mb-6">Scans Récents</h2>

              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {scans.slice(0, 15).map((scan) => (
                  <div key={scan.id} className="bg-slate-700/30 rounded-lg p-3 border border-slate-600">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        {scan.is_valid ? (
                          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mr-3">
                            <Users className="w-4 h-4 text-white" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center mr-3">
                            <Users className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-white">
                            {scan.is_valid ? 'Scan valide' : 'Scan refusé'}
                          </p>
                          <p className="text-xs text-slate-400">{scan.scan_location || 'Entrée principale'}</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400">
                        {new Date(scan.scan_time).toLocaleTimeString('fr-FR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

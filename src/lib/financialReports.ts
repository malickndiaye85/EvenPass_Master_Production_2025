import { ref, get, query, orderByChild, startAt, endAt } from 'firebase/database';
import { db } from '../firebase';

export interface FinancialSummary {
  even_revenue: number;
  pass_lmdg_revenue: number;
  pass_cosama_revenue: number;
  pass_interregional_revenue: number;
  pass_subscriptions_revenue: number;
  total_pass_revenue: number;
  total_revenue: number;
}

export interface PartnerReport {
  partner_name: string;
  gross_amount: number;
  commission_5: number;
  mm_fees_1_5: number;
  net_partner: number;
  transaction_count: number;
}

export const getFinancialSummary = async (startDate?: string, endDate?: string): Promise<FinancialSummary> => {
  const summary: FinancialSummary = {
    even_revenue: 0,
    pass_lmdg_revenue: 0,
    pass_cosama_revenue: 0,
    pass_interregional_revenue: 0,
    pass_subscriptions_revenue: 0,
    total_pass_revenue: 0,
    total_revenue: 0
  };

  try {
    const eventsRef = ref(db, 'events');
    const eventsSnapshot = await get(eventsRef);

    if (eventsSnapshot.exists()) {
      const events = eventsSnapshot.val();
      Object.values(events).forEach((event: any) => {
        if (event.tickets) {
          Object.values(event.tickets).forEach((ticket: any) => {
            if (ticket.payment_status === 'paid') {
              const ticketDate = new Date(ticket.created_at).toISOString().split('T')[0];

              if ((!startDate || ticketDate >= startDate) && (!endDate || ticketDate <= endDate)) {
                summary.even_revenue += ticket.price_paid || 0;
              }
            }
          });
        }
      });
    }

    const passBookingsRef = ref(db, 'transport/pass/bookings');
    const passBookingsSnapshot = await get(passBookingsRef);

    if (passBookingsSnapshot.exists()) {
      const bookings = passBookingsSnapshot.val();
      Object.values(bookings).forEach((booking: any) => {
        if (booking.payment_status === 'paid') {
          const bookingDate = new Date(booking.created_at).toISOString().split('T')[0];

          if ((!startDate || bookingDate >= startDate) && (!endDate || bookingDate <= endDate)) {
            const amount = booking.total_price || 0;

            if (booking.service_type === 'lmdg') {
              summary.pass_lmdg_revenue += amount;
            } else if (booking.service_type === 'cosama') {
              summary.pass_cosama_revenue += amount;
            } else if (booking.service_type === 'interregional') {
              summary.pass_interregional_revenue += amount;
            }
          }
        }
      });
    }

    const subscriptionsRef = ref(db, 'transport/abonnements/subscriptions');
    const subscriptionsSnapshot = await get(subscriptionsRef);

    if (subscriptionsSnapshot.exists()) {
      const subscriptions = subscriptionsSnapshot.val();
      Object.values(subscriptions).forEach((subscription: any) => {
        if (subscription.payment_status === 'paid') {
          const subDate = new Date(subscription.created_at).toISOString().split('T')[0];

          if ((!startDate || subDate >= startDate) && (!endDate || subDate <= endDate)) {
            summary.pass_subscriptions_revenue += subscription.amount_paid || 0;
          }
        }
      });
    }

    summary.total_pass_revenue =
      summary.pass_lmdg_revenue +
      summary.pass_cosama_revenue +
      summary.pass_interregional_revenue +
      summary.pass_subscriptions_revenue;

    summary.total_revenue = summary.even_revenue + summary.total_pass_revenue;

  } catch (error) {
    console.error('Error fetching financial summary:', error);
  }

  return summary;
};

export const getPartnerReports = async (startDate?: string, endDate?: string): Promise<PartnerReport[]> => {
  const reports: Record<string, PartnerReport> = {};

  try {
    const passBookingsRef = ref(db, 'transport/pass/bookings');
    const passBookingsSnapshot = await get(passBookingsRef);

    if (passBookingsSnapshot.exists()) {
      const bookings = passBookingsSnapshot.val();
      Object.values(bookings).forEach((booking: any) => {
        if (booking.payment_status === 'paid') {
          const bookingDate = new Date(booking.created_at).toISOString().split('T')[0];

          if ((!startDate || bookingDate >= startDate) && (!endDate || bookingDate <= endDate)) {
            const partnerName = booking.partner_name || booking.service_type.toUpperCase();
            const grossAmount = booking.total_price || 0;

            if (!reports[partnerName]) {
              reports[partnerName] = {
                partner_name: partnerName,
                gross_amount: 0,
                commission_5: 0,
                mm_fees_1_5: 0,
                net_partner: 0,
                transaction_count: 0
              };
            }

            reports[partnerName].gross_amount += grossAmount;
            reports[partnerName].transaction_count += 1;
          }
        }
      });
    }

    Object.values(reports).forEach(report => {
      report.commission_5 = report.gross_amount * 0.05;
      report.mm_fees_1_5 = report.gross_amount * 0.015;
      report.net_partner = report.gross_amount - report.commission_5 - report.mm_fees_1_5;
    });

  } catch (error) {
    console.error('Error fetching partner reports:', error);
  }

  return Object.values(reports);
};

export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const formatCurrency = (amount: number): string => {
  return `${amount.toLocaleString('fr-FR')} FCFA`;
};

import { maskPhoneNumber, formatPhoneNumber } from './phoneUtils';

export interface TicketData {
  ticket_number: string;
  qr_code: string;
  holder_name: string;
  holder_email: string | null;
  holder_phone: string;
  event_title: string;
  event_date: string;
  event_venue: string;
  zone_name: string;
  access_gate: string;
  price_paid: number;
  booking_number: string;
}

export interface TicketPDFOptions {
  showRealPhone: boolean;
}

export function prepareTicketForPDF(
  ticket: TicketData,
  options: TicketPDFOptions = { showRealPhone: false }
): TicketData {
  return {
    ...ticket,
    holder_phone: options.showRealPhone
      ? formatPhoneNumber(ticket.holder_phone)
      : maskPhoneNumber(ticket.holder_phone),
  };
}

export function generateTicketHTML(ticket: TicketData, options: TicketPDFOptions = { showRealPhone: false }): string {
  const displayTicket = prepareTicketForPDF(ticket, options);

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Billet - ${ticket.ticket_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .ticket {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }
    .ticket-header {
      background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%);
      color: white;
      padding: 24px;
      text-align: center;
    }
    .ticket-header h1 {
      font-size: 28px;
      font-weight: 800;
      margin-bottom: 8px;
    }
    .ticket-header p {
      font-size: 14px;
      opacity: 0.9;
    }
    .ticket-body {
      padding: 32px 24px;
    }
    .info-section {
      margin-bottom: 24px;
    }
    .info-label {
      font-size: 11px;
      text-transform: uppercase;
      color: #666;
      font-weight: 600;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .info-value {
      font-size: 16px;
      color: #0F0F0F;
      font-weight: 600;
    }
    .qr-section {
      text-align: center;
      padding: 24px;
      background: #f9f9f9;
      border-radius: 8px;
      margin: 24px 0;
    }
    .qr-code {
      width: 200px;
      height: 200px;
      margin: 0 auto;
      background: white;
      padding: 16px;
      border-radius: 8px;
      border: 2px solid #FF6B35;
    }
    .ticket-footer {
      background: linear-gradient(to right, #0F0F0F, #1A1A1A);
      border-top: 3px solid #FF6B35;
      padding: 16px 24px;
      text-align: center;
    }
    .footer-content {
      font-size: 10px;
      color: #B5B5B5;
      line-height: 1.6;
    }
    .footer-content strong {
      color: white;
    }
    .footer-content a {
      color: #FF6B35;
      text-decoration: none;
    }
    .zone-badge {
      display: inline-block;
      padding: 8px 16px;
      background: #FF6B35;
      color: white;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 700;
      margin-top: 4px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    @media print {
      body { background: white; padding: 0; }
      .ticket { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="ticket-header">
      <h1>🎟️ DemDem Transports & Events</h1>
      <p>Votre Billet Électronique</p>
    </div>

    <div class="ticket-body">
      <div class="info-section">
        <div class="info-label">ÉVÉNEMENT</div>
        <div class="info-value">${ticket.event_title}</div>
      </div>

      <div class="grid-2">
        <div class="info-section">
          <div class="info-label">DATE</div>
          <div class="info-value">${new Date(ticket.event_date).toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</div>
        </div>

        <div class="info-section">
          <div class="info-label">LIEU</div>
          <div class="info-value">${ticket.event_venue}</div>
        </div>
      </div>

      <div class="grid-2">
        <div class="info-section">
          <div class="info-label">ZONE</div>
          <div class="zone-badge">${ticket.zone_name}</div>
        </div>

        <div class="info-section">
          <div class="info-label">PORTE D'ACCÈS</div>
          <div class="info-value">${ticket.access_gate}</div>
        </div>
      </div>

      <div class="qr-section">
        <div class="qr-code">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ticket.qr_code)}"
               alt="QR Code"
               style="width: 100%; height: 100%;" />
        </div>
        <div style="margin-top: 12px; font-size: 12px; color: #666; font-weight: 600;">
          ${ticket.ticket_number}
        </div>
      </div>

      <div class="grid-2">
        <div class="info-section">
          <div class="info-label">TITULAIRE</div>
          <div class="info-value">${ticket.holder_name}</div>
        </div>

        <div class="info-section">
          <div class="info-label">TÉLÉPHONE</div>
          <div class="info-value">${displayTicket.holder_phone}</div>
        </div>
      </div>

      ${ticket.holder_email ? `
      <div class="info-section">
        <div class="info-label">EMAIL</div>
        <div class="info-value" style="font-size: 14px;">${ticket.holder_email}</div>
      </div>
      ` : ''}

      <div class="info-section">
        <div class="info-label">MONTANT PAYÉ</div>
        <div class="info-value">${ticket.price_paid.toLocaleString()} FCFA</div>
      </div>

      <div style="margin-top: 24px; padding: 16px; background: #FFF8F0; border-left: 4px solid #FF6B35; border-radius: 4px;">
        <p style="font-size: 12px; color: #666; line-height: 1.6;">
          <strong style="color: #FF6B35;">⚠️ Important:</strong> Ce billet est personnel et nominatif.
          Présentez-le avec une pièce d'identité à l'entrée. Le QR code sera scanné une seule fois.
        </p>
      </div>
    </div>

    <div class="ticket-footer">
      <div class="footer-content">
        <p><strong>Support:</strong> <a href="tel:+221771234567">+221 77 123 45 67</a> |
           <strong>Contact:</strong> <a href="mailto:contact@demdem.sn">contact@demdem.sn</a></p>
        <p style="margin-top: 8px;">© 2026 <strong>DemDem Transports & Events</strong> - Tous droits réservés</p>
        <p style="margin-top: 4px; font-size: 9px; opacity: 0.7;">
          ${options.showRealPhone ? 'Document interne - Informations complètes' : 'Billet client - Téléphone masqué (RGPD)'}
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function downloadTicketPDF(ticket: TicketData, forClient: boolean = true) {
  const html = generateTicketHTML(ticket, { showRealPhone: !forClient });

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `billet-${ticket.ticket_number}.html`;
  link.click();

  URL.revokeObjectURL(url);

  setTimeout(() => {
    window.open(url, '_blank');
  }, 100);
}

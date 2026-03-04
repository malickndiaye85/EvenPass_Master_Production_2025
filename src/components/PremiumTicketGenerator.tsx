import React, { useRef, useEffect, useState } from 'react';
import QRCode from 'react-qr-code';

interface TicketData {
  ticketId: string;
  eventName: string;
  category: string;
  date: string;
  venue: string;
  holderName?: string;
  price?: string;
}

interface PremiumTicketGeneratorProps {
  ticketData: TicketData;
  onGenerated?: (canvas: HTMLCanvasElement) => void;
  autoDownload?: boolean;
}

export const PremiumTicketGenerator: React.FC<PremiumTicketGeneratorProps> = ({
  ticketData,
  onGenerated,
  autoDownload = false
}) => {
  const ticketRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (qrRef.current) {
      const svg = qrRef.current.querySelector('svg');
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        canvas.width = 400;
        canvas.height = 400;

        img.onload = () => {
          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, 400, 400);
            ctx.drawImage(img, 0, 0, 400, 400);
            setQrDataUrl(canvas.toDataURL('image/png'));
          }
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
      }
    }
  }, [ticketData.ticketId]);

  const generateTicket = async () => {
    if (!ticketRef.current || !qrDataUrl) return;

    setIsGenerating(true);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 1200;
      canvas.height = 1600;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const borderGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      borderGradient.addColorStop(0, '#F97316');
      borderGradient.addColorStop(1, '#EA580C');
      ctx.strokeStyle = borderGradient;
      ctx.lineWidth = 8;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

      ctx.fillStyle = '#F97316';
      ctx.fillRect(40, 40, canvas.width - 80, 200);

      try {
        const logo = new Image();
        logo.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          logo.onload = resolve;
          logo.onerror = reject;
          logo.src = '/assets/logo-demdem.png';
        });

        const logoHeight = 120;
        const logoWidth = (logo.width / logo.height) * logoHeight;
        ctx.drawImage(logo, (canvas.width - logoWidth) / 2, 70, logoWidth, logoHeight);
      } catch (error) {
        console.log('Logo not loaded, continuing without it');
      }

      ctx.font = 'bold 64px Orbitron, sans-serif';
      ctx.fillStyle = '#1E293B';
      ctx.textAlign = 'center';
      ctx.fillText(ticketData.eventName.toUpperCase(), canvas.width / 2, 340);

      ctx.font = 'bold 42px Orbitron, sans-serif';
      ctx.fillStyle = '#F97316';
      ctx.fillText(ticketData.category.toUpperCase(), canvas.width / 2, 420);

      const qrImage = new Image();
      await new Promise((resolve) => {
        qrImage.onload = resolve;
        qrImage.src = qrDataUrl;
      });

      const qrSize = 600;
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = 480;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40);

      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 2;
      ctx.strokeRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40);

      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

      ctx.font = 'bold 32px monospace';
      ctx.fillStyle = '#1E293B';
      ctx.textAlign = 'center';
      ctx.fillText(ticketData.ticketId, canvas.width / 2, 1180);

      ctx.font = '28px Inter, sans-serif';
      ctx.fillStyle = '#64748B';
      const infoY = 1260;
      const lineHeight = 50;

      ctx.fillText(`📅 ${ticketData.date}`, canvas.width / 2, infoY);
      ctx.fillText(`📍 ${ticketData.venue}`, canvas.width / 2, infoY + lineHeight);

      if (ticketData.holderName) {
        ctx.fillText(`👤 ${ticketData.holderName}`, canvas.width / 2, infoY + lineHeight * 2);
      }

      if (ticketData.price) {
        ctx.font = 'bold 36px Inter, sans-serif';
        ctx.fillStyle = '#F97316';
        ctx.fillText(ticketData.price, canvas.width / 2, infoY + lineHeight * 3);
      }

      ctx.font = '20px Inter, sans-serif';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText('Présentez ce QR code à l\'entrée', canvas.width / 2, canvas.height - 60);

      if (onGenerated) {
        onGenerated(canvas);
      }

      if (autoDownload) {
        const link = document.createElement('a');
        link.download = `ticket-${ticketData.ticketId}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }

      setIsGenerating(false);
    } catch (error) {
      console.error('Error generating ticket:', error);
      setIsGenerating(false);
    }
  };

  return (
    <div className="premium-ticket-generator">
      <div ref={qrRef} style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <QRCode
          value={ticketData.ticketId}
          size={400}
          level="H"
          bgColor="#FFFFFF"
          fgColor="#000000"
        />
      </div>

      <div ref={ticketRef} className="hidden">
        {/* Hidden reference for ticket layout */}
      </div>

      <button
        onClick={generateTicket}
        disabled={isGenerating || !qrDataUrl}
        className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
      >
        {isGenerating ? 'Génération...' : 'Générer le Billet Premium'}
      </button>
    </div>
  );
};

export default PremiumTicketGenerator;

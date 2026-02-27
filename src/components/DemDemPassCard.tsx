import React, { useRef } from 'react';
import { Bus, Phone, QrCode, Download } from 'lucide-react';
import QRCode from 'react-qr-code';
import html2canvas from 'html2canvas';

interface DemDemPass {
  id: string;
  type: string;
  route: {
    origin: string;
    destination: string;
  };
  tier: 'eco' | 'prestige';
  duration: 'weekly' | 'monthly' | 'quarterly';
  price: number;
  userData: {
    firstName: string;
    lastName: string;
    phone: string;
    photoUrl: string;
  };
  purchased_at: string;
  expires_at: string;
  status: string;
}

interface DemDemPassCardProps {
  pass: DemDemPass;
}

export default function DemDemPassCard({ pass }: DemDemPassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const durationLabels = {
    weekly: 'Hebdomadaire',
    monthly: 'Mensuel',
    quarterly: 'Trimestriel'
  };

  const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const qrData = JSON.stringify({
    type: 'demdem_subscription',
    route: `${pass.route.origin} ⇄ ${pass.route.destination}`,
    tier: pass.tier,
    duration: pass.duration,
    user: `${pass.userData.firstName} ${pass.userData.lastName}`,
    phone: pass.userData.phone,
    purchased_at: pass.purchased_at,
    expires_at: pass.expires_at
  });

  const handleSaveImage = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        logging: false,
        useCORS: true
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `SAMA_Pass_DemDem_${pass.userData.firstName}_${pass.userData.lastName}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div
        ref={cardRef}
        className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 rounded-3xl border-2 border-amber-400/30 shadow-2xl overflow-hidden"
      >
        <div className="bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-blue-950">SAMA PASS</h2>
            <Bus className="w-7 h-7 text-blue-950" />
          </div>
        </div>

        <div className="p-5">
          {/* User Info - Photo plus grande */}
          <div className="flex items-center gap-4 mb-5">
            <img
              src={pass.userData.photoUrl}
              alt="Photo"
              className="w-28 h-28 rounded-full object-cover border-4 border-amber-400 shadow-lg"
            />
            <div>
              <h3 className="text-xl font-bold text-white leading-tight">
                {pass.userData.firstName} {pass.userData.lastName}
              </h3>
              <p className="text-white/70 flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4" />
                {pass.userData.phone}
              </p>
            </div>
          </div>

          {/* Subscription Details - Compact 2x2 */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-blue-900/30 rounded-xl p-3 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <Bus className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-white/70">Ligne</span>
              </div>
              <p className="text-sm font-bold text-white leading-tight">
                {pass.route.origin} ⇄ {pass.route.destination}
              </p>
            </div>

            <div className="bg-blue-900/30 rounded-xl p-3 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <QrCode className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-white/70">Formule</span>
              </div>
              <p className="text-sm font-bold text-white">
                {pass.tier === 'eco' ? 'ECO' : 'PRESTIGE ★'}
              </p>
            </div>

            <div className="bg-blue-900/30 rounded-xl p-3 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <Download className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-white/70">Durée</span>
              </div>
              <p className="text-sm font-bold text-white">
                {durationLabels[pass.duration]}
              </p>
            </div>

            <div className="bg-blue-900/30 rounded-xl p-3 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <Phone className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-white/70">Valable jusqu'au</span>
              </div>
              <p className="text-xs font-bold text-white leading-tight">
                {formatDate(pass.expires_at)}
              </p>
            </div>
          </div>

          {/* QR Code - Réduit */}
          <div className="bg-white rounded-2xl p-5 text-center mb-4">
            <div className="flex justify-center mb-3">
              <QRCode value={qrData} size={160} />
            </div>
            <p className="text-gray-600 text-sm font-semibold flex items-center justify-center gap-2">
              <QrCode className="w-4 h-4" />
              Présentez ce QR Code
            </p>
          </div>

          {/* Price - Compact */}
          <div className="text-center bg-gradient-to-r from-amber-400/20 to-amber-500/20 rounded-2xl p-4 border border-amber-400/30">
            <p className="text-white/70 text-xs mb-1">Montant payé</p>
            <p className="text-3xl font-black text-amber-400">
              {pass.price.toLocaleString()} FCFA
            </p>
          </div>
        </div>
      </div>

      {/* Bouton de téléchargement */}
      <button
        onClick={handleSaveImage}
        className="w-full bg-gradient-to-r from-amber-400 to-amber-500 text-blue-950 py-4 rounded-2xl font-bold text-lg hover:from-amber-500 hover:to-amber-600 transition-all shadow-lg shadow-amber-400/50 flex items-center justify-center gap-3"
      >
        <Download className="w-5 h-5" />
        Enregistrer l'image
      </button>
    </div>
  );
}

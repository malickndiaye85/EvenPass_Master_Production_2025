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
        className="relative mx-auto max-w-md bg-gradient-to-br from-[#1a2942] via-[#0A1628] to-[#1a2942] rounded-3xl shadow-2xl overflow-hidden"
        style={{
          aspectRatio: '1.586',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(251, 191, 36, 0.3)'
        }}
      >
        {/* Hologramme effet */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 via-transparent to-blue-400/5 pointer-events-none"></div>

        {/* Header de la carte */}
        <div className="relative p-5 pb-3 border-b border-amber-400/20">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-2xl font-black text-amber-400 tracking-wide">SAMA PASS</h2>
            <Bus className="w-7 h-7 text-amber-400" />
          </div>
          <p className="text-xs text-white/60 font-semibold">DEM-DEM Express</p>
        </div>

        {/* Corps de la carte */}
        <div className="relative p-5 pt-4">
          {/* Section Photo + QR */}
          <div className="flex gap-4 mb-4">
            {/* Photo utilisateur */}
            <div className="flex-shrink-0">
              <div className="relative w-28 h-28 rounded-2xl overflow-hidden border-4 border-amber-400 shadow-xl">
                <img
                  src={pass.userData.photoUrl}
                  alt="Photo"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* QR Code */}
            <div className="flex-1 flex items-center justify-center bg-white rounded-2xl p-3 shadow-lg">
              <QRCode
                value={qrData}
                size={96}
                level="H"
                style={{ width: '100%', height: 'auto', maxWidth: '96px' }}
              />
            </div>
          </div>

          {/* Infos utilisateur */}
          <div className="mb-4 bg-blue-900/30 rounded-xl p-3 border border-white/10">
            <h3 className="text-xl font-black text-white leading-tight mb-1">
              {pass.userData.firstName} {pass.userData.lastName}
            </h3>
            <p className="text-sm text-white/70 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              {pass.userData.phone}
            </p>
          </div>

          {/* Détails abonnement */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-blue-900/20 rounded-lg p-2.5 border border-white/5">
              <p className="text-xs text-white/50 mb-0.5">Ligne</p>
              <p className="text-sm font-bold text-white leading-tight">
                {pass.route.origin} ⇄ {pass.route.destination}
              </p>
            </div>

            <div className="bg-blue-900/20 rounded-lg p-2.5 border border-white/5">
              <p className="text-xs text-white/50 mb-0.5">Formule</p>
              <p className="text-sm font-bold text-white">
                {pass.tier === 'eco' ? 'ECO' : 'PRESTIGE ★'}
              </p>
            </div>

            <div className="bg-blue-900/20 rounded-lg p-2.5 border border-white/5">
              <p className="text-xs text-white/50 mb-0.5">Durée</p>
              <p className="text-sm font-bold text-white">
                {durationLabels[pass.duration]}
              </p>
            </div>

            <div className="bg-blue-900/20 rounded-lg p-2.5 border border-white/5">
              <p className="text-xs text-white/50 mb-0.5">Expire le</p>
              <p className="text-xs font-bold text-white">
                {formatDate(pass.expires_at).split(' ').slice(0, 2).join(' ')}
              </p>
            </div>
          </div>

          {/* Prix */}
          <div className="bg-gradient-to-r from-amber-400 to-amber-500 rounded-xl p-3 text-center shadow-lg">
            <p className="text-xs text-blue-950 font-bold mb-0.5">Montant payé</p>
            <p className="text-2xl font-black text-blue-950">
              {pass.price.toLocaleString()} FCFA
            </p>
          </div>
        </div>

        {/* Footer de la carte */}
        <div className="relative px-5 pb-4">
          <div className="flex items-center justify-between text-xs text-white/40">
            <span>Valide sur ligne</span>
            <span className="font-mono">#{qrData.slice(0, 8).toUpperCase()}</span>
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

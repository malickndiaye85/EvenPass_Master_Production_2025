import React from 'react';
import { Calendar, Zap, ShieldCheck } from 'lucide-react';
import QRCode from 'react-qr-code';
import { PassSubscription, passPhoneService } from '../lib/passPhoneService';

interface AbonnementCardProps {
  subscription: PassSubscription;
}

export const AbonnementCard: React.FC<AbonnementCardProps> = ({ subscription }) => {
  const daysRemaining = passPhoneService.getDaysRemaining(subscription.endDate);
  const phoneDisplay = passPhoneService.formatPhoneDisplay(subscription.phoneNumber);
  const startDate = passPhoneService.formatDate(subscription.startDate);
  const endDate = passPhoneService.formatDate(subscription.endDate);

  // LOG DE VÉRIFICATION DU QR CODE SOURCE DE VÉRITÉ
  console.log('[WALLET-CARD] 🎫 QR Code utilisé:', subscription.qrCode);
  console.log('[WALLET-CARD] 🆔 ID Firebase:', subscription.id);
  console.log('[WALLET-CARD] 📱 Téléphone:', subscription.phoneNumber);

  return (
    <div className="relative bg-gradient-to-br from-[#FFC700] via-[#FF8800] to-[#FF6B00] rounded-3xl p-8 shadow-2xl border border-white/20 backdrop-blur-sm overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-6 h-6 text-[#0F1419]" />
              <p className="text-[#0F1419]/80 text-sm font-bold uppercase tracking-wider">DEM-DEM</p>
            </div>
            <h2 className="text-[#0F1419] text-3xl font-black tracking-tight">
              EXPRESS
            </h2>
            <p className="text-[#0F1419]/70 text-sm font-semibold mt-1">
              {subscription.type === 'weekly' ? 'HEBDOMADAIRE' : 'MENSUEL'}
            </p>
          </div>
          <div className="bg-[#0F1419] px-4 py-2 rounded-full shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse"></div>
              <span className="text-white text-xs font-bold">ACTIF</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 mb-6 shadow-xl">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-inner">
              <QRCode
                value={subscription.qrCode}
                size={200}
                level="H"
                className="rounded-lg"
              />
            </div>
          </div>
          <div className="text-center space-y-1">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              Code d'abonnement
            </p>
            <p className="text-sm text-gray-700 font-mono font-bold break-all px-2">
              {subscription.qrCode}
            </p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <ShieldCheck className="w-3 h-3 text-green-600" />
              <span className="text-xs text-green-600 font-semibold">QR Code certifié Firebase</span>
            </div>
          </div>
        </div>

        <div className="bg-[#0F1419]/20 backdrop-blur-sm rounded-2xl p-5 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-[#0F1419]/70 text-xs font-medium uppercase tracking-wide mb-1">
                Titulaire
              </p>
              <p className="text-[#0F1419] font-bold text-base">
                {subscription.firstName} {subscription.lastName}
              </p>
            </div>
            <div>
              <p className="text-[#0F1419]/70 text-xs font-medium uppercase tracking-wide mb-1">
                Téléphone
              </p>
              <p className="text-[#0F1419] font-bold text-base font-mono">
                {phoneDisplay}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#0F1419]/20">
            <div>
              <p className="text-[#0F1419]/70 text-xs font-medium uppercase tracking-wide mb-1">
                Début
              </p>
              <p className="text-[#0F1419] font-semibold text-sm">
                {startDate}
              </p>
            </div>
            <div>
              <p className="text-[#0F1419]/70 text-xs font-medium uppercase tracking-wide mb-1">
                Fin
              </p>
              <p className="text-[#0F1419] font-semibold text-sm">
                {endDate}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#0F1419] rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#FFC700] rounded-xl flex items-center justify-center shadow-lg">
                <Calendar className="w-6 h-6 text-[#0F1419]" />
              </div>
              <div>
                <p className="text-white/70 text-xs font-medium uppercase tracking-wide">
                  Validité
                </p>
                <p className="text-white text-lg font-bold">
                  {daysRemaining} jour{daysRemaining > 1 ? 's' : ''} restant{daysRemaining > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <ShieldCheck className="w-8 h-8 text-[#10B981]" />
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-[#0F1419]/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-[#0F1419]/20 rounded-full flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#0F1419]" />
            </div>
            <div className="text-[#0F1419] text-xs leading-relaxed">
              <p className="font-bold mb-2">Mode d'emploi</p>
              <ul className="space-y-1 text-[#0F1419]/80">
                <li>• Présentez ce QR Code au contrôleur</li>
                <li>• Pass strictement personnel</li>
                <li>• Accessible hors ligne après chargement</li>
                <li>• Valide sur toutes les lignes Express</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

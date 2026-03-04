import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Scan } from 'lucide-react';
import PremiumTicketGenerator from '../components/PremiumTicketGenerator';

const TicketTestPage: React.FC = () => {
  const navigate = useNavigate();
  const [generatedTicket, setGeneratedTicket] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateTicketId = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `DEM-ZIKR-2026-${randomNum}`;
  };

  useEffect(() => {
    setTicketId(generateTicketId());
  }, []);

  const testTicketData = {
    ticketId: ticketId,
    eventName: 'La Nuit du Zikr',
    category: 'VIP - Carré Or',
    date: '15 Mars 2026 - 20h00',
    venue: 'Grand Théâtre National - Dakar',
    holderName: 'Test Client',
    price: '25,000 FCFA'
  };

  const handleTicketGenerated = (canvas: HTMLCanvasElement) => {
    const dataUrl = canvas.toDataURL('image/png');
    setGeneratedTicket(dataUrl);

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        canvasRef.current.width = canvas.width;
        canvasRef.current.height = canvas.height;
        ctx.drawImage(canvas, 0, 0);
      }
    }
  };

  const downloadTicket = () => {
    if (generatedTicket) {
      const link = document.createElement('a');
      link.download = `ticket-${ticketId}.png`;
      link.href = generatedTicket;
      link.click();
    }
  };

  const regenerateTicket = () => {
    setTicketId(generateTicketId());
    setGeneratedTicket(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </button>

        <div className="bg-white/5 border border-orange-500/20 rounded-2xl p-8 backdrop-blur-lg">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              Générateur de Billets Premium
            </h1>
            <p className="text-slate-300 text-lg">
              Test pour scanner EPscanV - Format optimisé avec QR code haute résolution
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Scan className="w-6 h-6 text-orange-500" />
                Détails du Billet Test
              </h2>
              <div className="space-y-3 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">ID Billet:</span>
                  <span className="font-mono font-bold text-orange-400">{ticketId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Événement:</span>
                  <span className="font-semibold">{testTicketData.eventName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Catégorie:</span>
                  <span className="font-semibold">{testTicketData.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date:</span>
                  <span>{testTicketData.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Lieu:</span>
                  <span>{testTicketData.venue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Prix:</span>
                  <span className="font-bold text-orange-400">{testTicketData.price}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4">
                Spécifications QR Code
              </h2>
              <div className="space-y-3 text-slate-300">
                <div className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✓</span>
                  <div>
                    <div className="font-semibold">Fond Blanc Pur</div>
                    <div className="text-sm text-slate-400">Optimisé pour la lecture</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✓</span>
                  <div>
                    <div className="font-semibold">QR Code Noir</div>
                    <div className="text-sm text-slate-400">Contraste maximum</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✓</span>
                  <div>
                    <div className="font-semibold">Correction d'erreur: H (High)</div>
                    <div className="text-sm text-slate-400">30% de récupération de données</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✓</span>
                  <div>
                    <div className="font-semibold">Résolution: 600x600px</div>
                    <div className="text-sm text-slate-400">Scan optimal même sur petit écran</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4 mb-8">
            <PremiumTicketGenerator
              ticketData={testTicketData}
              onGenerated={handleTicketGenerated}
              autoDownload={false}
            />
            {generatedTicket && (
              <>
                <button
                  onClick={downloadTicket}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Télécharger
                </button>
                <button
                  onClick={regenerateTicket}
                  className="px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white font-bold rounded-xl hover:from-slate-700 hover:to-slate-800 transition-all shadow-lg"
                >
                  Nouveau Billet
                </button>
              </>
            )}
          </div>

          {generatedTicket && (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border-2 border-orange-500/30">
              <h2 className="text-2xl font-bold text-white mb-6 text-center" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                Aperçu du Billet Généré
              </h2>
              <div className="flex justify-center">
                <div className="relative inline-block">
                  <canvas
                    ref={canvasRef}
                    className="max-w-full h-auto rounded-xl shadow-2xl border-4 border-white"
                    style={{ maxHeight: '800px' }}
                  />
                  <div className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-full font-bold shadow-lg">
                    Prêt à scanner
                  </div>
                </div>
              </div>
              <div className="mt-6 text-center">
                <p className="text-slate-300 mb-4">
                  Scannez ce billet avec votre interface EPscanV Events
                </p>
                <button
                  onClick={() => window.open('/epscanv-events.html', '_blank')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg"
                >
                  <Scan className="w-5 h-5" />
                  Ouvrir EPscanV Events
                </button>
              </div>
            </div>
          )}

          {!generatedTicket && (
            <div className="text-center p-12 bg-slate-800/30 rounded-xl border-2 border-dashed border-slate-600">
              <Scan className="w-16 h-16 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">
                Cliquez sur "Générer le Billet Premium" pour créer votre billet test
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketTestPage;

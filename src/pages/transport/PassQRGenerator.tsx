import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { Download, QrCode, CheckCircle } from 'lucide-react';
import { createSamplePass } from '../../lib/passValidator';

const PassQRGenerator: React.FC = () => {
  const [passData, setPassData] = useState({
    userId: 'user_' + Math.random().toString(36).substr(2, 9),
    subscriptionType: 'SAMA_PASS_MENSUEL',
    line: 'KM - Dakar ⇄ Pikine',
    grade: 'Confort'
  });

  const [qrValue, setQrValue] = useState('');

  const generateQR = () => {
    const pass = createSamplePass(
      passData.userId,
      passData.subscriptionType,
      passData.line,
      passData.grade
    );

    const qrData = JSON.stringify(pass);
    setQrValue(qrData);
  };

  const downloadQR = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');

      const downloadLink = document.createElement('a');
      downloadLink.download = `pass_${passData.userId}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0B] via-[#1A1A1B] to-[#0A0A0B] p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-[#10B981] to-[#059669] mb-4 shadow-2xl shadow-[#10B981]/30">
            <QrCode className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white mb-2">
            Générateur QR SAMA PASS
          </h1>
          <p className="text-gray-400">
            Créez des passes de test pour EPscanV
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#1E1E1E] rounded-2xl p-6 border border-gray-800">
            <h2 className="text-white font-bold text-xl mb-4">Configuration du Pass</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">ID Utilisateur</label>
                <input
                  type="text"
                  value={passData.userId}
                  onChange={(e) => setPassData({ ...passData, userId: e.target.value })}
                  className="w-full px-4 py-3 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#10B981]"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Type d'Abonnement</label>
                <select
                  value={passData.subscriptionType}
                  onChange={(e) => setPassData({ ...passData, subscriptionType: e.target.value })}
                  className="w-full px-4 py-3 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#10B981]"
                >
                  <option value="SAMA_PASS_MENSUEL">SAMA PASS Mensuel</option>
                  <option value="SAMA_PASS_HEBDO">SAMA PASS Hebdomadaire</option>
                  <option value="SAMA_PASS_ANNUEL">SAMA PASS Annuel</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Ligne</label>
                <select
                  value={passData.line}
                  onChange={(e) => setPassData({ ...passData, line: e.target.value })}
                  className="w-full px-4 py-3 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#10B981]"
                >
                  <option value="KM - Dakar ⇄ Pikine">KM - Dakar ⇄ Pikine</option>
                  <option value="KM - Dakar ⇄ Rufisque">KM - Dakar ⇄ Rufisque</option>
                  <option value="KM - Dakar ⇄ Guédiawaye">KM - Dakar ⇄ Guédiawaye</option>
                  <option value="KM - Dakar ⇄ Ziguinchor">KM - Dakar ⇄ Ziguinchor</option>
                  <option value="ALL">Toutes Lignes</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Grade</label>
                <select
                  value={passData.grade}
                  onChange={(e) => setPassData({ ...passData, grade: e.target.value })}
                  className="w-full px-4 py-3 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#10B981]"
                >
                  <option value="VIP">VIP (Tous véhicules)</option>
                  <option value="Confort">Confort</option>
                  <option value="Eco">Eco</option>
                </select>
              </div>

              <button
                onClick={generateQR}
                className="w-full py-4 bg-[#10B981] hover:bg-[#059669] text-white font-black rounded-lg transition-colors flex items-center justify-center space-x-2 shadow-lg"
              >
                <CheckCircle size={20} />
                <span>Générer le QR Code</span>
              </button>
            </div>
          </div>

          <div className="bg-[#1E1E1E] rounded-2xl p-6 border border-gray-800">
            <h2 className="text-white font-bold text-xl mb-4">QR Code Généré</h2>

            {qrValue ? (
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-2xl flex items-center justify-center">
                  <QRCode
                    id="qr-code-svg"
                    value={qrValue}
                    size={256}
                    level="H"
                  />
                </div>

                <button
                  onClick={downloadQR}
                  className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Download size={20} />
                  <span>Télécharger PNG</span>
                </button>

                <div className="bg-[#2A2A2A] rounded-lg p-4 border border-gray-700">
                  <div className="text-gray-400 text-xs mb-2">Données du Pass:</div>
                  <pre className="text-white text-xs overflow-x-auto">
                    {JSON.stringify(JSON.parse(qrValue), null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="h-96 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <QrCode className="mx-auto mb-4" size={64} />
                  <p>Configurez et générez un pass</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 bg-[#10B981]/10 border border-[#10B981]/30 rounded-2xl p-6">
          <h3 className="text-white font-bold mb-3">Instructions de Test</h3>
          <ol className="space-y-2 text-gray-400 text-sm">
            <li className="flex items-start space-x-2">
              <span className="text-[#10B981] font-bold">1.</span>
              <span>Configurez les paramètres du pass (ligne, grade, etc.)</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-[#10B981] font-bold">2.</span>
              <span>Cliquez sur "Générer le QR Code"</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-[#10B981] font-bold">3.</span>
              <span>Téléchargez le QR code en PNG</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-[#10B981] font-bold">4.</span>
              <span>Ouvrez le PNG sur un autre appareil ou imprimez-le</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-[#10B981] font-bold">5.</span>
              <span>Scannez avec EPscanV (/controller-epscanv)</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default PassQRGenerator;

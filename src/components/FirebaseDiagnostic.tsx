import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { ref, get } from 'firebase/database';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export default function FirebaseDiagnostic() {
  const [checks, setChecks] = useState({
    dbInitialized: false,
    transportLinesExists: false,
    dataCount: 0,
    sampleData: null as any
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runDiagnostic();
  }, []);

  const runDiagnostic = async () => {
    const results = {
      dbInitialized: !!db,
      transportLinesExists: false,
      dataCount: 0,
      sampleData: null
    };

    if (db) {
      try {
        const linesRef = ref(db, 'transport_lines');
        const snapshot = await get(linesRef);

        results.transportLinesExists = snapshot.exists();

        if (snapshot.exists()) {
          const data = snapshot.val();
          results.dataCount = Object.keys(data).length;
          results.sampleData = data;
        }
      } catch (error) {
        console.error('Diagnostic error:', error);
      }
    }

    setChecks(results);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="bg-blue-900/30 rounded-2xl p-6 border border-white/10 mb-6">
        <p className="text-white/70">Diagnostic en cours...</p>
      </div>
    );
  }

  return (
    <div className="bg-blue-900/30 rounded-2xl p-6 border border-white/10 mb-6">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <AlertCircle className="w-6 h-6 text-amber-400" />
        Diagnostic Firebase
      </h3>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          {checks.dbInitialized ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <XCircle className="w-5 h-5 text-red-400" />
          )}
          <span className="text-white">
            Base de données: {checks.dbInitialized ? 'Initialisée' : 'Non initialisée'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {checks.transportLinesExists ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <XCircle className="w-5 h-5 text-red-400" />
          )}
          <span className="text-white">
            Collection transport_lines: {checks.transportLinesExists ? 'Trouvée' : 'Introuvable'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {checks.dataCount > 0 ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <XCircle className="w-5 h-5 text-red-400" />
          )}
          <span className="text-white">
            Nombre de lignes: {checks.dataCount}
          </span>
        </div>

        {checks.sampleData && (
          <details className="mt-4">
            <summary className="text-amber-400 cursor-pointer hover:text-amber-300">
              Voir les données brutes
            </summary>
            <pre className="bg-black/30 rounded p-3 mt-2 text-xs text-white/70 overflow-auto max-h-64">
              {JSON.stringify(checks.sampleData, null, 2)}
            </pre>
          </details>
        )}
      </div>

      {!checks.transportLinesExists && (
        <div className="mt-4 bg-orange-500/20 border-l-4 border-orange-400 p-4 rounded-r">
          <p className="text-white/90 text-sm">
            La collection "transport_lines" n'existe pas dans Firebase Realtime Database.
            Vous devez créer des lignes via l'interface Admin d'abord.
          </p>
        </div>
      )}
    </div>
  );
}

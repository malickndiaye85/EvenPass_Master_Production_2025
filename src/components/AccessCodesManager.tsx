import React, { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, Key, Shield, Bus, User, CheckCircle, XCircle,
  Search, Filter, RefreshCw, Eye, EyeOff, Copy, Check
} from 'lucide-react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { AccessCodeData } from '../lib/pinAuthService';

interface AccessCodeDocument extends AccessCodeData {
  id: string;
}

const AccessCodesManager: React.FC = () => {
  const [codes, setCodes] = useState<AccessCodeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCode, setEditingCode] = useState<AccessCodeDocument | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'fixe' | 'volant'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCodes, setShowCodes] = useState<Set<string>>(new Set());
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    type: 'fixe' as 'fixe' | 'volant',
    vehicleId: '',
    vehiclePlate: '',
    name: '',
    phone: '',
    active: true
  });

  useEffect(() => {
    loadCodes();
  }, []);

  const loadCodes = async () => {
    try {
      setLoading(true);
      const codesRef = collection(db, 'access_codes');
      const snapshot = await getDocs(codesRef);
      const codesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AccessCodeDocument[];
      setCodes(codesData.sort((a, b) => b.usageCount - a.usageCount));
    } catch (error) {
      console.error('Error loading codes:', error);
      alert('Erreur lors du chargement des codes');
    } finally {
      setLoading(false);
    }
  };

  const generateRandomCode = (): string => {
    const avoid = ['000000', '111111', '222222', '333333', '444444', '555555', '666666', '777777', '888888', '999999', '123456', '654321'];
    let code: string;
    do {
      code = Math.floor(100000 + Math.random() * 900000).toString();
    } while (avoid.includes(code));
    return code;
  };

  const handleCreateCode = () => {
    setEditingCode(null);
    setFormData({
      code: generateRandomCode(),
      type: 'fixe',
      vehicleId: '',
      vehiclePlate: '',
      name: '',
      phone: '',
      active: true
    });
    setShowModal(true);
  };

  const handleEditCode = (code: AccessCodeDocument) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      type: code.type,
      vehicleId: code.vehicleId || '',
      vehiclePlate: code.vehiclePlate || '',
      name: code.name || '',
      phone: code.phone || '',
      active: code.active
    });
    setShowModal(true);
  };

  const handleSaveCode = async () => {
    try {
      if (formData.code.length !== 6 || !/^\d{6}$/.test(formData.code)) {
        alert('Le code doit contenir exactement 6 chiffres');
        return;
      }

      if (formData.type === 'fixe' && (!formData.vehicleId || !formData.vehiclePlate)) {
        alert('Veuillez renseigner l\'ID et la plaque du véhicule');
        return;
      }

      if (formData.type === 'volant' && !formData.name) {
        alert('Veuillez renseigner le nom du contrôleur');
        return;
      }

      const existingCodeQuery = query(
        collection(db, 'access_codes'),
        where('code', '==', formData.code)
      );
      const existingSnapshot = await getDocs(existingCodeQuery);

      if (!editingCode && !existingSnapshot.empty) {
        alert('Ce code existe déjà. Veuillez en générer un nouveau.');
        return;
      }

      const codeData: Omit<AccessCodeData, 'createdAt' | 'createdBy'> = {
        code: formData.code,
        type: formData.type,
        role: 'controller',
        active: formData.active,
        usageCount: editingCode?.usageCount || 0,
        ...(formData.type === 'fixe' ? {
          vehicleId: formData.vehicleId,
          vehiclePlate: formData.vehiclePlate
        } : {
          name: formData.name,
          phone: formData.phone
        })
      };

      if (editingCode) {
        await updateDoc(doc(db, 'access_codes', editingCode.id), codeData);
        alert('Code mis à jour avec succès');
      } else {
        await addDoc(collection(db, 'access_codes'), {
          ...codeData,
          createdAt: Timestamp.now(),
          createdBy: 'admin'
        });
        alert('Code créé avec succès');
      }

      setShowModal(false);
      loadCodes();
    } catch (error) {
      console.error('Error saving code:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteCode = async (code: AccessCodeDocument) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le code ${code.code} ?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'access_codes', code.id));
      alert('Code supprimé avec succès');
      loadCodes();
    } catch (error) {
      console.error('Error deleting code:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleToggleActive = async (code: AccessCodeDocument) => {
    try {
      await updateDoc(doc(db, 'access_codes', code.id), {
        active: !code.active
      });
      loadCodes();
    } catch (error) {
      console.error('Error toggling code status:', error);
      alert('Erreur lors de la modification du statut');
    }
  };

  const toggleShowCode = (codeId: string) => {
    setShowCodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(codeId)) {
        newSet.delete(codeId);
      } else {
        newSet.add(codeId);
      }
      return newSet;
    });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredCodes = codes.filter(code => {
    const matchesSearch =
      code.code.includes(searchTerm) ||
      code.vehiclePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.vehicleId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || code.type === filterType;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && code.active) ||
      (filterStatus === 'inactive' && !code.active);

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="bg-[#1E1E1E] rounded-3xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#10B981]/20 rounded-2xl">
            <Key className="w-6 h-6 text-[#10B981]" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Codes d'Accès PIN</h2>
            <p className="text-gray-400 text-sm">Gestion des codes contrôleurs EPscanV</p>
          </div>
        </div>
        <button
          onClick={handleCreateCode}
          className="flex items-center gap-2 px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl transition-all"
        >
          <Plus className="w-5 h-5" />
          Nouveau Code
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un code..."
            className="w-full pl-10 pr-4 py-2 bg-[#2A2A2A] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#10B981]"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="px-4 py-2 bg-[#2A2A2A] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-[#10B981]"
        >
          <option value="all">Tous les types</option>
          <option value="fixe">Contrôleur Fixe</option>
          <option value="volant">Contrôleur Volant</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-4 py-2 bg-[#2A2A2A] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-[#10B981]"
        >
          <option value="all">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="inactive">Inactifs</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-400">Chargement...</div>
        ) : filteredCodes.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400">Aucun code trouvé</div>
        ) : (
          filteredCodes.map(code => (
            <div
              key={code.id}
              className={`bg-[#2A2A2A] border-2 rounded-2xl p-4 transition-all ${
                code.active ? 'border-[#10B981]/30' : 'border-gray-700/30 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {code.type === 'fixe' ? (
                    <Bus className="w-5 h-5 text-[#10B981]" />
                  ) : (
                    <User className="w-5 h-5 text-blue-500" />
                  )}
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                    code.type === 'fixe'
                      ? 'bg-[#10B981]/20 text-[#10B981]'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {code.type === 'fixe' ? 'Fixe' : 'Volant'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {code.active ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </div>

              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 bg-[#1E1E1E] border border-gray-700 rounded-lg px-3 py-2 font-mono text-xl text-white text-center">
                    {showCodes.has(code.id) ? code.code : '●●●●●●'}
                  </div>
                  <button
                    onClick={() => toggleShowCode(code.id)}
                    className="p-2 bg-[#1E1E1E] hover:bg-[#3A3A3A] border border-gray-700 rounded-lg transition-all"
                  >
                    {showCodes.has(code.id) ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => copyCode(code.code)}
                    className="p-2 bg-[#1E1E1E] hover:bg-[#3A3A3A] border border-gray-700 rounded-lg transition-all"
                  >
                    {copiedCode === code.code ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-3 text-sm">
                {code.type === 'fixe' ? (
                  <>
                    <div className="text-gray-400">
                      <span className="font-bold text-white">{code.vehiclePlate}</span>
                    </div>
                    <div className="text-gray-500 text-xs">Véhicule: {code.vehicleId}</div>
                  </>
                ) : (
                  <>
                    <div className="text-gray-400">
                      <span className="font-bold text-white">{code.name}</span>
                    </div>
                    {code.phone && (
                      <div className="text-gray-500 text-xs">{code.phone}</div>
                    )}
                  </>
                )}
                <div className="text-gray-500 text-xs">
                  Utilisé {code.usageCount} fois
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEditCode(code)}
                  className="flex-1 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-bold rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <Edit2 className="w-4 h-4" />
                  Modifier
                </button>
                <button
                  onClick={() => handleToggleActive(code)}
                  className={`flex-1 px-3 py-2 font-bold rounded-lg transition-all text-sm ${
                    code.active
                      ? 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-400'
                      : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                  }`}
                >
                  {code.active ? 'Désactiver' : 'Activer'}
                </button>
                <button
                  onClick={() => handleDeleteCode(code)}
                  className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E1E1E] rounded-3xl p-6 max-w-md w-full border border-gray-800">
            <h3 className="text-2xl font-black text-white mb-4">
              {editingCode ? 'Modifier le Code' : 'Nouveau Code PIN'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-white mb-2">Code PIN</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    maxLength={6}
                    className="flex-1 px-4 py-2 bg-[#2A2A2A] border border-gray-700 rounded-xl text-white font-mono text-xl text-center focus:outline-none focus:border-[#10B981]"
                    placeholder="000000"
                  />
                  <button
                    onClick={() => setFormData({ ...formData, code: generateRandomCode() })}
                    className="px-4 py-2 bg-[#10B981]/20 hover:bg-[#10B981]/30 text-[#10B981] rounded-xl transition-all"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-2">Type de Contrôleur</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setFormData({ ...formData, type: 'fixe' })}
                    className={`px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                      formData.type === 'fixe'
                        ? 'bg-[#10B981] text-white'
                        : 'bg-[#2A2A2A] text-gray-400 hover:bg-[#3A3A3A]'
                    }`}
                  >
                    <Bus className="w-5 h-5" />
                    Fixe
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, type: 'volant' })}
                    className={`px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                      formData.type === 'volant'
                        ? 'bg-blue-500 text-white'
                        : 'bg-[#2A2A2A] text-gray-400 hover:bg-[#3A3A3A]'
                    }`}
                  >
                    <User className="w-5 h-5" />
                    Volant
                  </button>
                </div>
              </div>

              {formData.type === 'fixe' ? (
                <>
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">ID Véhicule</label>
                    <input
                      type="text"
                      value={formData.vehicleId}
                      onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                      className="w-full px-4 py-2 bg-[#2A2A2A] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-[#10B981]"
                      placeholder="ex: bus_001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">Plaque d'Immatriculation</label>
                    <input
                      type="text"
                      value={formData.vehiclePlate}
                      onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-2 bg-[#2A2A2A] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-[#10B981]"
                      placeholder="ex: DK-1234-AB"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">Nom du Contrôleur</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 bg-[#2A2A2A] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-[#10B981]"
                      placeholder="ex: Moussa Diallo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">Téléphone (optionnel)</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 bg-[#2A2A2A] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-[#10B981]"
                      placeholder="+221771234567"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-5 h-5 rounded bg-[#2A2A2A] border-gray-700"
                />
                <label htmlFor="active" className="text-white font-bold">Code actif</label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveCode}
                className="flex-1 px-4 py-3 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl transition-all"
              >
                {editingCode ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessCodesManager;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';

export const RootLandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center px-6">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-orange-200 rounded-full mb-12 shadow-sm">
          <Zap size={16} className="text-orange-500" />
          <span className="text-sm text-gray-700 font-medium">Nouvelle expérience de billetterie</span>
        </div>

        <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-gray-900 leading-tight mb-6 tracking-tight">
          Gënaa Wóor<br />
          Gënaa Gaaw<br />
          Gënaa Yomb
        </h1>

        <p className="text-xl md:text-2xl text-gray-700 mb-4 font-medium">
          La plateforme premium pour vos événements au Sénégal
        </p>

        <p className="text-lg text-gray-600 mb-12">
          Concerts • Lutte • Théâtre • Sport • Culture
        </p>

        <button
          onClick={() => navigate('/evenement')}
          className="px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          Découvrir les événements
        </button>
      </div>
    </div>
  );
};

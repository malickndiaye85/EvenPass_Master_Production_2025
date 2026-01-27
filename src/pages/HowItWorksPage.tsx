import React from 'react';
import { Search, CreditCard, Smartphone, CheckCircle, Lock, Zap, Clock, ArrowRight, X, Check } from 'lucide-react';

const HowItWorksPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-[#FF6B00]">DemDem</span>
            </div>
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 text-sm font-medium text-[#1A1A1A] hover:text-[#FF6B00] transition-colors duration-200">
                Acheter
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-[#FF6B00] rounded-lg hover:bg-[#E56000] transition-colors duration-200">
                Organisateur?
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1A1A1A] mb-6">
            Comment ça marche?
          </h1>
          <p className="text-xl sm:text-2xl text-[#6B7280] max-w-3xl mx-auto">
            4 étapes pour vivre une expérience événementielle révolutionnaire
          </p>
        </div>
      </section>

      {/* 4 Steps Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Step 01 */}
            <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-8 border-l-4 border-[#FF6B00] transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-16 h-16 bg-[#FF6B00] rounded-full flex items-center justify-center">
                  <Search className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-[#FF6B00] mb-2">ÉTAPE 01</div>
                  <h3 className="text-2xl font-bold text-[#1A1A1A] mb-4">DÉCOUVREZ</h3>
                  <p className="text-[#6B7280] leading-relaxed">
                    Parcourez notre catalogue d'événements et trouvez celui qui vous correspond.
                    Des concerts aux festivals, en passant par les événements sportifs et culturels.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 02 */}
            <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-8 border-l-4 border-[#FF6B00] transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-16 h-16 bg-[#FF6B00] rounded-full flex items-center justify-center">
                  <CreditCard className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-[#FF6B00] mb-2">ÉTAPE 02</div>
                  <h3 className="text-2xl font-bold text-[#1A1A1A] mb-4">ACHETEZ</h3>
                  <p className="text-[#6B7280] leading-relaxed">
                    Réservez vos billets en quelques clics avec notre système de paiement sécurisé.
                    Transaction rapide, simple et entièrement protégée.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 03 */}
            <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-8 border-l-4 border-[#FF6B00] transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-16 h-16 bg-[#FF6B00] rounded-full flex items-center justify-center">
                  <Smartphone className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-[#FF6B00] mb-2">ÉTAPE 03</div>
                  <h3 className="text-2xl font-bold text-[#1A1A1A] mb-4">RECEVEZ</h3>
                  <p className="text-[#6B7280] leading-relaxed">
                    Vos billets numériques arrivent instantanément sur votre téléphone.
                    Plus besoin d'imprimer, tout est accessible depuis votre mobile.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 04 */}
            <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-8 border-l-4 border-[#FF6B00] transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-16 h-16 bg-[#FF6B00] rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-[#FF6B00] mb-2">ÉTAPE 04</div>
                  <h3 className="text-2xl font-bold text-[#1A1A1A] mb-4">ENTREZ</h3>
                  <p className="text-[#6B7280] leading-relaxed">
                    Présentez votre billet numérique à l'entrée. Scan instantané, accès rapide.
                    Profitez pleinement de votre événement sans tracas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] text-center mb-16">
            La Différence DEM ÉVÉNEMENT
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Traditional Ticketing */}
            <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <X className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-[#1A1A1A]">Billetterie Traditionnelle</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                  <span className="text-[#6B7280]">Impression papier obligatoire</span>
                </li>
                <li className="flex items-start gap-3">
                  <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                  <span className="text-[#6B7280]">Risque de perte ou d'oubli</span>
                </li>
                <li className="flex items-start gap-3">
                  <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                  <span className="text-[#6B7280]">Files d'attente interminables</span>
                </li>
                <li className="flex items-start gap-3">
                  <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                  <span className="text-[#6B7280]">Processus complexe et lent</span>
                </li>
                <li className="flex items-start gap-3">
                  <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                  <span className="text-[#6B7280]">Support limité aux horaires d'ouverture</span>
                </li>
                <li className="flex items-start gap-3">
                  <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                  <span className="text-[#6B7280]">Fraude et contrefaçon possibles</span>
                </li>
              </ul>
            </div>

            {/* DEM ÉVÉNEMENT Solution */}
            <div className="bg-gradient-to-br from-[#FF6B00] to-[#FF8533] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-8 text-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold">Solution DEM ÉVÉNEMENT</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-1" />
                  <span className="text-white/95">100% numérique, zéro papier</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-1" />
                  <span className="text-white/95">Billets toujours dans votre téléphone</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-1" />
                  <span className="text-white/95">Accès ultra-rapide en quelques secondes</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-1" />
                  <span className="text-white/95">Interface simple et intuitive</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-1" />
                  <span className="text-white/95">Assistance disponible 24h/24, 7j/7</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-1" />
                  <span className="text-white/95">Sécurité maximale contre la fraude</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Security */}
            <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-6 text-center transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
              <div className="w-16 h-16 bg-[#FF6B00]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-[#FF6B00]" />
              </div>
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">Sécurité Totale</h3>
              <p className="text-sm text-[#6B7280]">
                Cryptage de bout en bout pour une protection maximale de vos données
              </p>
            </div>

            {/* Speed */}
            <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-6 text-center transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
              <div className="w-16 h-16 bg-[#FF6B00]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-[#FF6B00]" />
              </div>
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">Ultra Rapide</h3>
              <p className="text-sm text-[#6B7280]">
                Achetez et recevez vos billets en moins de 2 minutes
              </p>
            </div>

            {/* 24/7 */}
            <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-6 text-center transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
              <div className="w-16 h-16 bg-[#FF6B00]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-[#FF6B00]" />
              </div>
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">24/7 Disponible</h3>
              <p className="text-sm text-[#6B7280]">
                Service client et plateforme accessibles à toute heure
              </p>
            </div>

            {/* Digital */}
            <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-6 text-center transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
              <div className="w-16 h-16 bg-[#FF6B00]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-[#FF6B00]" />
              </div>
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">100% Digital</h3>
              <p className="text-sm text-[#6B7280]">
                Tout dans votre smartphone, accessible partout, tout le temps
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#FF6B00] to-[#FF8533]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Prêt à vivre l'expérience DEM ÉVÉNEMENT?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Rejoignez des milliers d'utilisateurs qui ont déjà adopté la billetterie du futur
          </p>
          <button className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#FF6B00] font-bold rounded-lg hover:bg-gray-100 transition-colors duration-200 shadow-lg">
            DÉCOUVRIR LES ÉVÉNEMENTS
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1A1A1A] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo & Description */}
            <div className="md:col-span-2">
              <div className="text-2xl font-bold text-[#FF6B00] mb-4">DemDem</div>
              <p className="text-gray-400 text-sm leading-relaxed">
                La plateforme de billetterie numérique révolutionnaire.
                Achetez, recevez et utilisez vos billets en quelques secondes.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-white mb-4">Liens Rapides</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-gray-400 hover:text-[#FF6B00] transition-colors duration-200">
                    Événements
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-[#FF6B00] transition-colors duration-200">
                    Comment ça marche
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-[#FF6B00] transition-colors duration-200">
                    Organisateurs
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-[#FF6B00] transition-colors duration-200">
                    Support
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold text-white mb-4">Légal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-gray-400 hover:text-[#FF6B00] transition-colors duration-200">
                    Mentions légales
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-[#FF6B00] transition-colors duration-200">
                    Confidentialité
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-[#FF6B00] transition-colors duration-200">
                    CGV
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-[#FF6B00] transition-colors duration-200">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 DEM ÉVÉNEMENT. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HowItWorksPage;

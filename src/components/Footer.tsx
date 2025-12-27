import React from 'react';
import { Ticket, Facebook, Instagram, Twitter, Phone, Mail } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 dark:bg-black text-white py-16 px-8 transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Ticket className="text-orange-500" size={32} />
              <span className="text-3xl font-black uppercase tracking-tighter">
                Even<span className="text-orange-500">Pass</span>
              </span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              La plateforme de référence pour découvrir et acheter vos billets d'événements au Sénégal. N°1 sur la billetterie digitale et la gestion des événements en temps réel au Sénégal et en Afrique de l'Ouest.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-black mb-6">Liens Rapides</h3>
            <ul className="space-y-3 text-gray-400">
              <li><a href="#" className="hover:text-orange-500 transition-colors">À propos</a></li>
              <li><a href="#" className="hover:text-orange-500 transition-colors">Événements</a></li>
              <li><a href="#" className="hover:text-orange-500 transition-colors">Organisateurs</a></li>
              <li><a href="#" className="hover:text-orange-500 transition-colors">Aide & Support</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-black mb-6">Contact</h3>
            <div className="space-y-3 text-gray-400">
              <a href="tel:+221771392926" className="flex items-center gap-2 hover:text-orange-500 transition-colors">
                <Phone size={18} />
                <span>77 139 29 26</span>
              </a>
              <a href="mailto:contact@evenpass.sn" className="flex items-center gap-2 hover:text-orange-500 transition-colors">
                <Mail size={18} />
                <span>contact@evenpass.sn</span>
              </a>
            </div>
            <div className="flex gap-4 mt-6">
              <a href="#" className="p-3 bg-gray-800 rounded-full hover:bg-orange-500 transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="p-3 bg-gray-800 rounded-full hover:bg-orange-500 transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="p-3 bg-gray-800 rounded-full hover:bg-orange-500 transition-colors">
                <Twitter size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-gray-500">
          <p>&copy; 2025 EvenPass. Tous droits réservés.</p>
          <button
            onClick={() => {
              window.location.href = '/admin-login.html';
            }}
            className="mt-4 text-xs text-gray-600 hover:text-orange-500 transition-colors"
          >
            •
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

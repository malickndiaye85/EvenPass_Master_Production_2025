import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function TermsPage() {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <button
          onClick={() => navigate('/')}
          className={`flex items-center gap-2 mb-8 ${
            isDark ? 'text-amber-400 hover:text-amber-300' : 'text-orange-500 hover:text-orange-600'
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
          Retour à l'accueil
        </button>

        <div className={`rounded-3xl p-8 ${isDark ? 'bg-slate-800' : 'bg-white'} shadow-xl`}>
          <div className="flex items-center gap-3 mb-6">
            <FileText className={`w-10 h-10 ${isDark ? 'text-amber-400' : 'text-orange-500'}`} />
            <h1 className={`text-4xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Conditions Générales d'Utilisation
            </h1>
          </div>

          <div className={`space-y-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDark ? 'text-amber-400' : 'text-orange-500'}`}>
                1. Objet
              </h2>
              <p>
                Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet de définir les modalités
                et conditions d'utilisation de la plateforme EvenPass ainsi que les droits et obligations
                des utilisateurs et de l'éditeur.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDark ? 'text-amber-400' : 'text-orange-500'}`}>
                2. Acceptation des CGU
              </h2>
              <p>
                L'accès et l'utilisation de la plateforme EvenPass impliquent l'acceptation pleine et entière
                des présentes CGU. En cas de non-acceptation, l'utilisateur doit renoncer à l'utilisation
                de nos services.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDark ? 'text-amber-400' : 'text-orange-500'}`}>
                3. Accès à la plateforme
              </h2>
              <p className="mb-2">
                L'accès à la plateforme est gratuit pour tous les utilisateurs disposant d'un accès internet.
                Les frais d'accès et d'utilisation du réseau de télécommunication sont à la charge de l'utilisateur.
              </p>
              <p>
                EvenPass met tout en œuvre pour assurer la disponibilité de la plateforme 24h/24, 7j/7,
                sauf en cas de force majeure ou de maintenance nécessaire.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDark ? 'text-amber-400' : 'text-orange-500'}`}>
                4. Achat de billets
              </h2>
              <div className="space-y-2">
                <p>
                  <strong>4.1 Commande :</strong> Les utilisateurs peuvent acheter des billets pour les événements
                  disponibles sur la plateforme. Chaque commande est soumise à disponibilité.
                </p>
                <p>
                  <strong>4.2 Paiement :</strong> Les paiements sont effectués via Wave ou Orange Money.
                  Aucune information bancaire n'est stockée par EvenPass.
                </p>
                <p>
                  <strong>4.3 Confirmation :</strong> Après validation du paiement, un billet électronique
                  est envoyé par SMS contenant un QR code unique.
                </p>
                <p>
                  <strong>4.4 Annulation :</strong> Les billets sont généralement non remboursables sauf
                  disposition contraire précisée par l'organisateur ou annulation de l'événement.
                </p>
              </div>
            </section>

            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDark ? 'text-amber-400' : 'text-orange-500'}`}>
                5. Responsabilités
              </h2>
              <div className="space-y-2">
                <p>
                  <strong>5.1 EvenPass :</strong> EvenPass agit en tant qu'intermédiaire entre les organisateurs
                  et les participants. La responsabilité du contenu des événements incombe exclusivement
                  aux organisateurs.
                </p>
                <p>
                  <strong>5.2 Organisateurs :</strong> Les organisateurs s'engagent à fournir des informations
                  exactes sur leurs événements et à respecter la législation en vigueur.
                </p>
                <p>
                  <strong>5.3 Utilisateurs :</strong> Les utilisateurs s'engagent à utiliser la plateforme
                  de manière responsable et à ne pas entraver son fonctionnement.
                </p>
              </div>
            </section>

            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDark ? 'text-amber-400' : 'text-orange-500'}`}>
                6. Protection des données personnelles
              </h2>
              <p>
                Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi sénégalaise
                relative à la protection des données personnelles, EvenPass s'engage à protéger les données
                personnelles de ses utilisateurs. Les données collectées sont utilisées uniquement pour
                le traitement des commandes et l'amélioration de nos services.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDark ? 'text-amber-400' : 'text-orange-500'}`}>
                7. Propriété intellectuelle
              </h2>
              <p>
                Tous les éléments de la plateforme EvenPass (logos, textes, images, technologies) sont
                protégés par le droit d'auteur et le droit des marques. Toute reproduction non autorisée
                est strictement interdite.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDark ? 'text-amber-400' : 'text-orange-500'}`}>
                8. Modification des CGU
              </h2>
              <p>
                EvenPass se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs
                seront informés de toute modification significative via la plateforme.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDark ? 'text-amber-400' : 'text-orange-500'}`}>
                9. Droit applicable et juridiction
              </h2>
              <p>
                Les présentes CGU sont régies par le droit sénégalais. En cas de litige, les tribunaux
                de Dakar seront seuls compétents.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-bold mb-3 ${isDark ? 'text-amber-400' : 'text-orange-500'}`}>
                10. Contact
              </h2>
              <p>
                Pour toute question concernant ces CGU, vous pouvez nous contacter à l'adresse :
                <a
                  href="mailto:contact@evenpass.sn"
                  className={`font-bold ml-1 ${isDark ? 'text-amber-400' : 'text-orange-500'}`}
                >
                  contact@evenpass.sn
                </a>
              </p>
            </section>

            <div className={`mt-8 pt-6 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
              <p className="text-sm italic">
                Dernière mise à jour : Janvier 2025
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

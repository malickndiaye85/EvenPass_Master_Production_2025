#!/bin/bash

# ============================================
# DÉPLOIEMENT RÈGLES FIRESTORE
# ============================================

echo "🔥 DÉPLOIEMENT DES RÈGLES FIRESTORE"
echo "===================================="
echo ""

# Vérifier Firebase CLI
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI n'est pas installé"
    echo "Installation: npm install -g firebase-tools"
    exit 1
fi

echo "✅ Firebase CLI installé"
echo ""

# Vérifier le projet
echo "📋 Projet Firebase actuel:"
firebase projects:list | grep evenpasssenegal || {
    echo "⚠️  Projet evenpasssenegal non trouvé"
    echo "Configuration: firebase use evenpasssenegal"
    exit 1
}
echo ""

# Afficher les règles actuelles
echo "📖 Règles Firestore actuelles (début):"
firebase firestore:rules:get | head -20
echo ""

# Confirmer le déploiement
read -p "🚀 Déployer les nouvelles règles ? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Déploiement annulé"
    exit 0
fi

# Déployer les règles
echo "🚀 Déploiement en cours..."
firebase deploy --only firestore:rules

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ DÉPLOIEMENT RÉUSSI"
    echo ""
    echo "📊 Statistiques:"
    echo "  - Lignes: $(wc -l < firestore.rules)"
    echo "  - Collections: $(grep -c 'match /' firestore.rules)"
    echo ""
    echo "🔍 Vérification:"
    firebase firestore:rules:get | head -10
    echo ""
    echo "✅ Règles déployées avec succès!"
else
    echo ""
    echo "❌ ÉCHEC DU DÉPLOIEMENT"
    echo "Vérifiez les erreurs ci-dessus"
    exit 1
fi

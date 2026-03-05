#!/bin/bash

# Script de déploiement des règles Firebase
# Usage: ./deploy-rules.sh

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔒 Déploiement des Règles Firebase"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Vérifier que Firebase CLI est installé
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI n'est pas installé"
    echo ""
    echo "Installation :"
    echo "  npm install -g firebase-tools"
    echo ""
    exit 1
fi

# Vérifier que le fichier database.rules.json existe
if [ ! -f "database.rules.json" ]; then
    echo "❌ Fichier database.rules.json introuvable"
    exit 1
fi

echo "✅ Firebase CLI installé"
echo "✅ Fichier database.rules.json trouvé"
echo ""

# Backup des règles actuelles
echo "📦 Backup des règles actuelles..."
BACKUP_FILE="backup-rules-$(date +%Y%m%d-%H%M%S).json"
firebase database:get .settings/rules > "backups/$BACKUP_FILE" 2>/dev/null || mkdir -p backups && firebase database:get .settings/rules > "backups/$BACKUP_FILE" 2>/dev/null || echo "⚠️  Impossible de créer le backup (première installation ?)"
echo ""

# Afficher un aperçu des règles
echo "📄 Aperçu des nouvelles règles :"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
head -20 database.rules.json
echo "..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Demander confirmation
read -p "🤔 Voulez-vous déployer ces règles ? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Déploiement annulé"
    exit 0
fi

echo ""
echo "🚀 Déploiement en cours..."
echo ""

# Déployer les règles
if firebase deploy --only database; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ Règles déployées avec succès !"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📝 Actions suivantes :"
    echo "  1. Vérifier dans Console Firebase"
    echo "  2. Tester les accès publics"
    echo "  3. Tester les accès protégés"
    echo "  4. Vérifier les index créés"
    echo ""
    if [ -f "backups/$BACKUP_FILE" ]; then
        echo "💾 Backup sauvegardé : backups/$BACKUP_FILE"
    fi
else
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "❌ Erreur lors du déploiement"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🔧 Vérifications :"
    echo "  - Êtes-vous connecté ? (firebase login)"
    echo "  - Le projet est-il initialisé ? (firebase init)"
    echo "  - Le fichier database.rules.json est-il valide ?"
    echo ""
    exit 1
fi

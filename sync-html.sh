#!/bin/bash

# Script de synchronisation des fichiers HTML statiques
# De public/ vers dist/

echo "🔄 Synchronisation des fichiers HTML..."

# Copier tous les fichiers HTML
cp public/*.html dist/ 2>/dev/null

# Copier les fichiers JS standalone
cp public/*.js dist/ 2>/dev/null

echo "✅ Synchronisation terminée"

# Lister les fichiers copiés
echo ""
echo "📋 Fichiers HTML dans dist/:"
ls -1 dist/*.html 2>/dev/null | wc -l
echo " fichiers copiés"

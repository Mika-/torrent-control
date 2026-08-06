#!/bin/bash
echo "🚀 Construction rapide pour Firefox..."

# Nettoyer
rm -rf dist web-ext-artifacts/torrent-control-c411-fixed.zip

# Créer dist
mkdir -p dist
cp -r src/* dist/

# Vérifier manifest
if [ ! -f "dist/manifest.json" ]; then
    echo "❌ Erreur: manifest.json manquant"
    exit 1
fi

# Créer le ZIP
cd dist
zip -qr ../torrent-control-c411-fixed.zip .
cd ..

echo "✅ Fichier prêt : $(pwd)/torrent-control-c411-fixed.zip"
echo "👉 Ouvrez Firefox -> about:debugging -> Ce Firefox -> Charger un module temporaire"
echo "👉 Sélectionnez le fichier ZIP ci-dessus"

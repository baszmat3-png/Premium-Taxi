#!/usr/bin/env bash
# Usage: SERVER_URL=https://your-domain.com ./build-apk.sh [customer|captain|owner|support|restaurant ...]
set -euo pipefail
: "${SERVER_URL:?set SERVER_URL, e.g. https://taxi.example.com}"
cd "$(dirname "$0")"; SERVER_URL="${SERVER_URL%/}"
declare -A ID=([customer]=com.safra.customer [captain]=com.safra.captain [owner]=com.safra.owner [support]=com.safra.support [restaurant]=com.safra.restaurant)
declare -A NAME=([customer]="تكسي المتميز" [captain]="تكسي المتميز كابتن" [owner]="تكسي المتميز المالك" [support]="تكسي المتميز الدعم" [restaurant]="تكسي المتميز المطعم")
declare -A PAGE=([customer]=/customer.html [captain]=/driver.html [owner]="/panel.html?r=admin" [support]="/panel.html?r=support" [restaurant]=/rest.html)
APPS=("$@"); [ ${#APPS[@]} -eq 0 ] && APPS=(customer captain owner support restaurant)
npm install --no-audit --no-fund; mkdir -p ../dist
for a in "${APPS[@]}"; do
  W="build/$a"; rm -rf "$W"; mkdir -p "$W/assets"; cp -r www "$W/www"; cp icons/$a.png "$W/assets/icon-only.png"; cp icons/$a.png "$W/assets/icon-foreground.png"
  cp package.json "$W/"; ln -s "$PWD/node_modules" "$W/node_modules"; cd "$W"
  cat > capacitor.config.json <<JSON
{"appId":"${ID[$a]}","appName":"${NAME[$a]}","webDir":"www","server":{"url":"${SERVER_URL}${PAGE[$a]}","cleartext":false,"androidScheme":"https"}}
JSON
  npx cap add android
  M=android/app/src/main/AndroidManifest.xml
  sed -i 's#<application#<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/><uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>\n<application#' "$M"
  npx capacitor-assets generate --android --iconBackgroundColor '#ffffff' || true
  (cd android && ./gradlew assembleRelease -q || ./gradlew assembleDebug -q)
  cp "$(find android/app/build/outputs/apk -name '*.apk' | head -1)" "../../../dist/taxi-mutamayyiz-$a.apk"
  cd ../..
done
echo "Done: ../dist/"

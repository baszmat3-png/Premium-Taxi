#!/usr/bin/env bash
# يبني ملف AAB موقّعاً جاهزاً لمتجر Google Play لكل تطبيق
# Usage: SERVER_URL=https://premium-taxi.onrender.com KS_FILE=upload-key.jks KS_PASS=... KS_ALIAS=upload VERSION_CODE=1 ./build-aab.sh customer captain restaurant restpos
set -euo pipefail
: "${SERVER_URL:?set SERVER_URL}"; MODE="${MODE:-aab}"; if [ "$MODE" = aab ] && [ -z "${UNSIGNED:-}" ]; then : "${KS_FILE:?set KS_FILE}"; : "${KS_PASS:?set KS_PASS}"; fi
KS_ALIAS="${KS_ALIAS:-upload}"; KS_PASS="${KS_PASS:-}"; KS_FILE="${KS_FILE:-}"; KEY_PASS="${KEY_PASS:-$KS_PASS}"; VC="${VERSION_CODE:-1}"; VN="${VERSION_NAME:-1.0.$VC}"
cd "$(dirname "$0")"; SERVER_URL="${SERVER_URL%/}"; [ -n "$KS_FILE" ] && [ -e "$KS_FILE" ] && KS_FILE="$(realpath "$KS_FILE")" || true
declare -A ID=([customer]=com.safra.customer [captain]=com.safra.captain [restaurant]=com.safra.restaurant [restpos]=com.safra.restpos [owner]=com.safra.owner [support]=com.safra.support)
declare -A NAME=([customer]="تكسي المتميز" [captain]="تكسي المتميز كابتن" [restaurant]="تكسي المتميز المطعم" [restpos]="جهاز طلبات المطعم" [owner]="تكسي المتميز المالك" [support]="تكسي المتميز الدعم")
declare -A PAGE=([customer]=/customer.html [captain]=/driver.html [restaurant]=/rest.html [restpos]=/restpos.html [owner]="/panel.html?r=admin" [support]="/panel.html?r=support")
APPS=("$@"); [ ${#APPS[@]} -eq 0 ] && APPS=(customer captain restaurant restpos)
npm install --no-audit --no-fund --legacy-peer-deps; mkdir -p ../dist
for a in "${APPS[@]}"; do
  W="build/$a"; rm -rf "$W"; mkdir -p "$W/assets"; cp -r www "$W/www"; cp icons/$a.png "$W/assets/icon-only.png"; cp icons/$a.png "$W/assets/icon-foreground.png"; cp icons/$a.png "$W/assets/splash.png"
  cp package.json "$W/"; ln -s "$PWD/node_modules" "$W/node_modules"; cd "$W"
  cat > capacitor.config.json <<JSON
{"appId":"${ID[$a]}","appName":"${NAME[$a]}","webDir":"www","server":{"url":"${SERVER_URL}${PAGE[$a]}","cleartext":false,"androidScheme":"https","allowNavigation":["$(echo "$SERVER_URL" | sed 's#https\?://##')"]},"android":{"allowMixedContent":false}}
JSON
  npx cap add android
  M=android/app/src/main/AndroidManifest.xml
  P='<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/><uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/><uses-permission android:name="android.permission.POST_NOTIFICATIONS"/><uses-permission android:name="android.permission.VIBRATE"/>'
  [ "$a" = captain ] && P="$P"'<uses-permission android:name="android.permission.CAMERA"/><uses-permission android:name="android.permission.RECORD_AUDIO"/><uses-feature android:name="android.hardware.camera" android:required="false"/>'
  sed -i "s#<application#${P}\n<application#" "$M"
  # أحدث SDK يطلبه المتجر
  sed -i -E 's/compileSdkVersion = [0-9]+/compileSdkVersion = 35/; s/targetSdkVersion = [0-9]+/targetSdkVersion = 35/' android/variables.gradle
  G=android/app/build.gradle
  sed -i -E "s/versionCode [0-9]+/versionCode ${VC}/; s/versionName \"[^\"]*\"/versionName \"${VN}\"/" "$G"
  node -e "require('sharp')({create:{width:1024,height:1024,channels:3,background:'#ffffff'}}).png().toFile('assets/icon-background.png').catch(()=>process.exit(1))" || true
  npx capacitor-assets generate --android --splashBackgroundColor '#0b1226' || true
  # احتياط: إن بقي ملف الأيقونة المتكيّفة يشير إلى خلفية غير موجودة نستعمل لوناً
  R=android/app/src/main/res; if ! ls $R/mipmap-*/ic_launcher_background.* >/dev/null 2>&1; then mkdir -p $R/values; grep -q ic_launcher_background $R/values/*.xml 2>/dev/null || printf '<?xml version="1.0" encoding="utf-8"?>\n<resources><color name="ic_launcher_background">#FFFFFF</color></resources>\n' > $R/values/ic_launcher_background.xml; sed -i 's#@mipmap/ic_launcher_background#@color/ic_launcher_background#' $R/mipmap-anydpi-v26/*.xml; fi
  if [ "$MODE" = apk ]; then
   (cd android && ./gradlew assembleDebug --no-daemon -q)
   cp "$(find android/app/build/outputs/apk -name '*.apk' | head -1)" "../../../dist/taxi-mutamayyiz-$a.apk"
  else
   (cd android && ./gradlew bundleRelease --no-daemon -q)
   AAB=$(find android/app/build/outputs/bundle -name '*.aab' | head -1)
   [ -n "$KS_PASS" ] && [ -s "$KS_FILE" ] && jarsigner -sigalg SHA256withRSA -digestalg SHA-256 -keystore "$KS_FILE" -storepass "$KS_PASS" -keypass "$KEY_PASS" "$AAB" "$KS_ALIAS"
   cp "$AAB" "../../../dist/taxi-mutamayyiz-$a-$VN.aab"
  fi
  cd ../..
done
echo "Done: dist/"

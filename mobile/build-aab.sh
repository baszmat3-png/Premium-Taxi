#!/usr/bin/env bash
# يبني ملف AAB موقّعاً جاهزاً لمتجر Google Play لكل تطبيق
# Usage: SERVER_URL=https://premium-taxi.onrender.com KS_FILE=upload-key.jks KS_PASS=... KS_ALIAS=upload VERSION_CODE=1 ./build-aab.sh customer captain restaurant restpos
set -euo pipefail
: "${SERVER_URL:?set SERVER_URL}"; MODE="${MODE:-aab}"; if [ "$MODE" = aab ] && [ -z "${UNSIGNED:-}" ]; then : "${KS_FILE:?set KS_FILE}"; : "${KS_PASS:?set KS_PASS}"; fi
KS_ALIAS="${KS_ALIAS:-upload}"; KS_PASS="${KS_PASS:-}"; KS_FILE="${KS_FILE:-}"; KEY_PASS="${KEY_PASS:-$KS_PASS}"; VC="${VERSION_CODE:-1}"; VN="${VERSION_NAME:-1.0.$VC}"
cd "$(dirname "$0")"; SERVER_URL="${SERVER_URL%/}"; [ -n "$KS_FILE" ] && [ -e "$KS_FILE" ] && KS_FILE="$(realpath "$KS_FILE")" || true
declare -A ID=([customer]=com.safra.customer [delivery]=com.safra.delivery [captain]=com.safra.captain [restaurant]=com.safra.restaurant [restpos]=com.safra.restpos [owner]=com.safra.owner [support]=com.safra.support)
declare -A NAME=([customer]="تكسي المتميز" [delivery]="تكسي المتميز دلفري" [captain]="تكسي المتميز كابتن" [restaurant]="تكسي المتميز المطعم" [restpos]="جهاز طلبات المطعم" [owner]="تكسي المتميز المالك" [support]="تكسي المتميز الدعم")
declare -A PAGE=([customer]=/customer.html [delivery]="/driver.html?app=delivery" [captain]=/driver.html [restaurant]=/rest.html [restpos]=/restpos.html [owner]="/panel.html?r=admin" [support]="/panel.html?r=support")
APPS=("$@"); [ ${#APPS[@]} -eq 0 ] && APPS=(customer captain delivery restaurant restpos)
npm install --no-audit --no-fund --legacy-peer-deps; mkdir -p ../dist
# إشعارات Firebase (تصل والتطبيق مغلق): تُفعَّل فقط إذا وُجد ملف google-services.json — بدونه يتعطل التطبيق عند التسجيل
# مفتاح توقيع ثابت لنسخ APK (حتى لا تتغير بصمة SHA-1 بين البناءات — يحتاجها تسجيل Google)
if [ "$MODE" = apk ] && [ -s debug.keystore ]; then mkdir -p ~/.android; cp debug.keystore ~/.android/debug.keystore; fi
# تسجيل الدخول بحساب Google داخل تطبيق الزبون (مكوّن أصلي)
npm install --no-audit --no-fund --legacy-peer-deps @capgo/capacitor-social-login@^7.0.0 || echo "تعذر تثبيت social-login — يُبنى بدون تسجيل Google"
GSJ="$PWD/google-services.json"; if [ -s "$GSJ" ]; then echo "FCM: google-services.json موجود — تفعيل الإشعارات"; npm install --no-audit --no-fund --legacy-peer-deps @capacitor/push-notifications@^7.0.0; else echo "FCM: لا يوجد google-services.json — البناء بدون إشعارات Firebase"; fi
for a in "${APPS[@]}"; do
  W="build/$a"; rm -rf "$W"; mkdir -p "$W/assets"; cp -r www "$W/www"; cp icons/$a.png "$W/assets/icon-only.png"; cp icons/$a.png "$W/assets/icon-foreground.png"; cp icons/$a.png "$W/assets/splash.png"
  cp package.json "$W/"
  # التطبيق غير المضاف في مشروع Firebase يُبنى بدون مكتبة الإشعارات (وإلا يتعطل عند التسجيل)
  if [ -s "$GSJ" ] && ! grep -q '"package_name": "'"${ID[$a]}"'"' "$GSJ"; then echo "FCM: ${ID[$a]} غير مضاف في Firebase — بدون إشعارات"; node -e "const fs=require('fs'),f=process.argv[1],p=JSON.parse(fs.readFileSync(f,'utf8'));for(const k of ['dependencies','devDependencies'])if(p[k])delete p[k]['@capacitor/push-notifications'];fs.writeFileSync(f,JSON.stringify(p))" "$W/package.json"; fi
  [ "$a" = customer ] || node -e "const fs=require('fs'),f=process.argv[1],p=JSON.parse(fs.readFileSync(f,'utf8'));for(const k of ['dependencies','devDependencies'])if(p[k])delete p[k]['@capgo/capacitor-social-login'];fs.writeFileSync(f,JSON.stringify(p))" "$W/package.json"
  ln -s "$PWD/node_modules" "$W/node_modules"; cd "$W"
  cat > capacitor.config.json <<JSON
{"appId":"${ID[$a]}","appName":"${NAME[$a]}","webDir":"www","server":{"url":"${SERVER_URL}${PAGE[$a]}","cleartext":false,"androidScheme":"https","allowNavigation":["$(echo "$SERVER_URL" | sed 's#https\?://##')"]},"android":{"allowMixedContent":false}}
JSON
  npx cap add android
  if [ "$a" = customer ] && [ -d node_modules/@capgo/capacitor-social-login ]; then MA=$(find android/app/src/main/java -name MainActivity.java | head -1); PK=$(sed -n 's/^package \(.*\);/\1/p' "$MA")
   cat > "$MA" <<JAVA
package ${PK};
import android.content.Intent;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginHandle;
import ee.forgr.capacitor.social.login.GoogleProvider;
import ee.forgr.capacitor.social.login.ModifiedMainActivityForSocialLoginPlugin;
import ee.forgr.capacitor.social.login.SocialLoginPlugin;
public class MainActivity extends BridgeActivity implements ModifiedMainActivityForSocialLoginPlugin {
  @Override
  public void onActivityResult(int requestCode, int resultCode, Intent data) {
    super.onActivityResult(requestCode, resultCode, data);
    if (requestCode >= GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MIN && requestCode < GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MAX) {
      PluginHandle h = getBridge().getPlugin("SocialLogin");
      if (h == null) return;
      Plugin p = h.getInstance();
      if (p instanceof SocialLoginPlugin) ((SocialLoginPlugin) p).handleGoogleLoginIntent(requestCode, data);
    }
  }
  public void IHaveModifiedTheMainActivityForTheUseWithSocialLoginPlugin() {}
}
JAVA
   echo "Google: MainActivity معدّل لتسجيل Google"; fi
  if [ -s "$GSJ" ] && grep -q '"package_name": "'"${ID[$a]}"'"' "$GSJ"; then cp "$GSJ" android/app/google-services.json; echo "FCM: مفعّل لـ ${ID[$a]}"; fi
  M=android/app/src/main/AndroidManifest.xml
  P='<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/><uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/><uses-permission android:name="android.permission.POST_NOTIFICATIONS"/><uses-permission android:name="android.permission.VIBRATE"/>'
  [ "$a" = captain ] || [ "$a" = delivery ] && P="$P"'<uses-permission android:name="android.permission.CAMERA"/><uses-permission android:name="android.permission.RECORD_AUDIO"/><uses-feature android:name="android.hardware.camera" android:required="false"/>'
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

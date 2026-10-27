# تكسي المتميز — تشغيل وبناء التطبيقات
1. شغّل السيرفر (Node 18+): `ADMIN_PIN=رمزك GOOGLE_MAPS_KEY=مفتاحك node server.js` على استضافة HTTPS (Render/Railway/VPS). غيّر ADMIN_PIN الافتراضي 1234.
2. ابنِ الـ APK: `SERVER_URL=https://دومينك ./mobile/build-apk.sh` (يتطلب Node 18+ و JDK 17 و Android SDK) أو شغّل Workflow "Build APKs" في GitHub بعد إضافة Secret باسم SERVER_URL.
3. النواتج في `dist/`: taxi-mutamayyiz-customer.apk (الزبون) • taxi-mutamayyiz-captain.apk (الكابتن) • taxi-mutamayyiz-owner.apk (صاحب التطبيق) • taxi-mutamayyiz-support.apk (الدعم).

4. تطبيق المطعم: `/rest.html` (يدخل برمز المطعم والرمز السري من لوحة التحكم) • ملف الـAPK: taxi-mutamayyiz-restaurant.apk
5. متغيرات بيئة إضافية: `WA_API_URL` `WA_API_KEY` (رمز واتساب) • `GOOGLE_CLIENT_ID` (دخول جوجل).

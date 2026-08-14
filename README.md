# موقع تخليد الشهيد صالح سالم الشعب

هذا الإصدار يستخدم الأوراق التي أنشأتها بالفعل:
- profile: key | value
- timeline: id | title | description | order
- stories: id | title | content | author | relation | date
- memories: id | name | relation | title | story | contact | status | createdAt
- gallery: id | image | title | description | date
- quotes: id | quote
- achievements: id | title | description | date

## 1) Apps Script
1. افتح Google Sheet ثم Extensions > Apps Script.
2. استبدل Code.gs بالكود الموجود في apps-script/Code.gs.
3. احفظ المشروع.
4. شغّل الدالة setup مرة واحدة ووافق على الصلاحيات.
5. من Project Settings > Script properties أضف:
   ADMIN_TOKEN = كلمة سر طويلة عشوائية.
6. Deploy > New deployment > Web app.
   Execute as: Me
   Who has access: Anyone
7. انسخ رابط /exec.

## 2) ربط الموقع
افتح site/config.js وضع رابط الموقع فقط:
window.MEMORIAL_CONFIG = {
  apiUrl: '/api',
  siteUrl: 'رابط الموقع النهائي',
  adminPath: '/admin.html'
};

## 3) Netlify + الفهرسة
هذا المشروع يحتوي على Netlify Function تجعل الصفحة الرئيسية Server-Side Rendered من Google Sheets، لكي يرى محرك البحث المحتوى داخل HTML بدل الاعتماد على JavaScript فقط.

في Netlify أضف Environment Variable:
APPS_SCRIPT_URL = رابط Apps Script /exec

الملف netlify/functions/api.js يعمل كوسيط للموقع، لذلك لا يحتاج المتصفح إلى الاتصال مباشرة بـ Apps Script.

ثم انشر المجلد كاملًا.
بعد النشر عدّل:
- site/config.js: siteUrl
- robots.txt: ضع رابط الموقع الحقيقي
- sitemap.xml: ضع رابط الموقع الحقيقي

## 4) لوحة الإدارة
ادخل إلى /admin.html واستخدم ADMIN_TOKEN.

المعلومات الأساسية والذكريات تُدار من اللوحة. أما timeline / stories / gallery / quotes / achievements فتُدار مباشرة من Google Sheets باستخدام نفس الأعمدة التي طلبتها.

## 5) الحالات في memories
استخدم فقط:
pending
approved
rejected

أي ذكرى يرسلها الزائر تدخل pending تلقائيًا ولا تظهر للعامة. من لوحة الإدارة غيّرها إلى approved لتظهر.

## 6) Google Search Console
بعد نشر الموقع:
1. أضف النطاق أو URL-prefix.
2. تحقق من الملكية.
3. أرسل /sitemap.xml.
4. استخدم URL Inspection للرابط الرئيسي وRequest Indexing.

لا يوجد ضمان لظهور الموقع فورًا؛ قرار الفهرسة والترتيب يعود إلى Google.

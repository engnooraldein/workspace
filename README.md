# نظام النداء الذكي | Smart Buzzer Platform

منصة سحابية متعددة المستأجرين (Multi-tenant SaaS) لإدارة وتتبع طلبات المطاعم والكافيهات لحظياً، كبديل رقمي متكامل لأجهزة المناداة والبيجر الفيزيائية (Physical Pagers).

---

## 🚀 المميزات الرئيسية (Key Features)

### 1. نظام الهوية والمستأجرين (Multi-Tenant Shell & Design System)
- هوية بصرية مخصصة لكل مطعم (الألوان، الشعار، العملة، أرقام التواصل وروابط التواصل).
- واجهة ثنائية اللغة: **العربية (RTL)** كافتراضي مع إمكانية التبديل إلى **English (LTR)**.
- تصميم عصري بأسلوب Dark Mode مع Glassmorphism وتأثيرات ضوئية حيوية.

### 2. شاشة تتبع الزبون (Live Customer Tracking UI)
- تتبع حالة الطلب لحظياً عبر **Server-Sent Events (SSE)** بدون الحاجة لتحديث الصفحة.
- تنبيه صوتي مستمر (Web Audio API Synthesizer) واهتزاز (Vibration API) فور تحول الطلب إلى **جاهز للاستلام (READY)**.
- استعراض المنيو الرقمي (Digital Menu) مع تصنيف الأقسام والأسعار.
- سلايدر العروض الترويجية الحصرية (Promotions).
- تقييم التجربة بالنجوم (1 إلى 5 نجوم) مع حفظ الملاحظات.

### 3. شاشة الكاشير والمطبخ (POS / Kitchen Dashboard)
- إصدار فوري لأرقام الطلبات مع ترقيم تسلسلي ذكي لليوم.
- توليد رمز **QR Code** مباشر لكل طلب يوجه العميل إلى رابط التتبع المشفر والآمن.
- تحديث فوري للحالة: **قيد التحضير (PREPARING)** ➔ **جاهز (READY)** ➔ **تم الاستلام (COMPLETED)** ➔ **ملغي (CANCELLED)**.
- وضع الأرشيف اليومي للاطلاع على كافة طلبات اليوم ومعدل أوقات التجهيز.

### 4. طباعة الإيصالات الحرارية (Thermal Printing & ESC/POS)
- صفحة طباعة مهيأة لطابعات الفواتير الحرارية قياس **80mm** و **58mm**.
- تشمل رقم الطلب بخط ضخم، رقم الطاولة، الأصناف، الإجمالي، ورمز الـ QR لتتبع الطلب.
- واجهة برمجة مخصصة لإخراج بايتات **ESC/POS** المباشرة:
  `/api/print/[token]/escpos` (لربطها مع طابعات الشبكة أو برامج الطباعة السحابية).

### 5. لوحة تحكم المشرف العام (Super Admin Dashboard)
- لوحة شاملة لإدارة كافة المطاعم والاشتراكات عبر الرابط `/admin`.
- **تجميد وفك تجميد الاشتراكات (Freeze / Unfreeze)** بضغطة زر واحدة.
- إدارة المنيو الرقمي (إضافة أقسام، إضافة أصناف، وتحديد الأصناف المتوفرة / غير المتوفرة).
- إدارة العروض الترويجية للمطاعم.
- تقارير وتحليلات بيانية للأداء:
  - إجمالي الطلبات وحجم الطلبات اليومية (Daily Trends Chart).
  - متوسط وقت تجهيز الطلب بالدقائق.
  - توزيع تقييمات الزبائن (Breakdown).
  - أداء الفروع.

### 6. تطبيق ويب تقدمي (PWA)
- دعم التثبيت المباشر كتطبيق هاتف أو تابلت عبر الـ Manifest والأيقونات المخصصة.

---

## 🔑 بيانات الدخول التجريبية (Demo Credentials)

| الدور (Role) | البريد الإلكتروني (Email) | كلمة المرور (Password) | الرابط (URL) |
|---|---|---|---|
| **المشرف العام (Super Admin)** | `NOORALDEINSBAH@gmail.com` | `SmartBuzzer2026!` | [`/admin/login`](http://localhost:3000/admin/login) |
| **كاشير مطعم الرافدين** | `cashier@rafidain.com` | `Staff2026!` | [`/rafidain/pos/login`](http://localhost:3000/rafidain/pos/login) |
| **كاشير كافيه النخيل** | `cashier@nakheel.com` | `Staff2026!` | [`/nakheel/pos/login`](http://localhost:3000/nakheel/pos/login) |

---

## 🛠️ التشغيل والتثبيت (Getting Started)

### متطلبات التشغيل:
- Node.js 18+ (أو Node.js 20+)
- npm أو pnpm أو yarn

### 1. تثبيت الحزم:
```bash
npm install
```

### 2. إعداد قاعدة البيانات وتوليد Prisma Client:
```bash
npx prisma generate
npx prisma db push
```

### 3. زرع البيانات التجريبية (Seed):
```bash
npx tsx prisma/seed.ts
```

### 4. تشغيل خادم التطوير:
```bash
npm run dev
```

افتح المتصفح على: [http://localhost:3000](http://localhost:3000)

### 5. بناء التطبيق للإنتاج (Production Build):
```bash
npm run build
npm run start
```

---

## 📂 بنية المسارات الرئيسية (Key Routes)

- `/` : الصفحة الرئيسية للمنصة وقائمة المطاعم.
- `/[slug]` : الصفحة العامة للمطعم وقائمة الطعام الرقمية (مثال: `/rafidain`).
- `/[slug]/pos` : شاشة الكاشير والمطبخ للمطعم.
- `/[slug]/track?order=[token]` : شاشة العميل لمتابعة حالة الطلب لحظياً.
- `/[slug]/pos/print/[token]` : صفحة طباعة الإيصال الحراري.
- `/admin` : لوحة تحكم المشرف العام.
- `/admin/restaurants` : إدارة المطاعم وحالات الاشتراكات والتجميد.
- `/admin/menu` : إدارة أقسام وقوائم الطعام والعروض.
- `/admin/reports` : التقارير والرسوم البيانية.
- `/api/print/[token]/escpos` : بث أوامر الطباعة الثنائية لطابعات الفواتير ESC/POS.
- `/api/pos/orders/stream` : قناة SSE للتحديثات اللحظية للكاشير.
- `/api/public/orders/[token]/stream` : قناة SSE للتحديثات اللحظية للعميل.

---

## ⚙️ التقنيات المستخدمة (Stack)
- **Framework**: Next.js 16 (App Router, Server Components & Server Actions)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + Vanilla Design System
- **Database**: SQLite (تطوير ومحلي) / PostgreSQL (جاهز للإنتاج) عبر Prisma ORM
- **Auth**: JWT Sessions عبر Jose & BcryptJS
- **Realtime**: Server-Sent Events (SSE)
- **Audio & Haptics**: Web Audio API Oscillator & Web Vibration API
- **QR Codes**: Node QRCode (PNG & Data-URL)

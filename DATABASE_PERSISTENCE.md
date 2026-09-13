# دليل الربط بقاعدة بيانات سحابية دائمة (Cloud PostgreSQL Persistence Guide)

لحماية بيانات منصة **سرد رقمي** من الحذف عند نوم الخادم المجاني على Render (**Render Free Tier Container Sleep**)، تم تفعيل نظام الحفظ السحابي الدائم (**Cloud PostgreSQL Auto-Sync Engine**).

---

## كيف يعمل النظام؟
1. **عند تشغيل الخادم لأول مرة أو بعد الاستيقاظ من النوم**:
   - يتصل الخادم بـ Cloud PostgreSQL تلقائياً عبر `DATABASE_URL`.
   - يسترجع أحدث نسخة كاملة من البيانات في أقل من 30 جزءاً من الثانية.
2. **عند إضافة أي مستخدم، منشور، تعليق، تفاعل، أو فعالية**:
   - يتم تنفيذ العملية محلياً بسرعة فائقة (< 1ms).
   - يقوم النظام تلقائياً بمزامنة وحفظ التحديثات في قاعدة بيانات PostgreSQL السحابية.
3. **عند نوم الحاوية المجانية (Sleep)**:
   - كافة بياناتك تبقى محفوظة بشكل دائم ومستمر في قاعدة بيانات PostgreSQL السحابية، ولا تُمسح أبداً.

---

## 3 خيارات مجانية 100% للحصول على رابط الاتصال (`DATABASE_URL`)

### الخيار 1: قاعدة بيانات Render PostgreSQL المجانية (الأسهل والأسرع)
1. ادخل إلى لوحة تحكم [Render Dashboard](https://dashboard.render.com).
2. اضغط على زر **New +** في الزاوية العلوية واشترِ/اختر **PostgreSQL**.
3. املأ البيانات:
   - **Name**: `sard-db`
   - **Database**: `sard_production`
   - **User**: `sard_admin`
   - **Plan**: اختر **Free** (مجاني 100%).
4. بعد الإنشاء (يستغرق دقيقة)، انزل إلى قسم **Connections**:
   - انسخ **Internal Database URL** (إذا كان الموقع مستضافاً على نفس حساب Render) أو **External Database URL**.
5. اذهب إلى خدمة الويب الخاصة بموقعك (`sard-raqami`) في Render:
   - اضغط على **Environment**.
   - أضف متغيراً باسم:
     - **Key**: `DATABASE_URL`
     - **Value**: الصق الرابط الذي نسخته (يبدأ بـ `postgres://...`).
   - اضغط **Save Changes**.

---

### الخيار 2: استخدام Neon.tech (سريعة جداً ومجانية مدى الحياة)
1. سجل حساباً مجانياً على [Neon.tech](https://neon.tech).
2. اضغط **Create Project** وسمّه `sard-production`.
3. انسخ رابط الاتصال الظاهر في اللوحة الرئيسية مباشرة (يكون بصيغة `postgres://...`).
4. في لوحة تحكم Render لخدمة الويب `sard-raqami`:
   - اذهب إلى **Environment**.
   - أضف المتغير:
     - `DATABASE_URL` = الرابط المنسوخ من Neon.
   - اضغط **Save Changes**.

---

### الخيار 3: استخدام Supabase (مجاني وقوي جداً)
1. سجل حساباً مجانياً على [Supabase.com](https://supabase.com).
2. أنشئ مشروعاً جديداً **New Project** باسم `sard-db` وحدد كلمة مرور قوية.
3. ادخل على **Project Settings** ➔ **Database** ➔ قسم **Connection string** ➔ اختر **URI**.
4. استبدل `[YOUR-PASSWORD]` بكلمة المرور التي اخترتها.
5. في لوحة تحكم Render:
   - أضف `DATABASE_URL` بالرابط المنسوخ.

---

## كيف تتأكد أن الحفظ السحابي يعمل بنجاح؟
افتح الرابط التالي لموقعك على المتصفح:
```
https://<your-render-url>/api/health
```
ستظهر لك النتيجة التالية:
```json
{
  "status": "ok",
  "mode": "production",
  "cloud_persistence": "active",
  "database_provider": "Neon PostgreSQL",
  "avg_latency_ms": 0.18
}
```
عندما ترى `"cloud_persistence": "active"` فهذا يعني أن بياناتك محفوظة سحابياً بشكل آمن ودائم ولن تُفقد أبداً مهما نامت الحاوية المجانية!

---

## الاسترداد التلقائي الشامل للكوارث من Supabase (Automatic Disaster Recovery)

إذا حدث وفُقدت البيانات، أو تم حذف قاعدة بيانات Render PostgreSQL لانتهاء الفترة المجانية، أو أُعيد تشغيل الحاوية دون قرص تخزين:

### كيف يعمل الاسترداد التلقائي؟
1. **عند إقلاع الخادم (Server Boot)**:
   - يفحص النظام قاعدة البيانات الأساسية `DATABASE_URL` وقاعدة البيانات المحلية.
   - إذا وجد أن قاعدة البيانات مفقودة أو فارغة (0 مستخدمين) أو أن رابط Render لم يعد يستجيب، يقوم النظام **تلقائياً بالاتصال بـ Supabase عبر `SUPABASE_DATABASE_URL`**.
   - يتم تنزيل واسترجاع آخر لقطة مشفرة (Snapshot) أو إعادة بناء الجداول الـ 19 بالكامل دون أي تدخل بشري!
   - يتم تحويل Supabase تلقائياً ليكون الهدف النشط (Live Failover Persistence) لضمان حفظ كل التعديلات القادمة مباشرة في Supabase.

2. **حماية النسخ الاحتياطي (Safety Guard)**:
   - إذا كانت قاعدة البيانات المحلية فارغة، يرفض محرك المزامنة الكتابة فوق نسخة Supabase الاحتياطية ببيانات فارغة، وبدلاً من ذلك يطلق الاسترجاع العكسي فوراً.

### لتفعيل الاسترداد التلقائي:
أضف المتغير البيئي التالي في لوحة تحكم Render:
- **Key**: `SUPABASE_DATABASE_URL`
- **Value**: رابط الاتصال بـ Supabase (`postgres://postgres.xxxx:password@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`)

### فحص حالة الاسترداد التلقائي:
```
https://<your-render-url>/api/backup/status
```
ستجد:
```json
{
  "auto_recovery_enabled": true,
  "auto_recovery_source": "Supabase PostgreSQL (Automatic)"
}
```


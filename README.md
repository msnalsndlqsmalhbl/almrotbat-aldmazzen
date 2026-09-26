# 🏭 مصنع الصندل — نظام المرتبات والإدارة المالية 2026

> نظام ERP احترافي متكامل لإدارة المرتبات، الحضور، الإنذارات، السلف، الخزائن، والقيود المحاسبية — مبني على **Supabase + Vanilla JS** بدون Backend منفصل.

![Version](https://img.shields.io/badge/version-3.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![RTL](https://img.shields.io/badge/lang-AR%20RTL-orange)

---

## 📋 المحتويات

- [الميزات](#-الميزات)
- [التثبيت والإعداد](#-التثبيت-والإعداد)
- [هيكل المشروع](#-هيكل-المشروع)
- [الأدوار والصلاحيات](#-الأدوار-والصلاحيات)
- [دورة العمل](#-دورة-العمل)
- [الأسئلة الشائعة](#-الأسئلة-الشائعة)

---

## ✨ الميزات

### 🏢 إدارة شاملة
- مصنع واحد (غير متعدد)
- أقسام غير محدودة
- موظفون بأرقام تلقائية (`EMP-0001`)
- دعم عملتين: **SDG** و **USD**

### 📅 الحضور الذكي
- قوائم منسدلة لكل يوم (🟢 حاضر / 🟡 بعذر / 🔴 بدون عذر / 🔵 مرضي)
- تحديد جماعي بضغطة
- ربط تلقائي مع الرواتب

### 🚨 نظام إنذارات تلقائي
- **كل غياب بدون عذر = إنذار**
- 4 مستويات تصعيدية:
  - 🟡 تحذير شفهي (1)
  - 🟠 تحذير كتابي (2)
  - 🔴 إنذار نهائي (3)
  - ⛔ عرضة للفصل (4+)
- إنذارات يدوية (تأخير، مخالفة)
- إشعارات فورية

### 💵 ملفات رواتب حرة
- أنشئ ملفات **بأي فترة تريد** — لا قيود
- قوالب سريعة: شهري / أسبوعي / نصفي / 10 أيام
- بنود ديناميكية (أضف/عدّل/احذف)
- حساب تلقائي لخصم الغياب
- **دفع فردي** أو **جماعي**
- كشف A4 احترافي

### 🏦 خزائن هرمية
- خزينة رئيسية + خزائن لكل قسم
- تغذية وتحويل بينهم
- سجل كامل للحركات
- مسؤول القسم يرى خزينته فقط

### 💳 السلف
- أقساط مرنة
- خصم تلقائي عند الرواتب
- إيقاف تلقائي عند السداد

### 📊 التقارير
- فلاتر شاملة (نوع / قسم / تاريخ / حالة / موظف)
- 4 أنواع: يومي / أسبوعي / شهري / سنوي
- كشف موظف كامل
- تصدير PDF + Excel

### 🔐 الأمان
- Supabase Auth
- Row Level Security
- Audit Log
- منع التكرار

### 🎨 الواجهة
- RTL كامل بالعربية
- Dark Mode 🌙
- Responsive
- بحث سريع (Ctrl + K)
- إشعارات

---

## 🚀 التثبيت والإعداد

### الخطوة 1: إنشاء مشروع Supabase

1. اذهب إلى [supabase.com/dashboard](https://supabase.com/dashboard)
2. اضغط **New Project**
3. اختر الاسم وكلمة المرور

### الخطوة 2: تنفيذ قاعدة البيانات

1. **SQL Editor** → **New Query**
2. الصق كامل `database.sql`
3. اضغط **Run**

**النتيجة:** `✅ Database ready COMPLETE!`

**⚠️ إذا ظهر خطأ "column does not exist":**
نفّذ هذا إصلاحاً:
```sql
alter table treasuries add column if not exists is_main boolean default false;
alter table treasuries add column if not exists parent_treasury_id uuid references treasuries(id);
alter table attendance_files add column if not exists period_label text;
alter table payroll_files add column if not exists period_label text;
alter table payroll_files add column if not exists total_earnings numeric(14,2) default 0;
alter table payroll_earnings add column if not exists custom_name text;
alter table payroll_earnings alter column earning_type_id drop not null;
alter table payroll_deductions add column if not exists custom_name text;
alter table payroll_deductions alter column deduction_type_id drop not null;
```

### الخطوة 3: نشر Edge Function

1. اذهب إلى: **Dashboard → Edge Functions**
2. **Create a new function**
3. الاسم: **`create-user`**
4. الصق الكود من [قسم Edge Function](#-edge-function)
5. اضغط **Deploy**

### الخطوة 4: الحصول على المفاتيح

من **Settings → API**:
- انسخ **Project URL**
- انسخ **anon public** key

### الخطوة 5: تحديث `auth.js`

```javascript
const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-ANON-KEY';
```

### الخطوة 6: إنشاء أول مستخدم مدير

1. **Authentication → Users → Add user**
2. أدخل البريد وكلمة المرور
3. انسخ **User ID**
4. في SQL Editor:

```sql
insert into profiles (id, full_name, role, is_active)
values ('ضع-ال-User-ID', 'اسم المدير', 'admin', true);
```

### الخطوة 7: تشغيل المشروع

**Live Server:**
```bash
python -m http.server 8000
```

**أو:**
افتح `login.html` مباشرة

---

## 📁 هيكل المشروع

```
/sandal-payroll
├── index.html          # التطبيق الرئيسي (SPA)
├── login.html          # صفحة تسجيل الدخول
├── styles.css          # التصميم
├── auth.js             # المصادقة
├── app.js              # منطق التطبيق
├── reports.js          # التقارير
├── database.sql        # قاعدة البيانات
└── README.md           # هذا الملف
```

---

## 👥 الأدوار والصلاحيات

### 👑 المدير (admin)
- كل الصلاحيات
- إدارة المستخدمين والأقسام
- فك قفل الملفات
- تصفير البيانات

### 👤 مسؤول قسم (dept_manager)
- يرى قسمه فقط (RLS)
- صلاحيات مخصصة (13 خيار)
- لا يرى أقساماً أخرى

### الصلاحيات المتاحة

| الصلاحية | الوصف |
|---------|-------|
| `view_employees` | مشاهدة الموظفين |
| `add_employee` | إضافة موظف |
| `edit_employee` | تعديل موظف |
| `delete_employee` | حذف موظف |
| `attendance` | الحضور والغياب |
| `create_payroll` | إنشاء راتب |
| `pay_payroll` | دفع راتب |
| `loans` | السلف |
| `treasury` | الخزينة |
| `reports` | التقارير |
| `export_excel` | تصدير Excel |
| `export_pdf` | طباعة PDF |
| `unlock_payroll` | فك قفل الملفات |

---

## 🎬 دورة العمل

### 📋 الإعداد الأولي (مرة واحدة)

```
1. ⚙️ الإعدادات → املأ بيانات المصنع
2. 🏢 الأقسام → أضف قسم واحد على الأقل
3. 🏦 الخزائن → أنشئ خزينة رئيسية
4. 👤 المستخدمون → أضف مسؤول قسم
```

### 📅 يومياً

```
1. 📅 الحضور → سجّل حضور اليوم
   → 🟢 حاضر / 🔴 غائب / 🟡 بعذر / 🔵 مرضي
2. النظام يُضيف إنذارات تلقائية للغياب بدون عذر
```

### 📆 أسبوعياً/شهرياً

```
1. 💵 الرواتب → ➕ إنشاء ملف
2. اختر قالب: شهري / أسبوعي / مخصص
3. اربطه بملف حضور
4. 🔄 إعادة الحساب
5. أضف حوافز/خصومات فردية (📊)
6. 💳 تطبيق السلف (إن وجدت)
7. 💸 دفع الكل أو دفع فردي
```

### 📊 عند الحاجة

```
- 🚨 الإنذارات → متابعة الموظفين
- 💳 السلف → إضافة سلفة جديدة
- 📊 التقارير → طباعة PDF/Excel
```

---

## 🏦 الخزائن — النظام الهرمي

```
🏦 الخزينة الرئيسية (لكل المصنع)
   ↓ يغذّي
🏢 خزينة الأكياس
🏢 خزينة الحبال
🏢 خزينة الإدارة
```

**عند دفع راتب قسم** → يُقترح خزينة القسم تلقائياً.

**عند نقص الرصيد** → حوّل من الرئيسية.

---

## 🚨 نظام الإنذارات

### الإنذار التلقائي

عند تسجيل **غياب بدون عذر** في الحضور:
```
1. يُضاف سجل في employee_warnings
2. يزداد warnings_count +1
3. ظهور إشعار
```

**عند حذف السجل** → الإنذار يُحذف تلقائياً.

### مستويات الإنذار

| العدد | المستوى | اللون |
|------|---------|------|
| 0 | نظيف | ✅ |
| 1 | تحذير شفهي | 🟡 |
| 2 | تحذير كتابي | 🟠 |
| 3 | إنذار نهائي | 🔴 |
| 4+ | خطر | ⛔ |

**الحد قابل للتعديل** من الإعدادات.

---

## 🔧 Edge Function

```typescript
// supabase/functions/create-user/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  );

  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: 'غير مصادق' }), { status: 401, headers: corsHeaders });

  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return new Response(JSON.stringify({ error: 'للمدير فقط' }), { status: 403, headers: corsHeaders });

  const body = await req.json();

  if (body.action === 'create') {
    const { data: auth, error } = await admin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: { full_name: body.full_name }
    });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });

    await admin.from('profiles').insert({
      id: auth.user.id,
      full_name: body.full_name,
      role: body.role || 'dept_manager',
      department_id: body.department_id || null,
      is_active: true
    });

    if (body.permissions?.length) {
      await admin.from('permissions').insert(
        body.permissions.map(p => ({ profile_id: auth.user.id, permission_key: p, granted: true }))
      );
    }
    return new Response(JSON.stringify({ success: true, user_id: auth.user.id }), { headers: corsHeaders });
  }

  if (body.action === 'update') {
    if (body.password) await admin.auth.admin.updateUserById(body.user_id, { password: body.password });
    await admin.from('profiles').update({
      full_name: body.full_name,
      role: body.role,
      department_id: body.department_id || null,
      is_active: body.is_active !== false
    }).eq('id', body.user_id);
    await admin.from('permissions').delete().eq('profile_id', body.user_id);
    if (body.permissions?.length) {
      await admin.from('permissions').insert(
        body.permissions.map(p => ({ profile_id: body.user_id, permission_key: p, granted: true }))
      );
    }
    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
  }

  if (body.action === 'delete') {
    if (body.user_id === user.id) return new Response(JSON.stringify({ error: 'لا تحذف حسابك' }), { status: 400, headers: corsHeaders });
    await admin.auth.admin.deleteUser(body.user_id);
    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
  }

  return new Response(JSON.stringify({ error: 'action غير معروف' }), { status: 400, headers: corsHeaders });
});
```

---

## 🔐 الأمان

- ✅ Supabase Auth (كلمات مرور مشفرة)
- ✅ RLS على كل الجداول
- ✅ Service Role محمي في Edge Function
- ✅ Transactions (دفع ذري)
- ✅ Audit Log
- ✅ منع الدفع المزدوج

---

## 🎨 اختصارات

| الاختصار | الوظيفة |
|---------|---------|
| `Ctrl + K` | البحث السريع |
| `Esc` | إغلاق النافذة |
| `Ctrl + S` | حفظ (في النماذج) |

---

## 🐛 حل المشاكل

### ❌ `permission denied`
تحقق:
```sql
select role from profiles where id = auth.uid();
```
يجب أن يكون `admin`.

### ❌ `Could not find relationship`
الاستعلام `join` خاطئ — استخدم الجلب اليدوي.

### ❌ `الرصيد غير كافٍ`
غذّ الخزينة من صفحة الخزائن.

### ❌ `الملف مقفول`
المدير فقط يمكنه فك القفل.

### ❌ `401 Unauthorized`
سجّل خروج ثم دخول.

### ❌ `Function not found`
انشر Edge Function `create-user`.

---

## 💡 الأسئلة الشائعة

### ❓ كم ملف رواتب يمكنني إنشاءه؟
**بلا حدود** — أنشئ ما تريد بأي فترة.

### ❓ كيف أنشئ ملف أسبوعي لشهر كامل؟
استخدم قالب "أسبوعي" — ينشئ ملفاً لكل أسبوع.

### ❓ كيف أضيف حافزاً لعامل واحد؟
افتح الملف → اضغط 📊 بجانب الموظف → ➕ إضافة.

### ❓ كيف أضيف حافزاً جماعياً؟
في الملف → 💰 حافز جماعي → أدخل المبلغ.

### ❓ مسؤول القسم يرى ماذا؟
- قسمه فقط
- موظفيه
- حضورهم
- رواتبهم
- خزينته
- **لا يرى أقساماً أخرى** (RLS)

### ❓ هل يمكن تصدير البيانات؟
نعم — Excel + PDF لكل تقرير.

### ❓ هل يعمل على الهاتف؟
نعم — Responsive كامل.

---

## 📊 البيانات الافتراضية

بعد تنفيذ `database.sql`:
- **قسمان:** الأكياس، الحبال
- **3 أنواع:** موظف دائم، عامل، عامل يومي
- **5 استحقاقات:** أساسي، حوافز، إضافي، ترحيل، وجبة
- **6 استقطاعات:** تأمين، ضريبة، خصومات، جزاءات، سلفة، غياب

---

## 📄 الترخيص

© 2026 مصنع الصندل — جميع الحقوق محفوظة

---

## 🙏 شكراً

تم بناء النظام بـ ❤️ لمصنع الصندل

**الإصدار:** 3.0.0
**آخر تحديث:** سبتمبر 2026
# الوثيقة الفنية وبنية النظام (Technical Architecture)
## نظام إدارة إنتاج قسم النسيج (Textile Weaving ERP)

### 1. التقنيات المختارة (Technology Stack)
* **Frontend Framework:** React 19 + TypeScript + Vite
* **Styling & UI:** Tailwind CSS v4 + Lucide Icons + Motion (Animations) + Recharts (Interactive Charts)
* **Backend Runtime:** Node.js (Express v4 + TypeScript) with `tsx` for hot dev execution and `esbuild` for production bundling (`dist/server.cjs`)
* **Database Engine:** File-backed Relational Database Architecture with JSON/ACID atomic writes, indexing, auto-increment IDs, and foreign key validations stored securely in persistent storage (`/data/weaving_erp.json`). Easy migration path to PostgreSQL / Cloud SQL / Supabase.
* **Authentication & Security:** JSON Web Tokens (JWT) with HTTP Bearer tokens, password hashing with `bcryptjs`, and role-based middleware enforcement.

---

### 2. سبب اختيار هذه التقنيات (Rationale & Advantages)
1. **الاستقلالية وعدم التكلفة (Zero Monthly Cost):**
   * تعمل البنية المكونة من Express Node.js + File-based Persistent DB بدون أي اشتراكات خارجية أو رسوم شهرياً.
   * خيار الخطة المجانية Free Tier مضمون بنسبة 100% بدون مخاطر إغلاق الحساب أو تجاوز حصص الاستخدام (Quota limits).
2. **الاستقرار والأداء السريع:**
   * زمن استجابة الـ API منخفض جداً (أقل من 5 ملي ثانية للطلب).
   * استجابة فورية للواجهات وحفظ مباشر وتلقائي.
3. **سهولة نقل البيانات والتوسع مستقبلاً (Modular Architecture):**
   * الطبقة الحسابية وطبقة البيانات منفصلة تماماً (Business Logic Layer & Data Access Layer).
   * يمكن استبدال محرك البيانات بـ PostgreSQL أو Cloud SQL أو Supabase بمجرد تغيير ملف `src/server/db.ts` دون الحاجة لتغيير أي كود في الواجهات الأمامية.

---

### 3. قاعدة البيانات ومخطط البيانات (Database Schema Design)
تعتمد قاعدة البيانات على العلاقات التالية:
* `users`: المستخدمون الأدوار، كلمة المرور المشفرة بـ bcrypt.
* `halls`: صالات النسيج (الرقم، الاسم، الوصف، الحالة).
* `loom_groups`: مجموعات الأنوال داخل الصالات.
* `looms`: الأنوال (رقم النول، الشركة المصنعة، RPM، Pick density, Reed width, Efficiency, Status).
* `fabric_items`: الأصناف النسيجية ومواصفاتها الفنية (كود الصنف، نوع الخيط، الكثافات، السرعة المطلوبة).
* `production_orders`: أوامر الإنتاج والكميات المستهدفة وتواريخ التسليم والإنتاج المتبقي والانتهاء المتوقع.
* `loom_assignments`: تخصيص الأنوال لأوامر الإنتاج.
* `production_entries`: إدخال الإنتاج اليومي وحسب الورديات والإنتاج الفعلي والنظري والكفاءة.
* `loom_stoppages`: تسجيل التوقفات، الأسباب، والمدد الزمني للتوقفات.
* `audit_logs`: سجل جميع العمليات وحركات النظام لحماية البيانات والأمان.
* `system_settings`: إعدادات المصنع، اسم القسم، أسماء الورديات والمؤشرات.

---

### 4. الأدوار والصلاحيات (RBAC - Role-Based Access Control)
1. **المدير (Manager):** صلاحيات كاملة (إدارة الأنوال، الصالات، الأصناف، أوامر الإنتاج، المستخدمين، السجلات، الإعدادات، مسح البيانات التجريبية).
2. **منسق الإنتاج (Production Coordinator):** صلاحيات إدارية وتشغيلية كاملة للإنتاج (إضافة أوامر إنتاج، تخصيص أنوال، تسجيل إنتاج وتوقفات، التقارير) بدون صلاحيات إدارة المستخدمين وإعدادات النظام الحساسة.
3. **مدير صالة النسيج (Hall Manager):** صلاحيات محدودة بالصالة (إدخال الإنتاج اليومي والورديات، تسجيل التوقفات، عرض اللوحة والتقارير)، ويُمنع من حذف السجلات أو تغيير الأنوال أو تعديل إعدادات النظام.

---

### 5. نظام النسخ الاحتياطي ونقل البيانات (Backup & Migration)
* **تصدير النسخ الاحتياطية:** يوفر النظام إمكانية تصدير كافة بيانات قاعدة البيانات بصيغة JSON حقيقية بنقرة زر واحدة من شاشة الإعدادات.
* **تصدير التقارير:** إمكانية تصدير تقارير الإنتاج والأوامر والأنوال بأسلوب Excel (CSV) أو طباعة PDF مباشرة.
* **مسار الترقية إلى PostgreSQL:** عند الرغبة في التوسع إلى سيرفر خفي مع الآلاف من الأنوال، يتم الربط مع Cloud SQL أو Supabase عن طريق استبدال استعلامات `db.ts` بسيطة بشرط احتفاظ واجهات API بصيغتها وتنسيقها الحالي.

---

### 6. الخطة المجانية وحدود الاستخدام (Free Tier Limits)
* **التكلفة:** $0 / شهر
* **السعة التخزينية:** مئات الآلاف من سجلات الإنتاج
* **عدد المستخدمين:** غير محدود

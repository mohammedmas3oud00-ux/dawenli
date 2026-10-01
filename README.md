# دوّنلي (Dawenli) — تطبيق أندرويد للإنتاجية الشخصية والعبادات

تطبيق أندرويد متكامل مبني بلغة **Kotlin** وأحدث تقنيات **Jetpack Compose** و**Material Design 3**، مصمم لإدارة ركائز الحياة والرؤى وأهداف القيمة والمشاريع والمهام مع حساب تلقائي صاعد لنسب الإنجاز، بالإضافة إلى منظومة العبادات والأوراد وجلسات التركيز والعادات اليومية.

---

## 🏗️ الهيكلية المعمارية (Architecture)

تمت إعادة كتابة المشروع بالكامل كـ تطبيق أندرويد حديث وفق نمط **MVVM + Clean Architecture**:

- **طبقة البيانات (Data Layer)**:
  - `data/model/Entities.kt`: كائنات وقواعد بيانات Room لجميع الكيانات (الركائز، الرؤى، أهداف القيمة، المشاريع، المهام، العبادات، سجلات الصلاة، العادات، المراجعات، جلسات التركيز، صندوق الوارد).
  - `data/local/DawenliDao.kt`: واجهات DAO مع استعلامات تفاعلية باستخدام `Flow<List<T>>`.
  - `data/local/DawenliDatabase.kt`: قاعدة بيانات Room محلية (`RoomDatabase`) بدون اتصال إنترنت إجباري وبأعلى سرعة وكفاءة.
  - `data/repository/DawenliRepository.kt`: مستودع البيانات المركزي مع تطبيق خوارزمية الحساب الهرمي الصاعد (Recalculate All Hierarchical Progress) والبيانات الافتراضية الأولية (Seed Data).

- **طبقة العرض والواجهات (Presentation Layer - Jetpack Compose)**:
  - `ui/DawenliViewModel.kt`: إدارة الحالة التفاعلية عبر `StateFlow` ومؤقتات جلسة التركيز وإدارة العادات والمواقيت.
  - `ui/screens/DashboardScreen.kt`: لوحة التحكم الرئيسية، شريط مواقيت الصلاة، بطاقة المهمة الأنسب الآن (Spotlight Task)، نظرة عامة على ركائز الحياة، وعادات اليوم.
  - `ui/screens/HierarchyScreen.kt`: الشجرة التفاعلية للهيكل الهرمي (ركائز ← رؤى ← أهداف قيمة ← مشاريع ← مهام) مع متابعة النسب الصاعدة.
  - `ui/screens/IbadatScreen.kt`: منظومة العبادات الكاملة (الصلوات الخمس بأدائها وجماعتها، ورد القرآن والختمة، أذكار الصباح والمساء، قيام الليل، وسنن الرواتب).
  - `ui/screens/TasksScreen.kt`: إدارة وتصفية المهام حسب الأولوية وحالة الإنجاز ومستوى الطاقة.
  - `ui/screens/HabitsScreen.kt`: متابعة العادات مع عداد الشعلة (Streak) وأوقات اليوم.
  - `ui/screens/FocusSessionScreen.kt`: مؤقت بومودورو وتركيز عميق تفاعلي مع عداد المشتتات وربط المهام.
  - `ui/screens/ReviewsScreen.kt`: نظام المراجعات الدورية (الأسبوعية والشهرية) ومؤشر صحة المنظومة.
  - `ui/screens/InboxScreen.kt`: صندوق الأفكار السريع (GTD Inbox) مع ميزة التحويل المباشر لمهام.

- **التصميم والهوية (Design & Theme)**:
  - `ui/theme/`: ألوان مستوحاة من الطابع الإسلامي الراقي (الأخضر الزمردي `#174235`، لمسات الذهب `#D4AF37`، والرمادي الرملي) مع دعم كامل للوضع الليلي (Dark Mode) والـ Dynamic Color.
  - أيقونة تكيفية مخصصة (Custom Adaptive App Icon) بدقة عالية ودعم لجميع الكثافات الشاشية (`mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi`).
  - دعم كامل للغة العربية واتجاه اليمين لليسار (`LayoutDirection.Rtl`).

---

## 📱 إعداد وتشغيل مشروع الأندرويد

- **إصدار Gradle**: `9.3.1` (Kotlin DSL)
- **إصدار Android Gradle Plugin (AGP)**: `9.1.1`
- **إصدار Kotlin**: `2.1.0`
- **إصدار Room**: `2.6.1` عبر محرك KSP
- **Target SDK**: `36` (Android 15+)
- **Min SDK**: `26` (Android 8.0+)
- **معرف التطبيق (Application ID)**: `com.aistudio.dawenli.kxmpzq`

### الفتح في Android Studio:
1. افتح المجلد الجذر في **Android Studio Ladybug / Meerkat** أو أي إصدار حديث يدعم Gradle 9 وJDK 21.
2. سيقوم Android Studio بمزامنة ملفات Gradle تلقائيًا من خلال كتالوج الإصدارات `gradle/libs.versions.toml`.
3. اضغط على **Run 'app'** لتشغيل التطبيق على المحاكي أو جهازك الحقيقي.

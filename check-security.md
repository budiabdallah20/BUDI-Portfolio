🛡️ Ultimate Security & Infrastructure Checklist

قائمة التحقق الأمني والبنية التحتية الشاملة لكافة المشاريع.
تم تصميم هذه القائمة لتغطية كل الطبقات: ال

شبكات، الهوية، الثغرات البرمجية والمخفية، قدرة التحمل، وتشفير البيانات لضمان أقصى درجات الأمان والاعتمادية.

📋 جدول المحتويات

شبكة الاتصال والبنية التحتية (Network & Cloud Infrastructure)

إدارة الهوية والتحكم في الوصول (Authentication & Access Control)

حماية التطبيق والأمان البرمجي (Application & Web Vulnerabilities)

قدرة التحمل والأداء للضغط العالي (Scalability & High Availability)

رأس الهيدر وتشفير البيانات (Headers, Transport & Storage Security)

السجلات والتتبع والمراقبة (Logging, Monitoring & Auditing)

النسخ الاحتياطي وإدارة الطوارئ (Backup & Disaster Recovery)

1. شبكة الاتصال والبنية التحتية (Network & Cloud Infrastructure)

[ ] حماية DDoS والطبقات التوزيعية:

[ ] تفعيل CDN/DDoS Protection مثل Cloudflare أو AWS Shield أو Fastly أمام السيرفر الرئيسي.

[ ] ضبط حظر تلقائي للطلبات التي تتجاوز السلوك الطبيعي (Behavioral Rate Limiting).

[ ] جدار الحماية والتوجيه (WAF & Firewall):

[ ] إغلاق كافة المنافذ (Ports) باستثناء Port 80 / Port 443 واستخدام SSH على ميناء غير افتراضي.

[ ] منع الوصول المباشر للسيرفر عبر IP (حظر الطلبات القادمة مباشرة دون المرور عبر الـ CDN).

[ ] تفعيل WAF وتحديث القواعد التشغيلية (OWASP Core Rule Set).

[ ] الوصول للـ Infrastructure:

[ ] إيقاف تسجيل الدخول لـ SSH بواسطة كلمة المرور وتفعيل المفاتيح الشفرية (SSH Key Pairs with Passphrase).

[ ] ربط لوحة التحكم / SSH بـ VPN داخلي أو WireGuard وتفعيل التحقق الثنائي (2FA).

2. إدارة الهوية والتحكم في الوصول (Authentication & Access Control)

[ ] إدارة كلمات المرور والتشفير:

[ ] تشفير كلمات المرور باستخدام خوارزميات بطيئة ومتينة مثل Argon2id أو bcrypt (مع Work Factor لا يقل عن 12).

[ ] تطبيق سياسة التعقيد والمنع القائم على التسريبات (فحص عبر HaveIBeenPwned API عند إنشاء/تغيير كلمة السر).

[ ] الجلسات والرموز (Sessions & JWT):

[ ] تخزين الـ Tokens/Sessions في Cookies مزودة بـ HttpOnly, Secure, SameSite=Strict (أو Lax) لمنع سرقتها عبر XSS.

[ ] تحديد عمر زمني قصير للـ Access Token (مثل 15 دقيقة) وتدوير الـ Refresh Token مع التقاط محاولات إعادة الاستخدام (Token Reuse Detection).

[ ] إبطال كافة الجلسات النشطة للمستخدم فور تغيير كلمة المرور أو البريد الإلكتروني.

[ ] الصلاحيات والأذونات (Authorization):

[ ] الاعتماد على مبدأ أقل الصلاحيات (Principle of Least Privilege) لكل دور في النظام.

[ ] حماية تطبيقات الـ API ضد ثغرات BOLA / IDOR عبر التحقق من ملكية المصدر (Resource Ownership) في كل طلب (مثال: التأكد أن المستخدم A يملك الملف 123 قبل إرجاعه).

3. حماية التطبيق والأمان البرمجي (Application & Web Vulnerabilities)

[ ] تغطية ثغرات OWASP Top 10 الرئيسية:

[ ] Injection (SQLi, NoSQLi, Command Injection): استخدام Parameterized Queries / ORM نقي بدون بناء الاستعلامات عبر تجميع النصوص (String Concatenation).

[ ] XSS (Cross-Site Scripting): تعقيم كافة المخرجات (Sanitization) وتفعيل Content-Security-Policy (CSP) صارم يمنع unsafe-inline و eval.

[ ] CSRF (Cross-Site Request Forgery): تفعيل CSRF Tokens لكافة الطلبات المتبادلة أو الاعتماد على SameSite Cookies للـ REST APIs.

[ ] SSRF (Server-Side Request Forgery): حظر السيرفر من إرسال طلبات لشبكات الـ Internal / Localhost (مثل 127.0.0.1 أو 169.254.169.254 الخاص بـ AWS Metadata).

[ ] XXE (XML External Entity): تعطيل DTDs والكيانات الخارجية عند معالجة ملفات XML/SVG.

[ ] Path Traversal: منع القراءة المباشرة للملفات بناءً على مدخلات المستخدم من خلال تنظيف المسارات وعزل المجلدات.

[ ] منطق العمل والثغرات الخفية (Business Logic & Race Conditions):

[ ] منع Race Conditions (خاصة في عمليات الدفع والتحويل والرصيد) باستخدام Mutex, Database Transactions, أو Optimistic Locking.

[ ] منع Parameter Pollution و Mass Assignment (تحديد الحقول المسموح تعديلها فقط القائمة البيضاء Whitelist في الـ DTO/Payload).

[ ] حماية استعادة كلمة المرور والتأكيد من ثغرات Host Header Injection و HTTP Response Splitting.

4. قدرة التحمل والأداء للضغط العالي (Scalability & High Availability)

[ ] توزيع الأحمال والـ Caching:

[ ] وضع Load Balancer (مثل NGINX أو HAProxy أو AWS ALB) مع Health Checks دورية.

[ ] إستراتيجية Caching متكاملة: Redis/Memcached للبيانات الاستعلامية الشائعة والجلسات، و CDN للملفات الثابتة.

[ ] قواعد البيانات (Database Optimization):

[ ] إعداد Connection Pooling لمنع انهيار قاعدة البيانات عند الضغط التزامني العالي.

[ ] إنشاء Master-Replica Architecture لتوزيع استعلامات القراءة (Read Replicas) بعيداً عن الكتابة.

[ ] وجود الفهارس والمؤشرات المناسبة (Indexes) للـ Tables الأساسية لتفادي Full Table Scans.

[ ] إدارة الطلبات والـ Queues:

[ ] استخدام Asynchronous Background Jobs (مثل RabbitMQ / BullMQ / Kafka) للعمليات الثقيلة (إرسال الإيميلات، معالجة الصور، توليد PDF).

[ ] تطبيق Rate Limiting / Throttling على مستوى الـ IP والـ User ID لمنع استهلاك الموارد المفرط (DoS/Brute Force).

5. رأس الهيدر وتشفير البيانات (Headers, Transport & Storage Security)

[ ] تشفير البيانات (Encryption):

[ ] In-Transit: فرض TLS 1.3 (أو TLS 1.2 كأقل حد) وتفعيل HSTS (HTTP Strict Transport Security).

[ ] At-Rest: تشفير قاعدة البيانات والتخزين السحابي (S3 Buckets) باستخدام AES-256 مع إدارة آمنة للمفاتيح (KMS).

[ ] ترويسات الأمان (Security Headers):

[ ] Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

[ ] Content-Security-Policy: default-src 'self'; ...

[ ] X-Frame-Options: DENY أو SAMEORIGIN (لمنع Clickjacking).

[ ] X-Content-Type-Options: nosniff

[ ] Referrer-Policy: strict-origin-when-cross-origin

[ ] Permissions-Policy: camera=(), microphone=(), geolocation=()

6. السجلات والتتبع والمراقبة (Logging, Monitoring & Auditing)

[ ] السجلات المركزية (Centralized Logging):

[ ] تجميع اللوجز في بيئة معزولة (مثل ELK Stack أو Datadog أو Grafana Loki).

[ ] إزالة وتشفير البيانات الحساسة (PII, Passwords, Credit Cards) قبل كتابتها في السجلات (Log Sanitization).

[ ] المراقبة والإنذار المبكر (Alerting & SIEM):

[ ] إعداد تنبيهات فورية (Slack/PagerDuty) عند ارتفاع معدلات خطأ HTTP 5xx أو فشل تسجيل الدخول المتكرر.

[ ] تسجيل جميع العمليات الإدارية وتغييرات الصلاحيات في Audit Logs غير قابلة للتعديل (Append-Only).

7. النسخ الاحتياطي وإدارة الطوارئ (Backup & Disaster Recovery)

[ ] النسخ الاحتياطي التلقائي:

[ ] نسخ احتياطي يومي وأسبوعي لقواعد البيانات والمستندات المخزنة.

[ ] تطبيق قاعدة 3-2-1 للنسخ الاحتياطي (3 نسخ، على وسيطين مختلفين، ونسخة خارجية Off-site).

[ ] اختبار الاستعادة (Disaster Recovery Plan):

[ ] تشفير النسخ الاحتياطية وإجراء اختبار دوري لعملية الاستعادة (Restoration Test) لضمان سلامتها وعدم تلف البيانات.
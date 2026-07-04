# 🏠 House Price Prediction — AI Web App

تطبيق ويب كامل للتنبؤ بأسعار المنازل باستخدام نموذج **Machine Learning (Lasso Regression)** مبني بـ **Flask**، مع واجهة مستخدم حديثة **Glassmorphism** متجاوبة بالكامل مع جميع الأجهزة.

![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python)
![Flask](https://img.shields.io/badge/Flask-3.0-black?logo=flask)
![scikit-learn](https://img.shields.io/badge/scikit--learn-1.6-orange?logo=scikitlearn)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ المميزات

- 🎨 واجهة **Glassmorphism** عصرية مع خلفية متحركة وأنيميشن سلس
- 📱 تصميم **Responsive** بالكامل (موبايل / تابلت / ديسكتوب)
- ⚡ تنبؤ فوري عبر **API** بدون إعادة تحميل الصفحة (Fetch / AJAX)
- ✅ تحقق من صحة البيانات على مستوى الواجهة (Client) والخادم (Server)
- 🔒 معالجة أخطاء شاملة مع رسائل واضحة بالعربية
- 🚀 جاهز للنشر مباشرة على **Render** أو أي منصة تدعم Flask/Gunicorn

---

## 🗂️ هيكل المشروع

```
house-price-prediction/
├── app.py                 # تطبيق Flask الرئيسي (Backend + API)
├── requirements.txt        # المكتبات المطلوبة
├── Procfile                # أمر التشغيل لمنصة Render
├── render.yaml              # إعدادات النشر التلقائي على Render
├── runtime.txt              # إصدار Python المستخدم
├── .gitignore
├── README.md
├── model/
│   ├── model.pkl            # نموذج Lasso Regression المدرّب
│   ├── scaler.pkl           # StandardScaler لتحجيم عمود Area
│   ├── encoders.pkl         # LabelEncoders للأعمدة الفئوية
│   └── columns.pkl          # ترتيب الأعمدة المستخدمة في التدريب
├── templates/
│   └── index.html           # واجهة المستخدم (Jinja2)
└── static/
    ├── css/
    │   └── style.css        # تنسيقات Glassmorphism + Animations
    ├── js/
    │   └── script.js        # منطق الواجهة والتواصل مع API
    └── images/
```

---

## 🧠 عن النموذج

النموذج مدرّب للتنبؤ بسعر المنزل بناءً على الخصائص التالية:

| الحقل        | الوصف                                   | النوع        |
|--------------|------------------------------------------|--------------|
| `Area`       | المساحة (قدم مربع)                        | رقمي (يُحجَّم عبر Scaler) |
| `Bedrooms`   | عدد غرف النوم                             | رقمي         |
| `Bathrooms`  | عدد الحمامات                              | رقمي         |
| `Floors`     | عدد الطوابق                               | رقمي         |
| `YearBuilt`  | سنة بناء العقار                           | رقمي         |
| `Location`   | الموقع (Downtown / Suburban / Urban / Rural) | فئوي (Label Encoding) |
| `Condition`  | حالة العقار (Excellent / Good / Fair / Poor) | فئوي (Label Encoding) |
| `Garage`     | يوجد جراج (Yes / No)                      | فئوي (Label Encoding) |

عند إرسال الطلب، يقوم `app.py` بـ:
1. التحقق من صحة جميع الحقول.
2. ترميز الحقول الفئوية باستخدام `encoders.pkl`.
3. تحجيم عمود `Area` باستخدام `scaler.pkl`.
4. ترتيب الميزات بنفس الترتيب المحفوظ في `columns.pkl`.
5. تمرير المتجه النهائي إلى `model.pkl` للحصول على السعر المتوقع.

---

## ⚙️ التشغيل محليًا

### 1. استنساخ المشروع
```bash
git clone https://github.com/YOUR_USERNAME/house-price-prediction.git
cd house-price-prediction
```

### 2. إنشاء بيئة افتراضية (اختياري لكن موصى به)
```bash
python -m venv venv
source venv/bin/activate      # على Linux/Mac
venv\Scripts\activate         # على Windows
```

### 3. تثبيت المتطلبات
```bash
pip install -r requirements.txt
```

### 4. تشغيل التطبيق
```bash
python app.py
```

ثم افتح المتصفح على: [http://localhost:5000](http://localhost:5000)

---

## 🚀 النشر على Render

### الطريقة الأولى: النشر التلقائي عبر `render.yaml`
1. ارفع المشروع على GitHub.
2. من لوحة تحكم [Render](https://render.com)، اختر **New → Blueprint**.
3. اربط المستودع (Repository)، وسيتم اكتشاف `render.yaml` تلقائيًا.
4. اضغط **Apply** وانتظر انتهاء عملية البناء والنشر.

### الطريقة الثانية: يدويًا
1. من Render اختر **New → Web Service**.
2. اربط مستودع GitHub الخاص بك.
3. اضبط الإعدادات:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app`
   - **Environment:** `Python 3`
4. اضغط **Create Web Service**.

---

## 🔌 واجهة برمجة التطبيقات (API)

### `GET /api/options`
يعيد الخيارات المتاحة للحقول الفئوية.

```json
{
  "success": true,
  "options": {
    "Location": ["Downtown", "Rural", "Suburban", "Urban"],
    "Condition": ["Excellent", "Fair", "Good", "Poor"],
    "Garage": ["No", "Yes"]
  }
}
```

### `POST /api/predict`
يستقبل بيانات العقار ويعيد السعر المتوقع.

**Request Body:**
```json
{
  "Area": 2500,
  "Bedrooms": 3,
  "Bathrooms": 2,
  "Floors": 1,
  "YearBuilt": 2015,
  "Location": "Urban",
  "Condition": "Good",
  "Garage": "Yes"
}
```

**Response (نجاح):**
```json
{
  "success": true,
  "prediction": 536183.7,
  "formatted_price": "$536,183.70"
}
```

**Response (فشل):**
```json
{
  "success": false,
  "errors": ["الحقل 'Area' مطلوب."]
}
```

---

## 🛠️ التقنيات المستخدمة

- **Backend:** Flask, scikit-learn, joblib, NumPy
- **Frontend:** HTML5, CSS3 (Glassmorphism + Animations), Vanilla JavaScript
- **Deployment:** Gunicorn, Render

---

## 📄 الترخيص

هذا المشروع مرخّص تحت رخصة MIT — يمكنك استخدامه وتعديله بحرية.

---

## 🙋 المساهمة

المساهمات مرحّب بها! لا تتردد في فتح Issue أو Pull Request.

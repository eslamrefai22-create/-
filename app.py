"""
House Price Prediction - Flask Backend
========================================
يحمّل النموذج المدرّب (Lasso Regression) مع الـ Scaler والـ Encoders
ويوفر واجهة API للتنبؤ بسعر المنزل بناءً على خصائصه.
"""

import os
import joblib
import numpy as np
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# ---------------------------------------------------------------------------
# تحميل الملفات المدرّبة (Model / Scaler / Encoders / Columns)
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "model")

model = joblib.load(os.path.join(MODEL_DIR, "model.pkl"))
scaler = joblib.load(os.path.join(MODEL_DIR, "scaler.pkl"))
encoders = joblib.load(os.path.join(MODEL_DIR, "encoders.pkl"))
columns = joblib.load(os.path.join(MODEL_DIR, "columns.pkl"))

# الأعمدة المستخدمة فعليًا كمدخلات (بدون عمود الهدف "Price")
FEATURE_COLUMNS = [c for c in columns if c != "Price"]

# الأعمدة الفئوية التي تحتاج ترميز (Label Encoding)
CATEGORICAL_COLUMNS = list(encoders.keys())

# العمود الرقمي الذي يحتاج تحجيم (Scaling) - نفس الأعمدة التي دُرِّب عليها الـ Scaler
SCALED_COLUMNS = list(getattr(scaler, "feature_names_in_", ["Area"]))


def build_options():
    """يبني قاموس الخيارات المتاحة لكل حقل فئوي (لعرضها في الواجهة)."""
    options = {}
    for col, enc in encoders.items():
        options[col] = list(enc.classes_)
    return options


CATEGORY_OPTIONS = build_options()


def validate_and_prepare(payload: dict):
    """
    يتحقق من صحة البيانات المُرسلة من الواجهة، ثم يجهزها كمصفوفة
    بنفس ترتيب الأعمدة التي تدرب عليها النموذج.
    """
    errors = []
    row = {}

    numeric_fields = {
        "Area": (float, 1, 1_000_000),
        "Bedrooms": (int, 0, 50),
        "Bathrooms": (int, 0, 50),
        "Floors": (int, 0, 20),
        "YearBuilt": (int, 1800, 2100),
    }

    # التحقق من الحقول الرقمية
    for field, (cast, min_v, max_v) in numeric_fields.items():
        raw = payload.get(field, None)
        if raw is None or str(raw).strip() == "":
            errors.append(f"الحقل '{field}' مطلوب.")
            continue
        try:
            value = cast(raw)
        except (ValueError, TypeError):
            errors.append(f"قيمة '{field}' غير صالحة.")
            continue
        if value < min_v or value > max_v:
            errors.append(f"قيمة '{field}' يجب أن تكون بين {min_v} و {max_v}.")
            continue
        row[field] = value

    # التحقق من الحقول الفئوية
    for field in CATEGORICAL_COLUMNS:
        raw = payload.get(field, None)
        if raw is None or str(raw).strip() == "":
            errors.append(f"الحقل '{field}' مطلوب.")
            continue
        valid_values = CATEGORY_OPTIONS.get(field, [])
        if raw not in valid_values:
            errors.append(
                f"قيمة '{field}' غير صحيحة. القيم المسموحة: {', '.join(valid_values)}"
            )
            continue
        row[field] = raw

    if errors:
        return None, errors

    # ترميز الأعمدة الفئوية
    for field in CATEGORICAL_COLUMNS:
        enc = encoders[field]
        row[field] = int(enc.transform([row[field]])[0])

    # تحجيم الأعمدة الرقمية المطلوبة فقط (مثل Area)
    scaled_values = scaler.transform([[row[c] for c in SCALED_COLUMNS]])[0]
    for i, col in enumerate(SCALED_COLUMNS):
        row[col] = scaled_values[i]

    # بناء المصفوفة النهائية بنفس ترتيب أعمدة النموذج
    final_vector = [row[c] for c in FEATURE_COLUMNS]
    return np.array(final_vector).reshape(1, -1), None


@app.route("/")
def index():
    return render_template("index.html", options=CATEGORY_OPTIONS)


@app.route("/api/options", methods=["GET"])
def api_options():
    return jsonify({"success": True, "options": CATEGORY_OPTIONS})


@app.route("/api/predict", methods=["POST"])
def api_predict():
    try:
        payload = request.get_json(force=True, silent=True) or {}
        X, errors = validate_and_prepare(payload)

        if errors:
            return jsonify({"success": False, "errors": errors}), 400

        prediction = model.predict(X)[0]
        prediction = float(max(prediction, 0))

        return jsonify(
            {
                "success": True,
                "prediction": round(prediction, 2),
                "formatted_price": f"${prediction:,.2f}",
            }
        )

    except Exception as exc:  # noqa: BLE001
        return jsonify({"success": False, "errors": [f"حدث خطأ غير متوقع: {exc}"]}), 500


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug_mode = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug_mode)

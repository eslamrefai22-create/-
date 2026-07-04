/* ==========================================================================
   House Price Predictor — Frontend Logic
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("predict-form");
    const predictBtn = document.getElementById("predict-btn");
    const resetBtn = document.getElementById("reset-btn");

    const placeholder = document.getElementById("result-placeholder");
    const resultContent = document.getElementById("result-content");
    const resultError = document.getElementById("result-error");

    const resultPrice = document.getElementById("result-price");
    const resultSummary = document.getElementById("result-summary");
    const errorList = document.getElementById("error-list");
    const toast = document.getElementById("toast");

    const FIELDS = [
        "Area",
        "Bedrooms",
        "Bathrooms",
        "Floors",
        "YearBuilt",
        "Location",
        "Condition",
        "Garage",
    ];

    const FIELD_LABELS = {
        Area: "المساحة",
        Bedrooms: "غرف النوم",
        Bathrooms: "الحمامات",
        Floors: "الطوابق",
        YearBuilt: "سنة البناء",
        Location: "الموقع",
        Condition: "الحالة",
        Garage: "الجراج",
    };

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 3000);
    }

    function clearFieldErrors() {
        FIELDS.forEach((field) => {
            const group = document.getElementById(field)?.closest(".field-group");
            const errEl = document.querySelector(`.error-msg[data-for="${field}"]`);
            if (group) group.classList.remove("has-error");
            if (errEl) errEl.textContent = "";
        });
    }

    function showFieldError(field, message) {
        const group = document.getElementById(field)?.closest(".field-group");
        const errEl = document.querySelector(`.error-msg[data-for="${field}"]`);
        if (group) group.classList.add("has-error");
        if (errEl) errEl.textContent = message;
    }

    function validateClientSide(data) {
        const errors = {};

        if (!data.Area || Number(data.Area) <= 0) {
            errors.Area = "الرجاء إدخال مساحة صحيحة أكبر من صفر.";
        }
        if (data.Bedrooms === "" || Number(data.Bedrooms) < 0) {
            errors.Bedrooms = "الرجاء إدخال عدد غرف صحيح.";
        }
        if (data.Bathrooms === "" || Number(data.Bathrooms) < 0) {
            errors.Bathrooms = "الرجاء إدخال عدد حمامات صحيح.";
        }
        if (data.Floors === "" || Number(data.Floors) < 0) {
            errors.Floors = "الرجاء إدخال عدد طوابق صحيح.";
        }
        if (!data.YearBuilt || Number(data.YearBuilt) < 1800 || Number(data.YearBuilt) > 2100) {
            errors.YearBuilt = "الرجاء إدخال سنة بناء صحيحة.";
        }
        if (!data.Location) {
            errors.Location = "الرجاء اختيار الموقع.";
        }
        if (!data.Condition) {
            errors.Condition = "الرجاء اختيار حالة العقار.";
        }
        if (!data.Garage) {
            errors.Garage = "الرجاء اختيار حالة الجراج.";
        }

        return errors;
    }

    function setLoading(isLoading) {
        if (isLoading) {
            predictBtn.classList.add("loading");
            predictBtn.disabled = true;
        } else {
            predictBtn.classList.remove("loading");
            predictBtn.disabled = false;
        }
    }

    function animateNumber(el, target, duration = 900) {
        const start = 0;
        const startTime = performance.now();

        function step(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = start + (target - start) * eased;
            el.textContent = `$${value.toLocaleString("en-US", {
                maximumFractionDigits: 0,
            })}`;
            if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    function buildSummary(data) {
        resultSummary.innerHTML = "";
        const rows = [
            ["Area", `${data.Area} قدم²`],
            ["Bedrooms", data.Bedrooms],
            ["Bathrooms", data.Bathrooms],
            ["Floors", data.Floors],
            ["YearBuilt", data.YearBuilt],
            ["Location", data.Location],
            ["Condition", data.Condition],
            ["Garage", data.Garage],
        ];
        rows.forEach(([field, value]) => {
            const row = document.createElement("div");
            row.className = "summary-row";
            row.innerHTML = `<span>${FIELD_LABELS[field]}</span><b>${value}</b>`;
            resultSummary.appendChild(row);
        });
    }

    function showResult(prediction, data) {
        placeholder.style.display = "none";
        resultError.style.display = "none";
        resultContent.style.display = "block";

        buildSummary(data);
        animateNumber(resultPrice, prediction);
    }

    function showErrors(errors) {
        placeholder.style.display = "none";
        resultContent.style.display = "none";
        resultError.style.display = "block";

        errorList.innerHTML = "";
        errors.forEach((msg) => {
            const li = document.createElement("li");
            li.textContent = msg;
            errorList.appendChild(li);
        });
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearFieldErrors();

        const formData = new FormData(form);
        const data = {};
        FIELDS.forEach((field) => {
            data[field] = formData.get(field)?.trim() ?? "";
        });

        const clientErrors = validateClientSide(data);
        if (Object.keys(clientErrors).length > 0) {
            Object.entries(clientErrors).forEach(([field, msg]) => showFieldError(field, msg));
            showToast("الرجاء تصحيح الحقول المميزة بالأحمر");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/predict", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                showErrors(result.errors || ["حدث خطأ غير متوقع، حاول مرة أخرى."]);
                showToast("لم يتم التوقع بنجاح");
                return;
            }

            showResult(result.prediction, data);
            showToast("تم التوقع بنجاح ✅");
        } catch (err) {
            showErrors(["تعذر الاتصال بالخادم. تأكد من تشغيل التطبيق وحاول مرة أخرى."]);
            showToast("خطأ في الاتصال بالخادم");
        } finally {
            setLoading(false);
        }
    });

    resetBtn.addEventListener("click", () => {
        form.reset();
        clearFieldErrors();
        resultContent.style.display = "none";
        resultError.style.display = "none";
        placeholder.style.display = "block";
        form.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    // إزالة الخطأ عند الكتابة في الحقل
    FIELDS.forEach((field) => {
        const el = document.getElementById(field);
        if (!el) return;
        el.addEventListener("input", () => {
            const group = el.closest(".field-group");
            const errEl = document.querySelector(`.error-msg[data-for="${field}"]`);
            if (group) group.classList.remove("has-error");
            if (errEl) errEl.textContent = "";
        });
    });
});

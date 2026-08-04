// ==========================================================
//  AI.js - هوش مصنوعی حرفه‌ای نابغه‌کد (نسخه نهایی)
//  قابلیت‌ها: تولید کد، باگ‌یابی، بهینه‌سازی، ترجمه، یادگیری
// ==========================================================

class AI {
    constructor() {
        // ===== پایگاه دانش پایه =====
        this.knowledge = {
            "سلام": "سلام! 👋 من نابغه‌کد هستم. چطور می‌تونم کمکت کنم؟",
            "ساخت سایت": "🌐 برای ساخت سایت:\n1. HTML (ساختار)\n2. CSS (ظاهر)\n3. JS (عملکرد)\n\n📚 با یک صفحه ساده شروع کن.",
            "html": "📄 HTML زبان ساختار صفحات وب.\nتگ‌های اصلی: <html>, <head>, <body>.",
            "css": "🎨 CSS برای استایل‌دهی.\nمثال: body { background: #000; color: #fff; }",
            "javascript": "⚡ JS زبان برنامه‌نویسی وب.\nمفاهیم: متغیرها (let, const)، شرط‌ها (if)، حلقه‌ها (for)، توابع (function)."
        };

        // ===== الگوهای تولید کد =====
        this.codeTemplates = {
            // --- HTML ---
            "صفحه خالی": "<!DOCTYPE html><html><head><title>صفحه من</title></head><body><h1>سلام دنیا!</h1></body></html>",
            "فرم ساده": "<form><label>نام:</label><input type='text'><button>ارسال</button></form>",
            "جدول": "<table><tr><th>نام</th><th>سن</th></tr><tr><td>علی</td><td>۲۵</td></tr></table>",
            "لینک": "<a href='https://example.com'>لینک من</a>",

            // --- CSS ---
            "استایل پایه": "body { font-family: sans-serif; background: #1a1a2e; color: white; text-align: center; }",
            "دکمه زیبا": "button { background: #8b5cf6; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; }",
            "کارت": ".card { background: #0d1117; padding: 20px; border-radius: 16px; border: 1px solid #333; }",

            // --- JavaScript ---
            "تابع ساده": "function sayHello() { console.log('Hello!'); }",
            "حلقه": "for (let i = 0; i < 10; i++) { console.log(i); }",
            "شرط": "if (age > 18) { console.log('بزرگسال'); } else { console.log('نوجوان'); }",
            "آرایه": "const fruits = ['سیب', 'پرتقال', 'موز'];",
            "شیء": "const person = { name: 'علی', age: 25 };",
            "ماشین حساب": `function calculator(a, b, op) {
    switch(op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': return a / b;
        default: return 'عملگر نامعتبر';
    }
}`,
            "لیست کارها": `// یک لیست کار ساده
const todos = [];
function addTodo(task) { todos.push(task); console.log('اضافه شد:', task); }
function removeTodo(index) { todos.splice(index, 1); }
console.log(todos);`
        };

        // ===== الگوهای باگ‌یابی =====
        this.patterns = {
            "missing_semicolon": {
                regex: /(var|let|const)\s+\w+\s*=\s*[^;]+(?:\n|$)/g,
                message: "⚠️ سمیکولن (;) در انتهای خط فراموش شده!",
                fix: (code) => code.replace(/(var|let|const)\s+\w+\s*=\s*[^;]+(?:\n|$)/g, '$1;')
            },
            "unclosed_tag": {
                regex: /<(\w+)[^>]*>[^<]*(?!<\/\1>)/g,
                message: "⚠️ تگ HTML بسته نشده! تگ رو با </...> ببند.",
                fix: (code) => code.replace(/<(\w+)[^>]*>[^<]*(?!<\/\1>)/g, (match, tag) => match + `</${tag}>`)
            },
            "unclosed_brace": {
                regex: /(function\s*\w*\s*\([^)]*\)\s*\{[^}]*)$/g,
                message: "⚠️ آکولاد ({}) بسته نشده! در انتهای تابع } اضافه کن.",
                fix: (code) => code.replace(/(function\s*\w*\s*\([^)]*\)\s*\{[^}]*)$/g, '$1}')
            },
            "console_log": {
                regex: /console\.log\(/g,
                message: "💡 console.log در کد باقی مانده. برای انتشار حذفش کن.",
                fix: null
            }
        };

        // ===== الگوهای بهینه‌سازی =====
        this.optimizations = {
            "use_const": {
                regex: /var\s+(\w+)\s*=\s*([^;]+)(?:\n|$)/g,
                message: "💡 از const به جای var استفاده کن (برای مقادیر ثابت).",
                fix: (code) => code.replace(/var\s+(\w+)\s*=\s*([^;]+)(?:\n|$)/g, 'const $1 = $2;')
            }
        };
    }

    // ===== تفکر و پاسخ‌دهی هوشمند =====
    think(input) {
        const query = input.toLowerCase().trim();
        if (!query) return "🤔 لطفاً یه سوال بپرس.";

        // 1. تشخیص درخواست تولید کد
        if (query.includes("بنویس") || query.includes("تولید کن") || query.includes("کد")) {
            return this.generateCode(query);
        }

        // 2. جستجوی مستقیم در دانش
        for (let key in this.knowledge) {
            if (query.includes(key)) {
                return this.knowledge[key];
            }
        }

        // 3. تحلیل و باگ‌یابی
        if (query.includes("تحلیل") || query.includes("بررسی") || query.includes("باگ")) {
            return this.analyzeCode(document.getElementById('codeEditor').value);
        }

        // 4. بهینه‌سازی
        if (query.includes("بهینه") || query.includes("بهتر")) {
            return this.optimizeCode(document.getElementById('codeEditor').value);
        }

        // 5. ترجمه کد
        if (query.includes("ترجمه") || query.includes("تبدیل")) {
            return "🔄 برای ترجمه کد، لطفاً زبان مبدا و مقصد رو مشخص کن. (مثلاً: 'ترجمه JS به Python')";
        }

        // 6. یادگیری
        if (query.includes("یاد بگیر") || query.includes("یاد بده")) {
            return "🧠 به من یاد بده! جمله‌ات رو با 'یاد بگیر: کلید = پاسخ' بنویس.";
        }

        // 7. پاسخ پیش‌فرض
        return "🤔 متوجه نشدم. لطفاً دقیق‌تر بپرس.\n\n💡 می‌تونی بپرسی:\n- 'یه ماشین حساب بنویس'\n- 'تحلیل کد'\n- 'بهینه‌سازی کد'";
    }

    // ===== تولید کد هوشمند =====
    generateCode(input) {
        const query = input.toLowerCase().trim();

        // جستجوی مستقیم در الگوها
        for (let key in this.codeTemplates) {
            if (query.includes(key)) {
                return `📄 کد ${key}:\n\n\`\`\`\n${this.codeTemplates[key]}\n\`\`\``;
            }
        }

        // تشخیص با کلمات کلیدی
        if (query.includes("ماشین حساب")) {
            return this.generateCode("ماشین حساب");
        }
        if (query.includes("لیست کار") || query.includes("todo")) {
            return this.generateCode("لیست کارها");
        }
        if (query.includes("تابع")) {
            return this.generateCode("تابع ساده");
        }
        if (query.includes("حلقه") || query.includes("تکرار")) {
            return this.generateCode("حلقه");
        }
        if (query.includes("شرط") || query.includes("اگر")) {
            return this.generateCode("شرط");
        }
        if (query.includes("فرم")) {
            return this.generateCode("فرم ساده");
        }
        if (query.includes("جدول")) {
            return this.generateCode("جدول");
        }
        if (query.includes("کارت")) {
            return this.generateCode("کارت");
        }
        if (query.includes("دکمه")) {
            return this.generateCode("دکمه زیبا");
        }
        if (query.includes("صفحه")) {
            return this.generateCode("صفحه خالی");
        }

        // اگر چیزی پیدا نشد
        return "🤔 متوجه نشدم چه کدی می‌خوای.\n\n💡 مثال: 'یه ماشین حساب بنویس' یا 'یک لیست کار تولید کن'";
    }

    // ===== تحلیل کد =====
    analyzeCode(code) {
        let report = "📋 گزارش تحلیل کد:\n\n";
        let errors = [];
        let suggestions = [];

        for (let key in this.patterns) {
            const pattern = this.patterns[key];
            if (pattern.regex.test(code)) {
                errors.push(`❌ ${pattern.message}`);
            }
        }

        for (let key in this.optimizations) {
            const opt = this.optimizations[key];
            if (opt.regex.test(code)) {
                suggestions.push(`💡 ${opt.message}`);
            }
        }

        if (errors.length === 0 && suggestions.length === 0) {
            report += "✅ کد شما عالی است! هیچ باگی پیدا نشد.\n";
        } else {
            if (errors.length > 0) {
                report += "❌ خطاها:\n" + errors.map(e => `  ${e}`).join('\n') + '\n\n';
            }
            if (suggestions.length > 0) {
                report += "💡 پیشنهادها:\n" + suggestions.map(s => `  ${s}`).join('\n') + '\n\n';
            }
        }

        return report;
    }

    // ===== بهینه‌سازی کد =====
    optimizeCode(code) {
        let optimized = code;
        let changes = [];

        for (let key in this.optimizations) {
            const opt = this.optimizations[key];
            if (opt.regex.test(optimized) && opt.fix) {
                optimized = opt.fix(optimized);
                changes.push(`✅ ${opt.message}`);
            }
        }

        if (changes.length === 0) {
            return "💡 کد شما در حال حاضر بهینه است!";
        }

        return "🔧 کد بهینه‌سازی شد:\n\n" + changes.join('\n') + "\n\n📄 کد جدید:\n" + optimized;
    }

    // ===== یادگیری =====
    learn(key, value) {
        this.knowledge[key] = value;
        return `🧠 یاد گرفتم: "${key}" = "${value}"`;
    }
}
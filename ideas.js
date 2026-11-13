// ==================== STATE ====================
let selectedSample = null;
let selectedExercise = null;

// ==================== STORAGE ====================
function getProjects() {
    try { return JSON.parse(localStorage.getItem("projects")) || []; } catch { return []; }
}
function saveProjects(projects) { localStorage.setItem("projects", JSON.stringify(projects)); }

// ==================== محدودیت‌ها (قفل تمرین‌ها) ====================
function isExerciseUnlocked(level) {
    const owned = JSON.parse(localStorage.getItem('owned_items')) || [];
    if (level === 'intermediate') return owned.includes('ex-intermediate');
    if (level === 'advanced') return owned.includes('ex-advanced');
    return true; // مبتدی همیشه باز است
}

// ==================== SAMPLES ====================
const samples = [
    {
        id: "calculator", name: "🧮 ماشین حساب", desc: "محاسبات ساده با عملیات جمع، تفریق، ضرب و تقسیم",
        html: `<!DOCTYPE html>\n<html>\n<head>\n    <meta charset="UTF-8">\n    <title>ماشین حساب</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <div class="calculator">\n        <input type="text" id="display" readonly>\n        <div class="buttons">\n            <button onclick="clearDisplay()">C</button>\n            <button onclick="deleteLast()">DEL</button>\n            <button onclick="appendNumber('/')">/</button>\n            <button onclick="appendNumber('*')">*</button>\n            <button onclick="appendNumber('7')">7</button>\n            <button onclick="appendNumber('8')">8</button>\n            <button onclick="appendNumber('9')">9</button>\n            <button onclick="appendNumber('-')">-</button>\n            <button onclick="appendNumber('4')">4</button>\n            <button onclick="appendNumber('5')">5</button>\n            <button onclick="appendNumber('6')">6</button>\n            <button onclick="appendNumber('+')">+</button>\n            <button onclick="appendNumber('1')">1</button>\n            <button onclick="appendNumber('2')">2</button>\n            <button onclick="appendNumber('3')">3</button>\n            <button onclick="calculate()">=</button>\n            <button onclick="appendNumber('0')">0</button>\n            <button onclick="appendNumber('.')">.</button>\n        </div>\n    </div>\n    <script src="script.js"></script>\n</body>\n</html>`,
        css: `* { box-sizing: border-box; }\nbody { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #1a1a2e; font-family: sans-serif; }\n.calculator { background: #0d1117; padding: 20px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); width: 300px; }\n#display { width: 100%; height: 60px; background: #161b22; color: #fff; font-size: 28px; text-align: right; padding: 10px; border: none; border-radius: 8px; margin-bottom: 12px; }\n.buttons { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }\n.buttons button { padding: 16px; font-size: 18px; border: none; border-radius: 8px; background: #161b22; color: #fff; cursor: pointer; transition: 0.2s; }\n.buttons button:hover { background: #2d3748; }\n.buttons button:nth-child(4n) { background: #8b5cf6; }\n.buttons button:nth-child(4n):hover { background: #7c3aed; }\n.buttons button:last-child { grid-column: span 2; }`,
        js: `let display = document.getElementById('display');\nfunction appendNumber(num) { display.value += num; }\nfunction clearDisplay() { display.value = ''; }\nfunction deleteLast() { display.value = display.value.slice(0, -1); }\nfunction calculate() { try { display.value = eval(display.value); } catch { display.value = 'خطا'; } }`
    },
    {
        id: "todo", name: "📝 لیست کارها", desc: "مدیریت کارهای روزانه با افزودن و حذف",
        html: `<!DOCTYPE html>\n<html>\n<head>\n    <meta charset="UTF-8">\n    <title>لیست کارها</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <div class="todo-container">\n        <h1>📝 لیست کارها</h1>\n        <div class="input-row">\n            <input type="text" id="todoInput" placeholder="کار جدید...">\n            <button onclick="addTodo()">افزودن</button>\n        </div>\n        <ul id="todoList"></ul>\n    </div>\n    <script src="script.js"></script>\n</body>\n</html>`,
        css: `* { box-sizing: border-box; }\nbody { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #1a1a2e; font-family: sans-serif; color: #fff; }\n.todo-container { background: #0d1117; padding: 20px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); width: 320px; }\nh1 { text-align: center; color: #8b5cf6; margin-bottom: 16px; }\n.input-row { display: flex; gap: 8px; margin-bottom: 16px; }\n.input-row input { flex: 1; padding: 10px; border-radius: 8px; border: none; background: #161b22; color: #fff; outline: none; }\n.input-row button { padding: 10px 16px; border: none; border-radius: 8px; background: #8b5cf6; color: #fff; cursor: pointer; }\nul { list-style: none; padding: 0; margin: 0; }\nli { display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #161b22; border-radius: 8px; margin-bottom: 6px; }\nli button { background: #ef4444; border: none; color: #fff; padding: 4px 10px; border-radius: 6px; cursor: pointer; }`,
        js: `let todoInput = document.getElementById('todoInput');\nlet todoList = document.getElementById('todoList');\nfunction addTodo() { const text = todoInput.value.trim(); if (!text) return; const li = document.createElement('li'); li.innerHTML = \`<span>\${text}</span> <button onclick="removeTodo(this)">حذف</button>\`; todoList.appendChild(li); todoInput.value = ''; }\nfunction removeTodo(btn) { btn.parentElement.remove(); }`
    },
    {
        id: "counter", name: "🔢 شمارنده", desc: "شمارنده ساده با دکمه‌های افزایش، کاهش و ریست",
        html: `<!DOCTYPE html>\n<html>\n<head>\n    <meta charset="UTF-8">\n    <title>شمارنده</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <div class="counter">\n        <h1 id="count">0</h1>\n        <div class="buttons">\n            <button onclick="decrease()">-</button>\n            <button onclick="reset()">⟲</button>\n            <button onclick="increase()">+</button>\n        </div>\n    </div>\n    <script src="script.js"></script>\n</body>\n</html>`,
        css: `* { box-sizing: border-box; }\nbody { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #1a1a2e; font-family: sans-serif; color: #fff; }\n.counter { background: #0d1117; padding: 30px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); text-align: center; width: 200px; }\n#count { font-size: 60px; color: #8b5cf6; margin: 10px 0; }\n.buttons { display: flex; justify-content: center; gap: 10px; }\n.buttons button { padding: 10px 20px; font-size: 24px; border: none; border-radius: 8px; background: #161b22; color: #fff; cursor: pointer; transition: 0.2s; }\n.buttons button:hover { background: #2d3748; }\n.buttons button:nth-child(2) { background: #8b5cf6; }\n.buttons button:nth-child(2):hover { background: #7c3aed; }`,
        js: `let count = 0;\nlet countEl = document.getElementById('count');\nfunction increase() { count++; countEl.textContent = count; }\nfunction decrease() { count--; countEl.textContent = count; }\nfunction reset() { count = 0; countEl.textContent = count; }`
    },
    {
        id: "color", name: "🎨 تغییر رنگ", desc: "تغییر رنگ پس‌زمینه با کلیک دکمه",
        html: `<!DOCTYPE html>\n<html>\n<head>\n    <meta charset="UTF-8">\n    <title>تغییر رنگ</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <div class="color-box" id="colorBox">\n        <h2>🎨 رنگ من</h2>\n        <button onclick="changeColor()">تغییر رنگ</button>\n    </div>\n    <script src="script.js"></script>\n</body>\n</html>`,
        css: `* { box-sizing: border-box; }\nbody { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #1a1a2e; font-family: sans-serif; color: #fff; }\n.color-box { background: #0d1117; padding: 30px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); text-align: center; width: 250px; transition: 0.3s; }\n.color-box h2 { margin-bottom: 20px; }\n.color-box button { padding: 12px 24px; border: none; border-radius: 8px; background: #8b5cf6; color: #fff; font-size: 16px; cursor: pointer; transition: 0.2s; }\n.color-box button:hover { background: #7c3aed; }`,
        js: `let colorBox = document.getElementById('colorBox');\nlet colors = ['#8b5cf6', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];\nlet index = 0;\nfunction changeColor() { index = (index + 1) % colors.length; colorBox.style.background = colors[index]; }`
    },
    {
        id: "stopwatch", name: "⏱️ کرنومتر", desc: "شروع، توقف و ریست زمان",
        html: `<!DOCTYPE html>\n<html>\n<head>\n    <meta charset="UTF-8">\n    <title>کرنومتر</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <div class="stopwatch">\n        <h1 id="timer">00:00:00</h1>\n        <button onclick="startTimer()">شروع</button>\n        <button onclick="stopTimer()">توقف</button>\n        <button onclick="resetTimer()">ریست</button>\n    </div>\n    <script src="script.js"></script>\n</body>\n</html>`,
        css: `* { box-sizing: border-box; }\nbody { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #1a1a2e; font-family: sans-serif; color: #fff; }\n.stopwatch { text-align: center; background: #0d1117; padding: 30px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); width: 250px; }\n#timer { font-size: 48px; margin-bottom: 20px; }\nbutton { padding: 10px 20px; margin: 0 5px; border: none; border-radius: 8px; cursor: pointer; background: #8b5cf6; color: #fff; }\nbutton:hover { background: #7c3aed; }`,
        js: `let seconds = 0, interval;\nfunction updateTimer() { const h = String(Math.floor(seconds / 3600)).padStart(2, '0'); const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0'); const s = String(seconds % 60).padStart(2, '0'); document.getElementById('timer').textContent = h + ':' + m + ':' + s; }\nfunction startTimer() { if (interval) return; interval = setInterval(() => { seconds++; updateTimer(); }, 1000); }\nfunction stopTimer() { clearInterval(interval); interval = null; }\nfunction resetTimer() { stopTimer(); seconds = 0; updateTimer(); }`
    },
    {
        id: "quiz", name: "📝 آزمون چهارگزینه‌ای", desc: "یک آزمون ساده با سوالات و نمره‌دهی",
        html: `<!DOCTYPE html>\n<html>\n<head>\n    <meta charset="UTF-8">\n    <title>آزمون</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <div id="quiz">\n        <h2 id="question">سوال؟</h2>\n        <div id="options"></div>\n        <button onclick="nextQuestion()">بعدی</button>\n        <p id="score">نمره: 0</p>\n    </div>\n    <script src="script.js"></script>\n</body>\n</html>`,
        css: `* { box-sizing: border-box; }\nbody { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #1a1a2e; font-family: sans-serif; color: #fff; }\n#quiz { background: #0d1117; padding: 30px; border-radius: 16px; width: 300px; text-align: center; }\n#options button { display: block; width: 100%; margin: 8px 0; padding: 10px; border: none; border-radius: 8px; background: #2d3748; color: #fff; cursor: pointer; }\n#options button:hover { background: #8b5cf6; }`,
        js: `const questions = [\n    { q: 'پایتخت ایران؟', options: ['تهران', 'اصفهان', 'شیراز', 'مشهد'], answer: 0 },\n    { q: '2+2؟', options: ['3', '4', '5', '6'], answer: 1 }\n];\nlet current = 0, score = 0;\nfunction showQuestion() {\n    const q = questions[current];\n    document.getElementById('question').textContent = q.q;\n    const container = document.getElementById('options');\n    container.innerHTML = '';\n    q.options.forEach((opt, i) => {\n        const btn = document.createElement('button');\n        btn.textContent = opt;\n        btn.onclick = () => {\n            if (i === q.answer) score++;\n            document.getElementById('score').textContent = 'نمره: ' + score;\n            nextQuestion();\n        };\n        container.appendChild(btn);\n    });\n}\nfunction nextQuestion() {\n    current++;\n    if (current < questions.length) showQuestion();\n    else document.getElementById('quiz').innerHTML = '<h2>پایان آزمون!</h2><p>نمره نهایی: ' + score + '</p>';\n}\nshowQuestion();`
    },
    {
        id: "password", name: "🔐 تولید رمز تصادفی", desc: "تولید رمز قدرتمند با طول دلخواه",
        html: `<!DOCTYPE html>\n<html>\n<head>\n    <meta charset="UTF-8">\n    <title>تولید رمز</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <div class="password-gen">\n        <h2>رمز تصادفی</h2>\n        <input type="number" id="length" value="12" min="4" max="32">\n        <button onclick="generate()">تولید</button>\n        <p id="result"></p>\n    </div>\n    <script src="script.js"></script>\n</body>\n</html>`,
        css: `* { box-sizing: border-box; }\nbody { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #1a1a2e; font-family: sans-serif; color: #fff; }\n.password-gen { background: #0d1117; padding: 30px; border-radius: 16px; text-align: center; width: 300px; }\ninput { padding: 8px; border-radius: 8px; border: none; width: 60px; text-align: center; }\nbutton { padding: 8px 20px; border: none; border-radius: 8px; background: #8b5cf6; color: #fff; cursor: pointer; }\n#result { margin-top: 16px; font-size: 18px; word-break: break-all; }`,
        js: `function generate() {\n    const length = document.getElementById('length').value;\n    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';\n    let password = '';\n    for (let i = 0; i < length; i++) {\n        password += chars.charAt(Math.floor(Math.random() * chars.length));\n    }\n    document.getElementById('result').textContent = password;\n}`
    },
    {
        id: "weather", name: "🌤️ نمایش آب و هوا", desc: "نمایش دمای شهرها (شبیه‌سازی شده)",
        html: `<!DOCTYPE html>\n<html>\n<head>\n    <meta charset="UTF-8">\n    <title>آب و هوا</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <div class="weather">\n        <h2>آب و هوای تهران</h2>\n        <p id="temp">۲۵°C</p>\n        <button onclick="changeTemp()">بروزرسانی</button>\n    </div>\n    <script src="script.js"></script>\n</body>\n</html>`,
        css: `* { box-sizing: border-box; }\nbody { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #1a1a2e; font-family: sans-serif; color: #fff; }\n.weather { background: #0d1117; padding: 30px; border-radius: 16px; text-align: center; width: 250px; }\n#temp { font-size: 32px; margin: 16px 0; }\nbutton { padding: 10px 20px; border: none; border-radius: 8px; background: #8b5cf6; color: #fff; cursor: pointer; }`,
        js: `function changeTemp() {\n    const temp = Math.floor(Math.random() * 40) + 10;\n    document.getElementById('temp').textContent = temp + '°C';\n}`
    },
    {
        id: "notes", name: "📒 یادداشت‌ها", desc: "اضافه کردن و حذف یادداشت",
        html: `<!DOCTYPE html>\n<html>\n<head>\n    <meta charset="UTF-8">\n    <title>یادداشت‌ها</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <div class="notes">\n        <h2>یادداشت‌ها</h2>\n        <input type="text" id="noteInput" placeholder="یادداشت جدید...">\n        <button onclick="addNote()">افزودن</button>\n        <ul id="noteList"></ul>\n    </div>\n    <script src="script.js"></script>\n</body>\n</html>`,
        css: `* { box-sizing: border-box; }\nbody { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #1a1a2e; font-family: sans-serif; color: #fff; }\n.notes { background: #0d1117; padding: 30px; border-radius: 16px; width: 300px; }\ninput { padding: 8px; border-radius: 8px; border: none; width: 70%; }\nbutton { padding: 8px 16px; border: none; border-radius: 8px; background: #8b5cf6; color: #fff; cursor: pointer; }\nul { list-style: none; padding: 0; margin-top: 16px; }\nli { display: flex; justify-content: space-between; padding: 8px; background: #2d3748; border-radius: 8px; margin: 4px 0; }\nli button { background: #ef4444; padding: 4px 10px; }`,
        js: `function addNote() {\n    const input = document.getElementById('noteInput');\n    const text = input.value.trim();\n    if (!text) return;\n    const li = document.createElement('li');\n    li.innerHTML = text + ' <button onclick="this.parentElement.remove()">حذف</button>';\n    document.getElementById('noteList').appendChild(li);\n    input.value = '';\n}`
    },
    {
        id: "clock", name: "🕒 ساعت دیجیتال", desc: "ساعت دیجیتال با زمان لحظه‌ای",
        html: `<!DOCTYPE html>\n<html>\n<head>\n    <meta charset="UTF-8">\n    <title>ساعت دیجیتال</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <div class="clock">\n        <h1 id="time">00:00:00</h1>\n    </div>\n    <script src="script.js"></script>\n</body>\n</html>`,
        css: `* { box-sizing: border-box; }\nbody { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #1a1a2e; font-family: sans-serif; color: #fff; }\n.clock { background: #0d1117; padding: 30px; border-radius: 16px; text-align: center; width: 250px; }\n#time { font-size: 48px; letter-spacing: 2px; }`,
        js: `function updateClock() {\n    const now = new Date();\n    const h = String(now.getHours()).padStart(2, '0');\n    const m = String(now.getMinutes()).padStart(2, '0');\n    const s = String(now.getSeconds()).padStart(2, '0');\n    document.getElementById('time').textContent = h + ':' + m + ':' + s;\n}\nsetInterval(updateClock, 1000);\nupdateClock();`
    }
];

// ==================== EXERCISES ====================
const exercises = [
    { id: "ex-1", name: "متغیرسازی", level: "beginner", levelLabel: "🟢 مبتدی", desc: "یک متغیر به نام `name` بساز و مقدار 'Ali' رو توش ذخیره کن.", guide: "۱. با let یک متغیر بساز.\n۲. مقدار 'Ali' رو بهش بده.\n۳. با console.log چاپش کن." },
    { id: "ex-2", name: "تابع ساده", level: "beginner", levelLabel: "🟢 مبتدی", desc: "یک تابع به نام `sayHello` بنویس که 'Hello' رو چاپ کنه.", guide: "۱. با function تابعی به نام sayHello بساز.\n۲. داخلش 'Hello' رو چاپ کن.\n۳. تابع رو صدا بزن." },
    { id: "ex-3", name: "شرط if", level: "beginner", levelLabel: "🟢 مبتدی", desc: "اگر عدد بزرگتر از ۱۰ بود، 'بزرگ' چاپ کن.", guide: "۱. یک متغیر num با مقدار ۱۵ بساز.\n۲. با if شرط num > 10 رو چک کن.\n۳. اگه درست بود 'بزرگ' چاپ کن." },
    { id: "ex-4", name: "حلقه for", level: "beginner", levelLabel: "🟢 مبتدی", desc: "یک حلقه بنویس که اعداد ۱ تا ۱۰ رو چاپ کنه.", guide: "۱. یک حلقه for از ۱ تا ۱۰ بساز.\n۲. در هر تکرار عدد رو چاپ کن." },
    { id: "ex-5", name: "آرایه و map", level: "beginner", levelLabel: "🟢 مبتدی", desc: "یک آرایه از اعداد داشته باش و با map همه رو دو برابر کن.", guide: "۱. آرایه [1,2,3] رو بساز.\n۲. با map هر عدد رو دو برابر کن.\n۳. نتیجه رو چاپ کن." },
    { id: "ex-6", name: "شیء (Object)", level: "beginner", levelLabel: "🟢 مبتدی", desc: "یک شیء به نام `person` با کلیدهای `name` و `age` بساز.", guide: "۱. با {} یک شیء به نام person بساز.\n۲. ویژگی‌های name و age رو اضافه کن.\n۳. مقدارشون رو چاپ کن." },
    { id: "ex-7", name: "محاسبه فیبوناچی", level: "intermediate", levelLabel: "🟡 متوسط", desc: "تابعی بنویس که nامین عدد فیبوناچی را محاسبه کند.", guide: "۱. تابع fib رو بنویس که n بگیره.\n۲. اگر n <= 1 بود n رو برگردون.\n۳. وگرنه fib(n-1) + fib(n-2) رو برگردون." },
    { id: "ex-8", name: "تولید رنگ RGB", level: "intermediate", levelLabel: "🟡 متوسط", desc: "تابعی بنویس که یک رنگ تصادفی RGB تولید کند.", guide: "۱. برای R, G, B عدد تصادفی ۰ تا ۲۵۵ تولید کن.\n۲. رشته 'rgb(r, g, b)' رو برگردون." },
    { id: "ex-9", name: "لیست محصولات", level: "intermediate", levelLabel: "🟡 متوسط", desc: "یک لیست از محصولات (نام و قیمت) بساز و آن‌ها را نمایش بده.", guide: "۱. آرایه‌ای از شیءهای {name, price} بساز.\n۲. با forEach رویش بچرخ و چاپ کن." },
    { id: "ex-10", name: "لینک به سایت", level: "intermediate", levelLabel: "🟡 متوسط", desc: "یک تابع بنویس که یک لینک را در مرورگر باز کند.", guide: "۱. تابع openLink رو بنویس.\n۲. از window.open(url, '_blank') استفاده کن." },
    { id: "ex-11", name: "رفع خطای command", level: "intermediate", levelLabel: "🟡 متوسط", desc: "راه حل خطای 'internal or external command' رو توضیح بده.", guide: "۱. تابع fixCommandError رو بنویس.\n۲. توضیح بده که دستور توی PATH نیست." },
    { id: "ex-12", name: "بازی مافیا", level: "intermediate", levelLabel: "🟡 متوسط", desc: "یک کلاس ساده برای نقش‌های بازی مافیا طراحی کن.", guide: "۱. کلاس Role با ویژگی name بساز.\n۲. برای هر نقش یک شیء بساز." },
    { id: "ex-13", name: "تبریک تولد", level: "advanced", levelLabel: "🔴 پیشرفته", desc: "محاسبه روزهای مانده تا تولد بعدی.", guide: "۱. تاریخ تولد رو بگیر.\n۲. تاریخ امروز و تولد بعدی رو محاسبه کن.\n۳. اختلاف رو به روز برگردون." },
    { id: "ex-14", name: "وب‌سایت شخصی", level: "advanced", levelLabel: "🔴 پیشرفته", desc: "ساختار HTML/CSS برای وب‌سایت شخصی.", guide: "۱. هدر، فوتر و بخش اصلی رو با HTML بساز.\n۲. با CSS ظاهر رو زیبا کن." },
    { id: "ex-15", name: "منوی رستوران", level: "advanced", levelLabel: "🔴 پیشرفته", desc: "منوی رستوران با نام غذا و قیمت.", guide: "۱. شیء منو رو با {غذا: قیمت} بساز.\n۲. تابعی بنویس که قیمت رو برگردونه." },
    { id: "ex-16", name: "ساخت QR Code", level: "advanced", levelLabel: "🔴 پیشرفته", desc: "تولید لینک QR Code از متن.", guide: "۱. تابعی بنویس که متن بگیره.\n۲. لینک API qrserver.com رو بساز." },
    { id: "ex-17", name: "مدیریت پارکینگ", level: "advanced", levelLabel: "🔴 پیشرفته", desc: "مدیریت پارکینگ با اضافه و حذف ماشین.", guide: "۱. کلاس Parking با ظرفیت بساز.\n۲. متدهای park, leave, available رو بنویس." },
    { id: "ex-18", name: "چاپ اعداد", level: "advanced", levelLabel: "🔴 پیشرفته", desc: "چاپ اعداد ۱ تا ۱۰۰ به جز بخش‌پذیر بر ۴.", guide: "۱. حلقه ۱ تا ۱۰۰.\n۲. اگر i % 4 !== 0 بود، چاپ کن." }
];

// ==================== MODE ====================
function selectMode(mode, el) {
    document.querySelectorAll(".choice-card").forEach(c => c.classList.remove("selected"));
    el.classList.add("selected");
    document.getElementById("samples-section")?.classList.add("hidden");
    document.getElementById("custom-idea-section")?.classList.add("hidden");
    document.getElementById("exercises-section")?.classList.add("hidden");

    if (mode === "samples") { document.getElementById("samples-section")?.classList.remove("hidden"); renderSamples(); }
    if (mode === "custom") { document.getElementById("custom-idea-section")?.classList.remove("hidden"); }
    if (mode === "exercises") { document.getElementById("exercises-section")?.classList.remove("hidden"); renderExercises(); }
}

// ==================== RENDER SAMPLES ====================
function renderSamples() {
    const grid = document.getElementById("samples-grid");
    if (!grid) return;
    grid.innerHTML = "";
    samples.forEach(s => {
        const div = document.createElement("div");
        div.className = "sample-card";
        div.innerHTML = `<h4>${s.name}</h4><p>${s.desc}</p>`;
        div.onclick = () => selectSample(s, div);
        grid.appendChild(div);
    });
}

// ==================== SELECT SAMPLE ====================
function selectSample(sample, el) {
    document.querySelectorAll(".sample-card").forEach(c => c.classList.remove("active"));
    el.classList.add("active");
    selectedSample = sample; selectedExercise = null;
    enableBuildBtn(); disableExerciseBtn();
    showToast(`"${sample.name}" انتخاب شد 👍`);
}

// ==================== RENDER EXERCISES ====================
function renderExercises() {
    const grid = document.getElementById("exercises-grid");
    if (!grid) return;
    grid.innerHTML = "";
    exercises.forEach(ex => {
        const div = document.createElement("div");
        div.className = "exercise-card";
        div.innerHTML = `
          <div>
            <h4>${ex.name}</h4>
            <p>${ex.desc}</p>
            <span class="level-tag ${ex.level}">${ex.levelLabel}</span>
          </div>
        `;
        div.onclick = () => selectExercise(ex, div);
        grid.appendChild(div);
    });
}

// ==================== SELECT EXERCISE ====================
function selectExercise(exercise, el) {
    if (!isExerciseUnlocked(exercise.level)) {
        showToast("🔒 این تمرین قفل است! ابتدا آن را از فروشگاه بخرید.");
        return;
    }
    document.querySelectorAll(".exercise-card").forEach(c => c.classList.remove("active"));
    el.classList.add("active");
    selectedExercise = exercise; selectedSample = null;
    enableExerciseBtn(); disableBuildBtn();
    showToast(`"${exercise.name}" انتخاب شد 🎯`);
}

// ==================== 👈 تابع چک کردن محدودیت اشتراک ====================
async function checkProjectLimit() {
    const userPlan = localStorage.getItem('userPlan') || 'free';
    const session = JSON.parse(localStorage.getItem('session'));
    
    if (userPlan === 'free' && session && session.id) {
        const projRes = await getUserProjects(session.id);
        const projectCount = (projRes.ok && projRes.data.projects) ? projRes.data.projects.length : 0;
        
        if (projectCount >= 3) {
            showToast("🔒 محدودیت پلن رایگان! برای ساخت پروژه بیشتر، اشتراک ویژه تهیه کنید.");
            setTimeout(() => { window.location.href = 'subscribe.html'; }, 2000);
            return false; // یعنی اجازه نده
        }
    }
    return true; // یعنی اجازه بده
}

// ==================== BUILD ====================
async function goToBuild() {
    if (!selectedSample) { showToast("یه پروژه انتخاب کن 😑"); return; }
    if (!(await checkProjectLimit())) return;
    createProject(selectedSample);
}

// ==================== EXERCISE ====================
async function goToExercise() {
    if (!selectedExercise) { showToast("یه تمرین انتخاب کن 🎯"); return; }
    if (!(await checkProjectLimit())) return;
    createExercise(selectedExercise);
}

// ==================== CUSTOM IDEA ====================
async function submitCustomIdea() {
    const input = document.getElementById("custom-idea");
    if (!input || input.value.trim() === "") {
        showToast("ایده‌تو بنویس 😑");
        return;
    }
    if (!(await checkProjectLimit())) return;
    createCustomProject(input.value.trim());
}

// ==================== CREATE PROJECT ====================
function createProject(sample) {
    const project = {
        id: Date.now(),
        name: sample.name,
        html: sample.html || "",
        css: sample.css || "",
        js: sample.js || "",
        date: new Date().toLocaleDateString("fa-IR")
    };
    localStorage.removeItem("currentProject");
    localStorage.setItem("currentProject", JSON.stringify(project));
    const projects = getProjects();
    projects.push(project);
    saveProjects(projects);
    
    let currentXP = parseInt(localStorage.getItem('userXP')) || 0;
    let currentCoins = parseInt(localStorage.getItem('userCoins')) || 0;
    currentXP += 10;
    currentCoins += 5;
    localStorage.setItem('userXP', currentXP.toString());
    localStorage.setItem('userCoins', currentCoins.toString());

    showToast("پروژه ساخته شد 🚀 +۱۰ XP +۵ سکه");
    setTimeout(() => { window.location.href = "build.html"; }, 300);
}

// ==================== CREATE EXERCISE ====================
function createExercise(exercise) {
    const project = {
        id: Date.now(),
        name: exercise.name,
        description: exercise.desc,
        guide: exercise.guide,
        isExercise: true,
        date: new Date().toLocaleDateString("fa-IR")
    };
    localStorage.removeItem("currentProject");
    localStorage.setItem("currentProject", JSON.stringify(project));
    
    let currentXP = parseInt(localStorage.getItem('userXP')) || 0;
    let currentCoins = parseInt(localStorage.getItem('userCoins')) || 0;
    currentXP += 5;
    currentCoins += 3;
    localStorage.setItem('userXP', currentXP.toString());
    localStorage.setItem('userCoins', currentCoins.toString());

    showToast("تمرین بارگذاری شد 🎯 +۵ XP +۳ سکه");
    setTimeout(() => { window.location.href = "build.html"; }, 300);
}

// ==================== CREATE CUSTOM PROJECT ====================
async function createCustomProject(idea) {
    showToast("🧠 هوش مصنوعی در حال تحلیل ایده شما...");
    const aiResponse = await simulateAIResponse(idea);
    const project = {
        id: Date.now(),
        name: idea.substring(0, 30) + (idea.length > 30 ? "..." : ""),
        html: aiResponse.html || "",
        css: aiResponse.css || "",
        js: aiResponse.js || "",
        date: new Date().toLocaleDateString("fa-IR"),
        isAI: true
    };
    localStorage.removeItem("currentProject");
    localStorage.setItem("currentProject", JSON.stringify(project));
    const projects = getProjects();
    projects.push(project);
    saveProjects(projects);
    
    let currentXP = parseInt(localStorage.getItem('userXP')) || 0;
    let currentCoins = parseInt(localStorage.getItem('userCoins')) || 0;
    currentXP += 15;
    currentCoins += 8;
    localStorage.setItem('userXP', currentXP.toString());
    localStorage.setItem('userCoins', currentCoins.toString());

    showToast("✨ پروژه با هوش مصنوعی ساخته شد! +۱۵ XP +۸ سکه");
    setTimeout(() => { window.location.href = "build.html"; }, 300);
}

function simulateAIResponse(idea) {
    return new Promise((resolve) => {
        setTimeout(() => {
            if (idea.includes("فروشگاه") || idea.includes("فروش")) {
                resolve({
                    html: `<h1>🛒 فروشگاه من</h1><div id="products"></div>`,
                    css: `body { background: #1a1a2e; color: white; }`,
                    js: `console.log('فروشگاه آماده است!');`
                });
            } else if (idea.includes("وبلاگ") || idea.includes("نوشتن")) {
                resolve({
                    html: `<h1>📝 وبلاگ من</h1><article>اولین پست</article>`,
                    css: `body { font-family: sans-serif; background: #0d1117; color: #e8edf5; }`,
                    js: `console.log('وبلاگ راه‌اندازی شد!');`
                });
            } else {
                resolve({
                    html: `<h1>🚀 پروژه هوشمند</h1><p>${idea}</p>`,
                    css: `body { background: #0d1117; color: #fff; text-align: center; padding: 50px; }`,
                    js: `console.log('ایده شما: ${idea}');`
                });
            }
        }, 1500);
    });
}

// ==================== BUTTONS ====================
function enableBuildBtn() {
    const btn = document.getElementById("build-btn");
    if (!btn) return;
    btn.classList.remove("hidden");
    btn.disabled = false;
}
function disableBuildBtn() {
    const btn = document.getElementById("build-btn");
    if (!btn) return;
    btn.classList.add("hidden");
    btn.disabled = true;
}
function enableExerciseBtn() {
    const btn = document.getElementById("exercise-btn");
    if (!btn) return;
    btn.classList.remove("hidden");
    btn.disabled = false;
}
function disableExerciseBtn() {
    const btn = document.getElementById("exercise-btn");
    if (!btn) return;
    btn.classList.add("hidden");
    btn.disabled = true;
}

// ==================== TOAST ====================
function showToast(msg) {
    let toast = document.createElement("div");
    toast.className = "toast";
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => { toast.classList.add("show"); }, 10);
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// ==================== MENU ====================
function toggleMenu() {
    const menu = document.getElementById("side-menu");
    let overlay = document.getElementById("menu-overlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "menu-overlay";
        overlay.className = "menu-overlay";
        overlay.onclick = toggleMenu;
        document.body.appendChild(overlay);
    }
    menu?.classList.toggle("active");
    overlay.classList.toggle("active");
}
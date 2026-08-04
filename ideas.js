// ==================== STATE ====================
let selectedSample = null;
let selectedExercise = null;


// ==================== STORAGE ====================
function getProjects() {
    try {
        return JSON.parse(localStorage.getItem("projects")) || [];
    } catch {
        return [];
    }
}

function saveProjects(projects) {
    localStorage.setItem("projects", JSON.stringify(projects));
}


// ==================== SAMPLES (۱۰ نمونه‌کار) ====================
const samples = [
    {
        id: "calculator",
        name: "🧮 ماشین حساب",
        desc: "محاسبات ساده با عملیات جمع، تفریق، ضرب و تقسیم",
        html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ماشین حساب</title>
        <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="calculator">
        <input type="text" id="display" readonly>
        <div class="buttons">
            <button onclick="clearDisplay()">C</button>
            <button onclick="deleteLast()">DEL</button>
            <button onclick="appendNumber('/')">/</button>
            <button onclick="appendNumber('*')">*</button>
            <button onclick="appendNumber('7')">7</button>
            <button onclick="appendNumber('8')">8</button>
            <button onclick="appendNumber('9')">9</button>
            <button onclick="appendNumber('-')">-</button>
            <button onclick="appendNumber('4')">4</button>
            <button onclick="appendNumber('5')">5</button>
            <button onclick="appendNumber('6')">6</button>
            <button onclick="appendNumber('+')">+</button>
            <button onclick="appendNumber('1')">1</button>
            <button onclick="appendNumber('2')">2</button>
            <button onclick="appendNumber('3')">3</button>
            <button onclick="calculate()">=</button>
            <button onclick="appendNumber('0')">0</button>
            <button onclick="appendNumber('.')">.</button>
        </div>
    </div>
    <script src="script.js"></script>

</body>
</html>`,
        css: `* { box-sizing: border-box; }
body {
    display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;
    background: #1a1a2e; font-family: sans-serif;
}
.calculator {
    background: #0d1117; padding: 20px; border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5); width: 300px;
}
#display {
    width: 100%; height: 60px; background: #161b22; color: #fff;
    font-size: 28px; text-align: right; padding: 10px; border: none;
    border-radius: 8px; margin-bottom: 12px;
}
.buttons {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
}
.buttons button {
    padding: 16px; font-size: 18px; border: none; border-radius: 8px;
    background: #161b22; color: #fff; cursor: pointer; transition: 0.2s;
}
.buttons button:hover { background: #2d3748; }
.buttons button:nth-child(4n) { background: #8b5cf6; }
.buttons button:nth-child(4n):hover { background: #7c3aed; }
.buttons button:last-child { grid-column: span 2; }`,
        js: `let display = document.getElementById('display');
function appendNumber(num) {
    display.value += num;
}
function clearDisplay() {
    display.value = '';
}
function deleteLast() {
    display.value = display.value.slice(0, -1);
}
function calculate() {
    try {
        display.value = eval(display.value);
    } catch {
        display.value = 'خطا';
    }
}`
    },
    {
        id: "todo",
        name: "📝 لیست کارها",
        desc: "مدیریت کارهای روزانه با افزودن و حذف",
        html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>لیست کارها</title>
        <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="todo-container">
        <h1>📝 لیست کارها</h1>
        <div class="input-row">
            <input type="text" id="todoInput" placeholder="کار جدید...">
            <button onclick="addTodo()">افزودن</button>
        </div>
        <ul id="todoList"></ul>
    </div>
    <script src="script.js"></script>

</body>
</html>`,
        css: `* { box-sizing: border-box; }
body {
    display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;
    background: #1a1a2e; font-family: sans-serif; color: #fff;
}
.todo-container {
    background: #0d1117; padding: 20px; border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5); width: 320px;
}
h1 { text-align: center; color: #8b5cf6; margin-bottom: 16px; }
.input-row { display: flex; gap: 8px; margin-bottom: 16px; }
.input-row input {
    flex: 1; padding: 10px; border-radius: 8px; border: none;
    background: #161b22; color: #fff; outline: none;
}
.input-row button {
    padding: 10px 16px; border: none; border-radius: 8px;
    background: #8b5cf6; color: #fff; cursor: pointer;
}
ul { list-style: none; padding: 0; margin: 0; }
li {
    display: flex; justify-content: space-between; align-items: center;
    padding: 10px; background: #161b22; border-radius: 8px; margin-bottom: 6px;
}
li button {
    background: #ef4444; border: none; color: #fff; padding: 4px 10px;
    border-radius: 6px; cursor: pointer;
}`,
        js: `let todoInput = document.getElementById('todoInput');
let todoList = document.getElementById('todoList');
function addTodo() {
    const text = todoInput.value.trim();
    if (!text) return;
    const li = document.createElement('li');
    li.innerHTML = \`<span>\${text}</span> <button onclick="removeTodo(this)">حذف</button>\`;
    todoList.appendChild(li);
    todoInput.value = '';
}
function removeTodo(btn) {
    btn.parentElement.remove();
}`
    },
    {
        id: "counter",
        name: "🔢 شمارنده",
        desc: "شمارنده ساده با دکمه‌های افزایش، کاهش و ریست",
        html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>شمارنده</title>
        <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="counter">
        <h1 id="count">0</h1>
        <div class="buttons">
            <button onclick="decrease()">-</button>
            <button onclick="reset()">⟲</button>
            <button onclick="increase()">+</button>
        </div>
    </div>
    <script src="script.js"></script>

</body>
</html>`,
        css: `* { box-sizing: border-box; }
body {
    display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;
    background: #1a1a2e; font-family: sans-serif; color: #fff;
}
.counter {
    background: #0d1117; padding: 30px; border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5); text-align: center; width: 200px;
}
#count { font-size: 60px; color: #8b5cf6; margin: 10px 0; }
.buttons { display: flex; justify-content: center; gap: 10px; }
.buttons button {
    padding: 10px 20px; font-size: 24px; border: none; border-radius: 8px;
    background: #161b22; color: #fff; cursor: pointer; transition: 0.2s;
}
.buttons button:hover { background: #2d3748; }
.buttons button:nth-child(2) { background: #8b5cf6; }
.buttons button:nth-child(2):hover { background: #7c3aed; }`,
        js: `let count = 0;
let countEl = document.getElementById('count');
function increase() {
    count++;
    countEl.textContent = count;
}
function decrease() {
    count--;
    countEl.textContent = count;
}
function reset() {
    count = 0;
    countEl.textContent = count;
}`
    },
    {
        id: "color",
        name: "🎨 تغییر رنگ",
        desc: "تغییر رنگ پس‌زمینه با کلیک دکمه",
        html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تغییر رنگ</title>
        <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="color-box" id="colorBox">
        <h2>🎨 رنگ من</h2>
        <button onclick="changeColor()">تغییر رنگ</button>
    </div>
    <script src="script.js"></script>

</body>
</html>`,
        css: `* { box-sizing: border-box; }
body {
    display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;
    background: #1a1a2e; font-family: sans-serif; color: #fff;
}
.color-box {
    background: #0d1117; padding: 30px; border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5); text-align: center; width: 250px;
}
.color-box h2 { margin-bottom: 20px; }
.color-box button {
    padding: 12px 24px; border: none; border-radius: 8px;
    background: #8b5cf6; color: #fff; font-size: 16px; cursor: pointer;
    transition: 0.2s;
}
.color-box button:hover { background: #7c3aed; }`,
        js: `let colorBox = document.getElementById('colorBox');
let colors = ['#8b5cf6', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];
let index = 0;
function changeColor() {
    index = (index + 1) % colors.length;
    colorBox.style.background = colors[index];
}`
    },
    {
        id: "stopwatch",
        name: "⏱️ کرنومتر",
        desc: "شروع، توقف و ریست زمان",
        html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>کرنومتر</title>
        <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="stopwatch">
        <h1 id="timer">00:00:00</h1>
        <button onclick="startTimer()">شروع</button>
        <button onclick="stopTimer()">توقف</button>
        <button onclick="resetTimer()">ریست</button>
    </div>
    <script src="script.js"></script>

</body>
</html>`,
        css: `* { box-sizing: border-box; }
body {
    display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;
    background: #1a1a2e; font-family: sans-serif; color: #fff;
}
.stopwatch {
    text-align: center;
    background: #0d1117; padding: 30px; border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5); width: 250px;
}
#timer { font-size: 48px; margin-bottom: 20px; }
button { padding: 10px 20px; margin: 0 5px; border: none; border-radius: 8px; cursor: pointer; background: #8b5cf6; color: #fff; }
button:hover { background: #7c3aed; }`,
        js: `let seconds = 0, interval;
function updateTimer() {
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    document.getElementById('timer').textContent = h + ':' + m + ':' + s;
}
function startTimer() {
    if (interval) return;
    interval = setInterval(() => { seconds++; updateTimer(); }, 1000);
}
function stopTimer() { clearInterval(interval); interval = null; }
function resetTimer() { stopTimer(); seconds = 0; updateTimer(); }`
    },
    {
        id: "quiz",
        name: "📝 آزمون چهارگزینه‌ای",
        desc: "یک آزمون ساده با سوالات و نمره‌دهی",
        html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>آزمون</title>
        <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="quiz">
        <h2 id="question">سوال؟</h2>
        <div id="options"></div>
        <button onclick="nextQuestion()">بعدی</button>
        <p id="score">نمره: 0</p>
    </div>
    <script src="script.js"></script>

</body>
</html>`,
        css: `* { box-sizing: border-box; }
body {
    display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;
    background: #1a1a2e; font-family: sans-serif; color: #fff;
}
#quiz { background: #0d1117; padding: 30px; border-radius: 16px; width: 300px; text-align: center; }
#options button { display: block; width: 100%; margin: 8px 0; padding: 10px; border: none; border-radius: 8px; background: #2d3748; color: #fff; cursor: pointer; }
#options button:hover { background: #8b5cf6; }`,
        js: `const questions = [
    { q: 'پایتخت ایران؟', options: ['تهران', 'اصفهان', 'شیراز', 'مشهد'], answer: 0 },
    { q: '2+2؟', options: ['3', '4', '5', '6'], answer: 1 }
];
let current = 0, score = 0;
function showQuestion() {
    const q = questions[current];
    document.getElementById('question').textContent = q.q;
    const container = document.getElementById('options');
    container.innerHTML = '';
    q.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.textContent = opt;
        btn.onclick = () => {
            if (i === q.answer) score++;
            document.getElementById('score').textContent = 'نمره: ' + score;
            nextQuestion();
        };
        container.appendChild(btn);
    });
}
function nextQuestion() {
    current++;
    if (current < questions.length) showQuestion();
    else document.getElementById('quiz').innerHTML = '<h2>پایان آزمون!</h2><p>نمره نهایی: ' + score + '</p>';
}
showQuestion();`
    },
    {
        id: "password",
        name: "🔐 تولید رمز تصادفی",
        desc: "تولید رمز قدرتمند با طول دلخواه",
        html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تولید رمز</title>
        <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="password-gen">
        <h2>رمز تصادفی</h2>
        <input type="number" id="length" value="12" min="4" max="32">
        <button onclick="generate()">تولید</button>
        <p id="result"></p>
    </div>
    <script src="script.js"></script>

</body>
</html>`,
        css: `* { box-sizing: border-box; }
body {
    display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;
    background: #1a1a2e; font-family: sans-serif; color: #fff;
}
.password-gen { background: #0d1117; padding: 30px; border-radius: 16px; text-align: center; width: 300px; }
input { padding: 8px; border-radius: 8px; border: none; width: 60px; text-align: center; }
button { padding: 8px 20px; border: none; border-radius: 8px; background: #8b5cf6; color: #fff; cursor: pointer; }
#result { margin-top: 16px; font-size: 18px; word-break: break-all; }`,
        js: `function generate() {
    const length = document.getElementById('length').value;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    document.getElementById('result').textContent = password;
}`
    },
    {
        id: "weather",
        name: "🌤️ نمایش آب و هوا",
        desc: "نمایش دمای شهرها (شبیه‌سازی شده)",
        html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>آب و هوا</title>
        <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="weather">
        <h2>آب و هوای تهران</h2>
        <p id="temp">۲۵°C</p>
        <button onclick="changeTemp()">بروزرسانی</button>
    </div>
    <script src="script.js"></script>

</body>
</html>`,
        css: `* { box-sizing: border-box; }
body {
    display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;
    background: #1a1a2e; font-family: sans-serif; color: #fff;
}
.weather { background: #0d1117; padding: 30px; border-radius: 16px; text-align: center; width: 250px; }
#temp { font-size: 32px; margin: 16px 0; }
button { padding: 10px 20px; border: none; border-radius: 8px; background: #8b5cf6; color: #fff; cursor: pointer; }`,
        js: `function changeTemp() {
    const temp = Math.floor(Math.random() * 40) + 10;
    document.getElementById('temp').textContent = temp + '°C';
}`
    },
    {
        id: "notes",
        name: "📒 یادداشت‌ها",
        desc: "اضافه کردن و حذف یادداشت",
        html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>یادداشت‌ها</title>
        <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="notes">
        <h2>یادداشت‌ها</h2>
        <input type="text" id="noteInput" placeholder="یادداشت جدید...">
        <button onclick="addNote()">افزودن</button>
        <ul id="noteList"></ul>
    </div>
    <script src="script.js"></script>

</body>
</html>`,
        css: `* { box-sizing: border-box; }
body {
    display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;
    background: #1a1a2e; font-family: sans-serif; color: #fff;
}
.notes { background: #0d1117; padding: 30px; border-radius: 16px; width: 300px; }
input { padding: 8px; border-radius: 8px; border: none; width: 70%; }
button { padding: 8px 16px; border: none; border-radius: 8px; background: #8b5cf6; color: #fff; cursor: pointer; }
ul { list-style: none; padding: 0; margin-top: 16px; }
li { display: flex; justify-content: space-between; padding: 8px; background: #2d3748; border-radius: 8px; margin: 4px 0; }
li button { background: #ef4444; padding: 4px 10px; }`,
        js: `function addNote() {
    const input = document.getElementById('noteInput');
    const text = input.value.trim();
    if (!text) return;
    const li = document.createElement('li');
    li.innerHTML = text + ' <button onclick="this.parentElement.remove()">حذف</button>';
    document.getElementById('noteList').appendChild(li);
    input.value = '';
}`
    },
    {
        id: "clock",
        name: "🕒 ساعت دیجیتال",
        desc: "ساعت دیجیتال با زمان لحظه‌ای",
        html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ساعت دیجیتال</title>
        <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="clock">
        <h1 id="time">00:00:00</h1>
    </div>
    <script src="script.js"></script>

</body>
</html>`,
        css: `* { box-sizing: border-box; }
body {
    display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;
    background: #1a1a2e; font-family: sans-serif; color: #fff;
}
.clock { background: #0d1117; padding: 30px; border-radius: 16px; text-align: center; width: 250px; }
#time { font-size: 48px; letter-spacing: 2px; }`,
        js: `function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('time').textContent = h + ':' + m + ':' + s;
}
setInterval(updateClock, 1000);
updateClock();`
    }
];


// ==================== EXERCISES (۱۸ تمرین) ====================
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

    if (mode === "samples") {
        document.getElementById("samples-section")?.classList.remove("hidden");
        renderSamples();
    }
    if (mode === "custom") {
        document.getElementById("custom-idea-section")?.classList.remove("hidden");
    }
    if (mode === "exercises") {
        document.getElementById("exercises-section")?.classList.remove("hidden");
        renderExercises();
    }
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
    selectedSample = sample;
    selectedExercise = null;
    enableBuildBtn();
    disableExerciseBtn();
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
    // ===== بررسی قفل تمرین =====
    const owned = JSON.parse(localStorage.getItem('owned_items')) || [];
    
    if (exercise.level === 'intermediate' && !owned.includes('ex-intermediate')) {
        showToast("🔒 این تمرین قفل است! ابتدا آن را از فروشگاه بخرید.");
        return;
    }
    if (exercise.level === 'advanced' && !owned.includes('ex-advanced')) {
        showToast("🔒 این تمرین قفل است! ابتدا آن را از فروشگاه بخرید.");
        return;
    }
    // ========================================

    document.querySelectorAll(".exercise-card").forEach(c => c.classList.remove("active"));
    el.classList.add("active");
    selectedExercise = exercise;
    selectedSample = null;
    enableExerciseBtn();
    disableBuildBtn();
    showToast(`"${exercise.name}" انتخاب شد 🎯`);
}


// ==================== BUILD ====================
function goToBuild() {
    if (!selectedSample) { showToast("یه پروژه انتخاب کن 😑"); return; }
    createProject(selectedSample);
}


// ==================== EXERCISE ====================
function goToExercise() {
    if (!selectedExercise) { showToast("یه تمرین انتخاب کن 🎯"); return; }
    createExercise(selectedExercise);
}


// ==================== CUSTOM IDEA ====================
function submitCustomIdea() {
    const input = document.getElementById("custom-idea");
    if (!input || input.value.trim() === "") {
        showToast("ایده‌تو بنویس 😑");
        return;
    }
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
    
    // ========== افزایش XP و سکه ==========
    let currentXP = parseInt(localStorage.getItem('userXP')) || 0;
    let currentCoins = parseInt(localStorage.getItem('userCoins')) || 0;

    currentXP += 10;
    currentCoins += 5;

    localStorage.setItem('userXP', currentXP.toString());
    localStorage.setItem('userCoins', currentCoins.toString());
    // ========================================

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
    
    // ========== افزایش XP و سکه ==========
    let currentXP = parseInt(localStorage.getItem('userXP')) || 0;
    let currentCoins = parseInt(localStorage.getItem('userCoins')) || 0;

    currentXP += 5;
    currentCoins += 3;

    localStorage.setItem('userXP', currentXP.toString());
    localStorage.setItem('userCoins', currentCoins.toString());
    // ========================================

    showToast("تمرین بارگذاری شد 🎯 +۵ XP +۳ سکه");
    setTimeout(() => { window.location.href = "build.html"; }, 300);
}


// ==================== CREATE CUSTOM PROJECT (با هوش مصنوعی) ====================
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
    
    // ========== افزایش XP و سکه ==========
    let currentXP = parseInt(localStorage.getItem('userXP')) || 0;
    let currentCoins = parseInt(localStorage.getItem('userCoins')) || 0;

    currentXP += 15;
    currentCoins += 8;

    localStorage.setItem('userXP', currentXP.toString());
    localStorage.setItem('userCoins', currentCoins.toString());
    // ========================================

    showToast("✨ پروژه با هوش مصنوعی ساخته شد! +۱۵ XP +۸ سکه");
    setTimeout(() => { window.location.href = "build.html"; }, 300);
}


// ==================== شبیه‌سازی هوش مصنوعی (موقت) ====================
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
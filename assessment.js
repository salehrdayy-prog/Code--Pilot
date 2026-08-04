// ==================== ASSESSMENT MANAGER ====================

// سوالات
const questions = {
    beginner: [
        {
            text: 'متغیر در برنامه‌نویسی چیست؟',
            options: [
                'وسیله‌ای برای ذخیره اطلاعات',
                'دستور چاپ متن',
                'نوعی حلقه',
                'یک شرط',
                'نمی‌دانم'
            ],
            correct: 0
        },
        {
            text: 'کدام گزینه برای تصمیم‌گیری استفاده می‌شود؟',
            options: ['if', 'for', 'while', 'switch', 'نمی‌دانم'],
            correct: 0
        },
        {
            text: 'کدام مورد برای تکرار یک کار استفاده می‌شود؟',
            options: ['حلقه', 'متغیر', 'تابع', 'آرایه', 'نمی‌دانم'],
            correct: 0
        },
        {
            text: 'HTML بیشتر برای چه چیزی استفاده می‌شود؟',
            options: ['ساختار صفحه وب', 'طراحی رنگ‌ها', 'سرعت برنامه', 'ذخیره اطلاعات', 'نمی‌دانم'],
            correct: 0
        },
        {
            text: 'CSS بیشتر برای چه چیزی استفاده می‌شود؟',
            options: ['ظاهر و استایل صفحه', 'منطق برنامه', 'ذخیره داده', 'اجرای شرط‌ها', 'نمی‌دانم'],
            correct: 0
        }
    ],

    intermediate: [
        {
            text: 'تفاوت let و const چیست؟',
            options: [
                'let قابل تغییر است، const ثابت می‌ماند',
                'هر دو دقیقاً یک معنی دارند',
                'const فقط برای عدد است',
                'let فقط برای رشته است',
                'نمی‌دانم'
            ],
            correct: 0
        },
        {
            text: '=== در جاوااسکریپت چه تفاوتی با == دارد؟',
            options: [
                '=== هم نوع و هم مقدار را مقایسه می‌کند',
                '== دقیق‌تر از === است',
                'هیچ تفاوتی ندارند',
                '== فقط برای رشته‌هاست',
                'نمی‌دانم'
            ],
            correct: 0
        },
        {
            text: 'async/await برای چه کاری استفاده می‌شود؟',
            options: [
                'مدیریت ساده‌تر کدهای ناهمزمان',
                'ساخت استایل',
                'تعریف متغیر',
                'ساخت حلقه',
                'نمی‌دانم'
            ],
            correct: 0
        },
        {
            text: 'localStorage چه کاربردی دارد؟',
            options: [
                'ذخیره داده در مرورگر',
                'اجرای فایل HTML',
                'ساخت API',
                'طراحی صفحه',
                'نمی‌دانم'
            ],
            correct: 0
        },
        {
            text: 'API بیشتر برای چه چیزی استفاده می‌شود؟',
            options: [
                'ارتباط بین برنامه‌ها و تبادل داده',
                'رنگ دادن به دکمه‌ها',
                'نگهداری متن در حافظه',
                'ایجاد حلقه',
                'نمی‌دانم'
            ],
            correct: 0
        }
    ],

    advanced: [
        {
            text: 'Singleton چه هدفی دارد؟',
            options: [
                'فقط یک نمونه از کلاس ساخته شود',
                'چند نمونه ساخته شود',
                'فقط برای UI است',
                'فقط برای داده است',
                'نمی‌دانم'
            ],
            correct: 0
        },
        {
            text: 'Microservice چه کاری انجام می‌دهد؟',
            options: [
                'تقسیم سیستم به سرویس‌های کوچک',
                'افزایش حجم CSS',
                'ساخت HTML',
                'حذف دیتابیس',
                'نمی‌دانم'
            ],
            correct: 0
        },
        {
            text: 'Dependency Injection چه مزیتی دارد؟',
            options: [
                'کاهش وابستگی و تست‌پذیری بهتر',
                'ساخت UI',
                'افزایش CSS',
                'حذف کلاس‌ها',
                'نمی‌دانم'
            ],
            correct: 0
        },
        {
            text: 'Caching چه هدفی دارد؟',
            options: [
                'افزایش سرعت با ذخیره داده‌های پرتکرار',
                'حذف خطا',
                'ساخت صفحه',
                'تغییر HTML',
                'نمی‌دانم'
            ],
            correct: 0
        },
        {
            text: 'Load Balancing چه می‌کند؟',
            options: [
                'توزیع درخواست بین سرورها',
                'ذخیره فایل',
                'رمزنگاری',
                'ساخت تابع',
                'نمی‌دانم'
            ],
            correct: 0
        }
    ]
};

// ==================== ASSESSMENT MANAGER ====================

// وضعیت
let assessmentState = {
    currentQuestionIndex: 0,
    totalQuestions: 6,
    selfReportedLevel: null,
    questionSet: [],
    answers: [],
    detectedLevel: null,
    correctCount: 0,
    favoriteLanguage: '',
    currentLevel: 1
};

let selectedLanguage = "";

// ==================== START ====================
function startAssessment(){

    assessmentState.currentQuestionIndex = 0;

    document.getElementById("start-container").style.display="none";
    document.getElementById("nav-buttons").style.display="flex";

    showSelfReportQuestion();
    updateProgress();
}

// ==================== LEVEL ====================
function showSelfReportQuestion(){

    document.getElementById("question-container").innerHTML=`
    <div class="question-block">
    <h3>🧪 سطح برنامه نویسی شما چقدر است؟</h3>

    <div class="options-list">

    <div class="option-item" onclick="selectSelfReport('مبتدی',this)">🟢 مبتدی</div>
    <div class="option-item" onclick="selectSelfReport('پیشرفته',this)">🟡 پیشرفته</div>
    <div class="option-item" onclick="selectSelfReport('حرفه‌ای',this)">🔴 حرفه‌ای</div>

    </div>
    </div>
    `;

    document.getElementById("next-btn").disabled=true;
}

function selectSelfReport(level,el){

    assessmentState.selfReportedLevel=level;

    if(level==="مبتدی"){
        assessmentState.questionSet=[...questions.beginner];
    } else if(level==="پیشرفته"){
        assessmentState.questionSet=[...questions.intermediate];
    } else {
        assessmentState.questionSet=[...questions.advanced];
    }

    document.querySelectorAll(".option-item")
    .forEach(x=>x.classList.remove("selected"));

    el.classList.add("selected");

    document.getElementById("next-btn").disabled=false;
}

// ==================== QUESTIONS ====================
function showQuestion(index){

    let q=assessmentState.questionSet[index];

    document.getElementById("question-container").innerHTML=`
    <div class="question-block animate">

    <h3>${q.text}</h3>

    <div class="options-list">
    ${q.options.map((o,i)=>`
    <div class="option-item"
    onclick="selectAnswer(${index},${i},this)">
    <span>${String.fromCharCode(1569+i)}) ${o}</span>
    </div>
    `).join("")}
    </div>

    </div>
    `;

    updateNavButtons();
    updateProgress();
}

function selectAnswer(q,a,el){

    assessmentState.answers[q]=a;

    let sound=document.getElementById("tick-sound");
    if(sound){
        sound.currentTime=0;
        sound.play();
    }

    document.querySelectorAll(".option-item")
    .forEach(x=>x.classList.remove("selected"));

    el.classList.add("selected");

    updateNavButtons();
}

// ==================== NAV ====================
function nextQuestion(){

    assessmentState.currentQuestionIndex++;

    if(assessmentState.currentQuestionIndex < 6){
        showQuestion(assessmentState.currentQuestionIndex-1);
    }
}

function prevQuestion(){

    assessmentState.currentQuestionIndex--;

    if(assessmentState.currentQuestionIndex===0){
        showSelfReportQuestion();
    }else{
        showQuestion(assessmentState.currentQuestionIndex-1);
    }

    updateProgress();
}

function updateNavButtons(){

    let next=document.getElementById("next-btn");

    if(assessmentState.currentQuestionIndex===5){
        next.innerHTML="✅ پایان سنجش";
        next.onclick=finishAssessment;
    }else{
        next.innerHTML="بعدی →";
        next.onclick=nextQuestion;
    }
}

// ==================== PROGRESS ====================
function updateProgress(){

    let current=assessmentState.currentQuestionIndex+1;

    document.getElementById("current-question")
    .innerText=current.toLocaleString("fa-IR");

    document.getElementById("total-questions").innerText="۶";

    let percent=(current/6)*100;
    document.getElementById("progress-fill").style.width=percent+"%";
}

// ==================== FINISH ====================
function finishAssessment(){

    let score=0;

    assessmentState.questionSet.forEach((q,i)=>{
        if(assessmentState.answers[i]===q.correct) score++;
    });

    assessmentState.correctCount=score;

    if(score>=4) assessmentState.detectedLevel="حرفه‌ای";
    else if(score>=2) assessmentState.detectedLevel="پیشرفته";
    else assessmentState.detectedLevel="مبتدی";

    showLanguageQuestion();
}

// ==================== LANGUAGE (🔥 خفن) ====================
function showLanguageQuestion(){

document.getElementById("nav-buttons").style.display="none";

document.getElementById("question-container").innerHTML=`

<div class="question-block animate">

<h3>🎯 زبان برنامه نویسی مورد علاقه شما؟</h3>

<div class="language-options">
  <div class="lang-item" onclick="selectLang('JavaScript',this)">JavaScript</div>
  <div class="lang-item" onclick="selectLang('Python',this)">Python</div>
  <div class="lang-item" onclick="selectLang('Java',this)">Java</div>
  <div class="lang-item" onclick="selectLang('C++',this)">C++</div>
</div>

<input 
id="language-input"
class="input"
placeholder="یا خودت بنویس..."
oninput="manualLang()">

<button 
class="btn btn-primary"
id="lang-btn"
onclick="saveLanguage()"
disabled>

🚀 ادامه

</button>

</div>
`;
}

// انتخاب
function selectLang(lang,el){

  selectedLanguage = lang;

  document.querySelectorAll(".lang-item")
  .forEach(x => x.classList.remove("active"));

  el.classList.add("active");

  document.getElementById("language-input").value = lang;

  document.getElementById("lang-btn").disabled = false;
}

// تایپ دستی
function manualLang(){

  const value = document.getElementById("language-input").value.trim();

  selectedLanguage = value;

  document.querySelectorAll(".lang-item")
  .forEach(x => x.classList.remove("active"));

  document.getElementById("lang-btn").disabled = !value;
}

// ==================== SAVE (🔥 فیکس شده کامل) ====================
function saveLanguage(){

  let lang = selectedLanguage || document.getElementById("language-input").value.trim();

  if(!lang){
    alert("یه زبان انتخاب کن 😄");
    return;
  }

  let users = JSON.parse(localStorage.getItem("users")) || [];
  let session = JSON.parse(localStorage.getItem("session"));

  if(!session){
    alert("لاگین نیستی");
    return;
  }

  let user = users.find(u => u.id === session.id);

  if(user){
    user.favorite_language = lang;
    user.detected_level = assessmentState.detectedLevel;
    localStorage.setItem("users", JSON.stringify(users));
  }

  localStorage.setItem("assessment", JSON.stringify({
    detected: assessmentState.detectedLevel,
    correct_count: assessmentState.correctCount,
    language: lang,
    date: new Date()
  }));

  window.location.href="ideas.html";
}
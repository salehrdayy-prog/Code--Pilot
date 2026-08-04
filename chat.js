// ==================== CHAT MANAGER ====================

// وضعیت چت
let chatState = {
    projectId: null,
    projectContext: '',
    messages: [],
    isOpen: true,
};

// مقداردهی اولیه چت
function initChat(projectId, projectTitle, projectType) {
    chatState.projectId = projectId;
    chatState.projectContext = `پروژه: ${projectTitle} (${projectType})`;
    
    // بازیابی تاریخچه
    const saved = Storage.getChat();
    if (saved.length > 0) {
        chatState.messages = saved;
        renderMessages();
    } else {
        // پیام خوش‌آمدگویی
        const assessment = Storage.getAssessment();
        const level = assessment ? assessment.detected : 'مبتدی';
        
        addBotMessage(`سلام! من دستیار برنامه‌نویس هوشمندت هستم 🤖
        
بر اساس سنجش، سطح برنامه‌نویسی تو **${level}** است.

من اینجام تا توی ساخت **${projectTitle}** کمکت کنم. هر سوالی داری بپرس!`);
    }
}

// ارسال پیام
function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // پیام کاربر
    addUserMessage(message);
    input.value = '';
    
    // چک کردن محدودیت چت (فقط پروژه فعلی)
    if (isOffTopic(message)) {
        addBotMessage('متأسفم، من در این مرحله فقط می‌تونم درباره **پروژه فعلی** کمکت کنم. برای پروژه جدید، لطفاً از منوی «بازگشت به اول» استفاده کن.');
        return;
    }
    
    // تولید پاسخ
    setTimeout(() => {
        const response = generateResponse(message);
        addBotMessage(response);
    }, 800 + Math.random() * 1200);
}

// تشخیص سوال خارج از موضوع
function isOffTopic(message) {
    const offTopicKeywords = [
        'پروژه جدید', 'برنامه جدید', 'از اول', 'پروژه دیگه',
        'بازی جدید', 'سایت جدید', 'new project', 'another project'
    ];
    
    const msg = message.toLowerCase();
    return offTopicKeywords.some(keyword => msg.includes(keyword));
}

// تولید پاسخ
function generateResponse(message) {
    const msg = message.toLowerCase();
    const assessment = Storage.getAssessment();
    const level = assessment ? assessment.detected : 'مبتدی';
    
    // پاسخ‌های پیش‌فرض بر اساس سطح
    if (msg.includes('چطور') || msg.includes('چگونه') || msg.includes('چجوری')) {
        if (level === 'مبتدی') {
            return `بذار قدم‌به‌قدم توضیح بدم:\n\n۱. اول این بخش رو ببین\n۲. بعد کد رو خط‌به‌خط با هم بررسی کنیم\n۳. هر جا سوال داشتی بپرس\n\nکدوم بخش رو می‌خوای توضیح بدم؟`;
        } else {
            return `برای این کار چندتا راه داریم:\n- روش سریع: [توضیح فنی]\n- روش بهینه: [توضیح پیشرفته]\n\nکدوم رو ترجیح میدی؟`;
        }
    }
    
    if (msg.includes('خطا') || msg.includes('ارور') || msg.includes('error') || msg.includes('باگ')) {
        return `بیا با هم خطا رو بررسی کنیم:\n\n۱. کدت رو چک کن\n۲. مطمئن شو syntax درسته\n۳. ببین متغیرها رو درست تعریف کردی\n\nاگه پیام خطا رو بدی، دقیق‌تر می‌تونم کمک کنم.`;
    }
    
    if (msg.includes('ساده') || msg.includes('آسون') || msg.includes('راحت')) {
        return `کاملاً درسته. بیا یه نسخه ساده‌ترش رو با هم ببینیم:\n\n\`\`\`javascript\n// نسخه ساده شده\nfunction simple() {\n  // کد ساده اینجا\n}\n\`\`\`\n\nمی‌خوای بیشتر توضیح بدم؟`;
    }
    
    if (msg.includes('بهتر') || msg.includes('بهینه') || msg.includes('حرفه‌ای')) {
        return `برای بهینه‌سازی این بخش:\n\n۱. از [روش پیشنهادی] استفاده کن\n۲. کدت رو تمیزتر بنویس\n۳. performance رو چک کن\n\nنسخه بهینه‌شده:\n\`\`\`javascript\n// کد بهینه\n\`\`\``;
    }
    
    if (msg.includes('چرا') || msg.includes('دلیل')) {
        return `سوال خوبی پرسیدی!\n\nدلیلش اینه که [توضیح فنی].\n\nاگه می‌خوای عمیق‌تر بررسی کنیم، بگو تا بیشتر توضیح بدم.`;
    }
    
    // پاسخ عمومی
    const generalResponses = [
        `متوجه شدم. بذار دقیق‌تر بررسی کنم...\n\nبرای این موضوع، پیشنهاد من اینه که [پیشنهاد]. موافقی؟`,
        `باشه، بیا با هم حلش کنیم.\n\nاول ببینیم کد فعلی چی داره، بعد تغییرش می‌دیم.`,
        `سوال خوبی پرسیدی! برای جواب دادن، نیاز دارم یه کم بیشتر بدونی...`,
        `اوکی، این بخش رو می‌تونیم چندجور انجام بدیم. کدوم روش رو ترجیح میدی؟`,
    ];
    
    return generalResponses[Math.floor(Math.random() * generalResponses.length)];
}

// افزودن پیام کاربر
function addUserMessage(text) {
    const message = {
        role: 'user',
        text: text,
    };
    
    chatState.messages.push(message);
    Storage.addChatMessage(message);
    renderMessages();
}

// افزودن پیام بات
function addBotMessage(text) {
    const message = {
        role: 'assistant',
        text: text,
    };
    
    chatState.messages.push(message);
    Storage.addChatMessage(message);
    renderMessages();
}

// نمایش پیام‌ها
function renderMessages() {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    
    container.innerHTML = chatState.messages.map(msg => `
        <div class="chat-msg ${msg.role}">
            <span class="msg-avatar">${msg.role === 'user' ? '👤' : '🤖'}</span>
            <div class="msg-content">
                <p>${msg.text.replace(/\n/g, '<br>')}</p>
            </div>
        </div>
    `).join('');
    
    // اسکرول به پایین
    container.scrollTop = container.scrollHeight;
}

// باز و بسته کردن چت
function toggleChat() {
    const panel = document.getElementById('chat-panel');
    panel.classList.toggle('collapsed');
    chatState.isOpen = !chatState.isOpen;
    
    const toggle = panel.querySelector('.chat-toggle');
    toggle.textContent = chatState.isOpen ? '▼' : '▲';
}
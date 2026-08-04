(function () {
    function log(msg, type = "info") {
        console[type](msg);
        const box = document.getElementById("debug-box");
        if (box) {
            const p = document.createElement("div");
            p.textContent = msg;
            p.style.color = type === "error" ? "red" : "lime";
            box.appendChild(p);
        }
    }

    function createDebugBox() {
        const box = document.createElement("div");
        box.id = "debug-box";
        box.style.position = "fixed";
        box.style.bottom = "0";
        box.style.left = "0";
        box.style.width = "100%";
        box.style.maxHeight = "200px";
        box.style.overflow = "auto";
        box.style.background = "#000";
        box.style.color = "#0f0";
        box.style.fontSize = "12px";
        box.style.zIndex = "9999";
        box.style.padding = "5px";
        document.body.appendChild(box);
    }

    function checkCSS() {
        const links = document.querySelectorAll("link[rel='stylesheet']");
        links.forEach(link => {
            const href = link.getAttribute("href");

            fetch(href)
                .then(res => {
                    if (res.ok) {
                        log("✅ CSS لود شد: " + href);
                    } else {
                        log("❌ CSS پیدا نشد: " + href, "error");
                    }
                })
                .catch(() => {
                    log("❌ CSS خطا: " + href, "error");
                });
        });
    }

    function checkJS() {
        const scripts = document.querySelectorAll("script[src]");
        scripts.forEach(script => {
            const src = script.getAttribute("src");

            fetch(src)
                .then(res => {
                    if (res.ok) {
                        log("✅ JS لود شد: " + src);
                    } else {
                        log("❌ JS پیدا نشد: " + src, "error");
                    }
                })
                .catch(() => {
                    log("❌ JS خطا: " + src, "error");
                });
        });
    }

    window.addEventListener("load", () => {
        createDebugBox();
        log("🔍 شروع بررسی فایل‌ها...");
        checkCSS();
        checkJS();
    });
})();
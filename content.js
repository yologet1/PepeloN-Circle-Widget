console.log('[Pepelon] Content.js loaded!');
function isPepelonShortOrDotLink(href) {
  // pepelonmyown.ru/type.id (точка)
  if (/^https:\/\/pepelonmyown\.ru\/[a-z]+\.[a-z0-9]{6,32}$/i.test(href)) return 'dot';
  // pepelonmyown.ru/bOcZic (старый формат, минимум 6 символов)
  if (/^https:\/\/pepelonmyown\.ru\/[a-z0-9]{6,32}$/i.test(href)) return 'short';
  return false;
}
function processAllLinks() {
  document.querySelectorAll('a').forEach(link => {
    if (link.dataset.pepelonWrapped === "1") return;
    const type = isPepelonShortOrDotLink(link.href);
    if (!type) return;
    // id: для dot — после последней точки; для short — всё после /
    const id = (type === 'dot')
      ? link.href.split('.').pop()
      : link.href.split('/').pop();
    tryVideo(`https://pepelonmyown.ru/c/${id}.mp4`, link, () => {
      tryVideo(`https://pepelonmyown.ru/c/${id}.webm`, link, () => {
        checkImage(`c/${id}`, ["gif", "png", "jpg", "jpeg"], link, () => {
          tryVideo(`https://pepelonmyown.ru/upload/${id}.mp4`, link, () => {
            tryVideo(`https://pepelonmyown.ru/upload/${id}.webm`, link, () => {
              checkImage(`upload/${id}`, ["gif", "png", "jpg", "jpeg"], link);
            });
          });
        });
      });
    });
    link.dataset.pepelonWrapped = "1";
    if (link.parentElement) link.parentElement.dataset.pepelonWrapped = "1";
  });
}
// Остальной код без изменений (tryVideo, tryImage и т.д.)
function tryVideo(videoUrl, link, onerror) {
  const video = document.createElement("video");
  video.src = videoUrl;
  video.controls = true;
  video.autoplay = true;
  video.muted = true;
  video.loop = true;
  video.className = "pepelon-circle-video";
  video.onloadedmetadata = () => wrapAndReplace(link, video);
  video.onerror = () => { if (onerror) onerror(); };
}
function tryImage(imgUrl, link, onerror) {
  const img = new Image();
  img.src = imgUrl;
  img.style.maxWidth = "300px";
  img.style.display = "block";
  img.onload = () => wrapAndReplace(link, img);
  img.onerror = () => { if (onerror) onerror(); };
}
function checkImage(base, extensions, link, onerror) {
  if (extensions.length === 0) {
    if (onerror) onerror();
    return;
  }
  const ext = extensions.shift();
  const imgUrl = `https://pepelonmyown.ru/${base}.${ext}`;
  tryImage(imgUrl, link, () => checkImage(base, extensions, link, onerror));
}
function wrapAndReplace(link, media) {
  const wrapper = document.createElement("a");
  wrapper.href = link.href;
  wrapper.target = "_blank";
  wrapper.dataset.pepelonWrapped = "1";
  wrapper.appendChild(media);
  link.replaceWith(wrapper);
}
function enableAutoPauseForCircleVideos() {
  const observer = new window.IntersectionObserver((entries) => {
    for (let entry of entries) {
      if (!(entry.target instanceof HTMLVideoElement)) continue;
      if (entry.isIntersecting) {
        if (entry.target.paused) entry.target.play().catch(() => {});
      } else {
        entry.target.pause();
      }
    }
  }, { threshold: 0.15 });

  document.querySelectorAll('video.pepelon-circle-video').forEach(video => {
    observer.observe(video);
  });

  const mo = new MutationObserver(() => {
    document.querySelectorAll('video.pepelon-circle-video:not([data-autopause])').forEach(video => {
      observer.observe(video);
      video.dataset.autopause = "1";
    });
  });
  mo.observe(document.body, { childList: true, subtree: true });
}

setInterval(processAllLinks, 3000);

enableAutoPauseForCircleVideos();

(function(){
  // QRious loader
  function ensureQRiousLoaded(cb) {
    if (window.QRious) return cb();
    let s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/qrious@4.0.2/dist/qrious.min.js';
    s.onload = cb;
    document.head.appendChild(s);
  }
  if (window.pepelonCircleWidgetLoaded) return;
  window.pepelonCircleWidgetLoaded = true;
  let widget = null, overlay = null, recorder = null, stream = null, chunks = [], blob = null, currentSlide = 0, pollingTimeout = null, myID = '';
  let chatBtn = null, qrIsActive = false;

  function hideAll() {
    if(widget) widget.remove();
    if(overlay) overlay.remove();
    widget = null; overlay = null; myID=''; qrIsActive=false; if(pollingTimeout) clearTimeout(pollingTimeout);
    if(stream) try { stream.getTracks().forEach(t=>t.stop()); } catch(e){}
    document.removeEventListener('mousedown', onDocMouseDown, true);
  }

  function onDocMouseDown(e) {
    if (widget && !widget.contains(e.target)) {
      hideAll();
    }
  }

  async function pollForLink(linkBox, qrStatus, qrCanvas, qrGif, qrBackBtn, showControls) {
    if (!myID) return;
    const resp = await fetch('https://pepelonmyown.ru/get_link.php?to=' + myID);
    const link = await resp.text();
    if (link && link.length > 5) {
      linkBox.value = link;
      qrStatus.textContent = "Кружок с телефона получен!";
      setTimeout(()=>{
        showControls();
        qrCanvas.style.display = "none";
        qrBackBtn.style.display = "none";
        qrGif.style.display = "block";
        qrStatus.textContent = "";
        myID = '';
        qrIsActive = false;
      }, 600);
      if (pollingTimeout) clearTimeout(pollingTimeout);
    } else {
      pollingTimeout = setTimeout(()=>pollForLink(linkBox, qrStatus, qrCanvas, qrGif, qrBackBtn, showControls), 1100);
    }
  }

  function showCarousel(slide=0){
    hideAll();
    // Стили
    if(!document.getElementById('qr-style-btn')) {
      let style = document.createElement('style');
      style.id = 'qr-style-btn';
      style.textContent = `
.pepelon-fabrow { width:97%;max-width:320px;display:flex;gap:8px;justify-content:center;margin:13px auto 1px auto;}
.pepelon-fabrow button { flex:1; background: linear-gradient(90deg,#816aff 0%,#b97aff 96%); color: #fff; font-size: 1.06em; font-family: inherit; border: none; border-radius: 13px; box-shadow: 0 1.7px 7px #ad97ff25,0 2px 11px #1d012044; padding: 7px 0 6px 0; cursor:pointer; transition: filter .14s, box-shadow .13s; font-weight: 500; letter-spacing: .01em;}
#slide0, #slide1 { min-height: 430px; }
.pepelon-fabrow button:disabled { background: #3a3050 !important; color: #bfb7da !important; opacity: .77; cursor: default; box-shadow: none; }
.carousel-dot { width: 13px; height: 13px; border-radius:50%; background: #ae8dff; border: 2px solid #fff; margin: 0 4px; cursor: pointer; opacity: 0.6; transition: opacity .18s; display:inline-block; }
.carousel-dot.active { opacity: 1; background: #c6afff; }
#carousel-bar { margin: 0 auto 10px auto; display:flex; justify-content:center; align-items:center; }
#qrTextlink { display: block; margin: 11px auto -1px auto; text-align: center; color: #cac6ff; font-size:1.02em; font-family: inherit; text-shadow: 0px 1px 8px #8a3fff22; letter-spacing:.01em; cursor:pointer; transition: color .13s; user-select: none;}
#qrTextlink:hover { color: #ad79ff; text-decoration: underline; }
#qrBackBtn { display: none; margin: 20px auto 0 auto; background: linear-gradient(90deg,#806cff 0%,#ab7cf7 100%); color: #fff; border: none; width: 120px; padding: 7px 0 6px 0; font-size: 1.01em; font-family: inherit; border-radius: 13px; box-shadow: 0 2.5px 13px #b8a4fe44, 0 1.5px 9px #0001; cursor: pointer; transition: box-shadow .13s, filter .14s; }
#circleMediaBox { position:relative;width:220px;height:220px;margin:5px auto 0px auto; }
#circleMediaBox img, #circleMediaBox video { width:220px; height:220px; position:absolute; left:0; top:0; object-fit:cover; border-radius:50%; background:#0a0515; z-index:1; display:block;}
#circleMediaBox video { z-index:2; }
#qrCanvas { display: none; position: absolute; left: 28px; top: 0; width: 164px; height: 164px; border-radius: 16px; box-shadow: 0 2px 14px #af9bff; background: #fff; margin-top: 40px; z-index: 3;}
#dropZone { width: 93%; max-width: 400px; min-height: 300px; margin: 8px auto 28px auto; background: #181034; color: #cab9ff; border-radius: 18px; border: 3px dashed #b3a2fa; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 1.22em; font-family: inherit; font-weight: 500; letter-spacing: .01em; transition: background .18s, border-color .18s, color .13s; text-align:center; box-shadow: 0 2px 16px #836cff16; outline: none; word-break: break-word; line-height: 1.3;}
#dropZone.active { background: #21194d; color: #c1ffef; border-color: #efa0ff;}
      `;
      document.head.appendChild(style);
    }
    // overlay — только фон (без обработчика клика!)
    overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;z-index:2147483646;left:0;top:0;width:100vw;height:100vh;background:transparent;pointer-events:auto;';
    document.body.appendChild(overlay);

    widget = document.createElement('div');
    widget.style.cssText = `
      position:fixed;right:4px;bottom:95px;z-index:2147483647;min-width:300px;pointer-events:auto;
      background: rgba(25, 17, 32, 0.6);border-radius:20px;box-shadow:0 4px 24px #000b;
      padding:16px 12px 16px 12px;width:330px;text-align:center;border:2px solid #4831a8;font-family:inherit;`;
    widget.innerHTML = `
      <div id="widget-title" style="text-align:center;font-weight:bold;font-size:1.15em;color:#c5bafe;margin-bottom:7px;">
        PepeloN
      </div>
      <div id="carousel-bar">
        <button id="dot0" class="carousel-dot${!slide?' active':''}" aria-label="К шагу 1"></button>
        <button id="dot1" class="carousel-dot${slide?' active':''}" aria-label="К шагу 2"></button>
      </div>
      <div style="display:flex;justify-content:center;align-items:center;">
        <div id="slide0" style="display:${slide?'none':'block'};min-height:330px; height:330px; width:99%;">
          <div id="circleMediaBox">
            <img id="standbyGif" src="${chrome.runtime.getURL && chrome.runtime.getURL('standby.gif')}" alt="Ожидание">
            <video id="preview" autoplay muted playsinline style="display:none;"></video>
            <canvas id="qrCanvas" width="164" height="164"></canvas>
          </div>
          <button id="qrBackBtn">Назад</button>
          <div class="pepelon-fabrow" id="recControls">
             <button id="start">Записать</button>
             <button id="stop" disabled>Остановить</button>
             <button id="upload" disabled>Загрузить</button>
          </div>
          <span id="qrTextlink">QR-код для записи с телефона</span>
          <div id="progress" style="color:#bff;font-size:.97em;margin-top:11px;"></div>
          <div id="qrStatus" style="margin-top:7px;color:#80ffc6;font-size:.99em;min-height:14px;"></div>
        </div>
        <div id="slide1" style="display:${slide?'block':'none'};min-height:330px; height:330px; width:99%;">
          <div id="dropZone">Перетащи или выбери файл</div>
          <input type="file" id="uploadInput" style="display:none">
          <div id="uploadStatus" style="color:#bff;margin:0px 0 17px 0;min-height:26px;"></div>
        </div>
      </div>
      <input id="linkBox" style="width:96%;margin:1px auto 0 auto;background:#23213a;border-radius:11px;padding:8px 4px;font-size:1.04em;min-height:20px;color:#e1f4ff;text-align:center;border:1.5px solid #312a47;" readonly placeholder="Ссылка появится здесь">
    `;
    document.body.appendChild(widget);

    document.addEventListener('mousedown', onDocMouseDown, true);

    widget.querySelector('#dot0').onclick = e=>{e.stopPropagation();showCarousel(0);};
    widget.querySelector('#dot1').onclick = e=>{e.stopPropagation();showCarousel(1);};
    currentSlide = slide;
    if (slide === 1) {
        const dropZone = widget.querySelector('#dropZone');
        if (dropZone) setTimeout(() => dropZone.focus(), 30);
    }

    const standbyGif = widget.querySelector('#standbyGif');
    const qrCanvas = widget.querySelector('#qrCanvas');
    const qrTextlink = widget.querySelector('#qrTextlink');
    const qrBackBtn = widget.querySelector('#qrBackBtn');
    const qrStatus = widget.querySelector('#qrStatus');
    const linkBox = widget.querySelector('#linkBox');
    const startBtn = widget.querySelector('#start');
    const stopBtn = widget.querySelector('#stop');
    const uploadBtn = widget.querySelector('#upload');
    const recControls = widget.querySelector('#recControls');
    const progress = widget.querySelector('#progress');
    const preview = widget.querySelector('#preview');
    recorder = null; stream = null; chunks = []; blob = null;
    function setMediaView(target) {
      standbyGif.style.display = (target === "gif") ? "block" : "none";
      preview.style.display = (target === "video") ? "block" : "none";
      qrCanvas.style.display = (target === "qr") ? "block" : "none";
    }
    function showQR() {
      qrIsActive = true;
      recControls.style.display = "none";
      setMediaView("qr");
      qrTextlink.style.display = "none";
      qrBackBtn.style.display = "block";
      qrStatus.textContent = "Отсканируйте QR с телефона";
      progress.textContent = "";
    }
    function showControls() {
      qrIsActive = false;
      setMediaView("gif");
      qrBackBtn.style.display = "none";
      recControls.style.display = "flex";
      qrTextlink.style.display = "block";
      qrStatus.textContent = "";
      progress.textContent = "";
    }
    if(qrTextlink) qrTextlink.onclick = function(e) {
      e.stopPropagation();
      ensureQRiousLoaded(()=>{
        myID = "m" + Math.random().toString(36).slice(2,10);
        const qrurl = "https://pepelonmyown.ru/mobile_upload.html?to=" + myID;
        showQR();
        new QRious({ element: qrCanvas, value: qrurl, size:164 });
        pollForLink(linkBox, qrStatus, qrCanvas, standbyGif, qrBackBtn, showControls);
      });
    };
    if(qrBackBtn) qrBackBtn.onclick = function(e){
      e.stopPropagation();
      showControls();
      if (pollingTimeout) clearTimeout(pollingTimeout);
      myID='';
    };
    if(startBtn) startBtn.onclick = async function(e) {
      e.stopPropagation();
      startBtn.disabled = true;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 480 }, audio: true });
        setMediaView("video");
        preview.style.zIndex = 2;
        preview.srcObject = stream;
        chunks = [];
        recorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = () => {
          stream.getTracks().forEach(t => t.stop());
          blob = new Blob(chunks, { type: 'video/webm' });
          uploadBtn.disabled = false;
          progress.textContent = "Готово! Нажмите 'Загрузить'.";
          preview.src = URL.createObjectURL(blob);
          preview.srcObject = null;
          preview.style.display = "block";
          preview.play();
        };
        recorder.start();
        stopBtn.disabled = false;
        uploadBtn.disabled = true;
        progress.textContent = "Запись...";
      } catch (e) {
        progress.textContent = "Нет доступа к камере! (" + e.name + ")";
        setMediaView("gif");
        startBtn.disabled = false;
      }
    };
    if(stopBtn) stopBtn.onclick = function(e){
      e.stopPropagation();
      if (recorder && recorder.state === "recording") {
        recorder.stop();
        startBtn.disabled = false;
        stopBtn.disabled = true;
        progress.textContent = "Обработка...";
      }
    };
    if(uploadBtn) uploadBtn.onclick = async function(e){
      e.stopPropagation();
      if (blob) {
        progress.textContent = "Загрузка файла...";
        const formData = new FormData();
        formData.append('file', blob, 'circle.webm');
        try {
          const resp = await fetch("https://pepelonmyown.ru/upload1.php", { method: "POST", body: formData });
          const data = await resp.json();
          if (data.link) {
            linkBox.value = data.link;
            progress.textContent = "Готово! Кружок доступен по ссылке!";
          } else {
            progress.textContent = data.error || "Ошибка загрузки.";
          }
        } catch (error) {
          progress.textContent = "Сетевая ошибка: " + error;
        } finally {
          startBtn.disabled = false;
          uploadBtn.disabled = true;
        }
      }
    };
    // --- Загрузка файлов, slide1 ---
    const dropZone = widget.querySelector('#dropZone');
    const uploadInput = widget.querySelector('#uploadInput');
    const uploadStatus = widget.querySelector('#uploadStatus');

    if (dropZone && uploadInput) {
        dropZone.setAttribute('tabindex', '0'); // теперь Ctrl+V и Paste работают когда зона в фокусе!
        dropZone.onclick = function(e) {
            e.stopPropagation();
            uploadInput.click();
        };
        dropZone.ondragover = e => {
            e.preventDefault();
            dropZone.classList.add('active');
        };
        dropZone.ondragleave = e => {
            e.preventDefault();
            dropZone.classList.remove('active');
        };
        dropZone.ondrop = function(e) {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('active');
            const file = e.dataTransfer?.files && e.dataTransfer.files[0];
            if (file) uploadFile(file);
        };
        dropZone.addEventListener('paste', function(e) {
            const items = (e.clipboardData || window.clipboardData).items;
            let fileFound = false;
            for (let i = 0; i < items.length; i++) {
                if (items[i].kind === 'file') {
                    const file = items[i].getAsFile();
                    if (file) {
                        uploadFile(file);
                        fileFound = true;
                        e.preventDefault();
                        break;
                    }
                }
            }
    // Можно добавить визуальный отклик "файл вставлен"
            if (fileFound) dropZone.classList.add('active');
            setTimeout(() => dropZone.classList.remove('active'), 600); // подсветка на мгновение
        });
        uploadInput.removeAttribute('accept');
        uploadInput.onchange = function(e) {
            e.stopPropagation();
            if (this.files && this.files[0]) uploadFile(this.files[0]);
        };
        function uploadFile(file) {
            if (!file) return;
            if (file.size > 100 * 1024 * 1024) {
                uploadStatus.textContent = "Файл слишком большой!";
                return;
            }
            uploadStatus.textContent = "Загрузка...";
            const formData = new FormData();
            formData.append('file', file, file.name);
            fetch("https://pepelonmyown.ru/upload2.php", { method: "POST", body: formData })
                .then(r => r.json()).then(data => {
                    if (data.link) {
                        linkBox.value = "https://pepelonmyown.ru" + data.link;
                        uploadStatus.innerHTML = `<span style="color:#bfffbc">Готово!</span>`;
                    } else {
                        uploadStatus.textContent = data.error || "Ошибка загрузки.";
                    }
                }).catch(() => uploadStatus.textContent = "Ошибка сети.");
            }
        }
        if (linkBox) linkBox.onclick = function() {
            if (linkBox.value && linkBox.value.length > 0) {
                linkBox.select();
                document.execCommand('copy');
            }
        };

    // overlay — больше НИКАКИХ обработчиков тут нет!
  }
  function chatBtnWatcher() {
    function updateBtnPlacement() {
      const placeholder = Array.from(document.querySelectorAll('div.chat-wysiwyg-input__placeholder'))
        .find(el => el.textContent && el.textContent.trim().includes('Отправить сообщение'));
      if (placeholder && !chatBtn) {
        chatBtn = document.createElement('button');
        chatBtn.style = `
            position: fixed; right: 85px; bottom: 62px; z-index: 2147483647;pointer-events:auto;
            width: 20px; height: 10px;
            background: transparent;
            color: #fff; font-size: 1.15em; border: 2px solid #fff; border-radius: 50%;
            padding: 0;
            box-shadow: 0 2px 8px #0005;
            cursor: pointer; font-family: inherit;
            display: flex; align-items: center; justify-content: center;
            transition: filter 0.13s;
        `;
        chatBtn.onclick = e=>{
          e.stopPropagation();
          showCarousel(0);
        };
        document.body.appendChild(chatBtn);
      }
      if (!placeholder && chatBtn) {
        chatBtn.remove();
        chatBtn = null;
      }
    }
    const observer = new MutationObserver(updateBtnPlacement);
    observer.observe(document.body, { childList: true, subtree: true });
    updateBtnPlacement();
  }
  chatBtnWatcher();
})();
















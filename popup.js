console.log('POPUP JS LOADED:', document.getElementById('start'));
let stream, recorder, chunks = [], blob;
const preview = document.getElementById('preview');
const standbyGif = document.getElementById('standbyGif');
const startBtn = document.getElementById('start');
const stopBtn = document.getElementById('stop');
const uploadBtn = document.getElementById('upload');
const linkInput = document.getElementById('link');
const progress = document.getElementById('progress');
const qrBtn = document.getElementById('qrBtn');
const mainActions = document.getElementById('mainActions');
const qrWrap = document.getElementById('qrWrap');
const qrBox = document.getElementById('qr');
const backBtn = document.getElementById('backBtn');

let myID = '';
let pollingTimeout = null;
const ANIMATION = 360;

// --- Кружок на ПК ---
startBtn.addEventListener('click', async () => {
  // Ни fade, ни скрытия mainActions ДО этого момента!
  try {
    // Здесь всё 100% видно!
    standbyGif.style.display = "none";
    preview.style.display = "block";
    // Prompt гарантированно появится!
    stream = await navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 480 }, audio: true });

    preview.srcObject = stream;
    chunks = [];
    recorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
    recorder.ondataavailable = e => chunks.push(e.data);

    recorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      blob = new Blob(chunks, { type: 'video/webm' });
      uploadBtn.disabled = false;
      progress.textContent = "Готово! Нажмите 'Загрузить'.";
      preview.src = URL.createObjectURL(blob);
    };

    recorder.start();
    startBtn.disabled = true;
    stopBtn.disabled = false;
    uploadBtn.disabled = true;
    progress.textContent = "Запись...";

  } catch (e) {
    // Ошибка разрешения или блокировка
    progress.textContent = "Нет доступа к камере! (" + e.name + ")";
    standbyGif.style.display = "block";
    preview.style.display = "none";
  }
});


stopBtn.addEventListener('click', () => {
  recorder.stop();
  startBtn.disabled = false;
  stopBtn.disabled = true;
  progress.textContent = "Обработка...";
  if (!preview.srcObject && (!preview.src || preview.src === "")) {
    standbyGif.style.display = "block";
    preview.style.display = "none";
  }
});

uploadBtn.addEventListener('click', async () => {
  if (!blob) return;
  progress.textContent = "Загрузка файла...";
  const formData = new FormData();
  formData.append('file', blob, 'circle.webm');
  try {
    const resp = await fetch("https://pepelonmyown.ru/upload1.php", {
      method: "POST",
      body: formData
    });
    const data = await resp.json();
    if (data.link) {
      linkInput.value = data.link;
      progress.textContent = "Готово! Кружок доступен по ссылке!";
    } else {
      progress.textContent = data.error || "Ошибка загрузки.";
    }
  } catch (error) {
    progress.textContent = "Сетевая ошибка: " + error;
  }
});

// Копирование ссылки
linkInput.style.cursor = "pointer";
linkInput.addEventListener('click', () => {
  if (linkInput.value) {
    linkInput.select();
    document.execCommand('copy');
    progress.textContent = "Скопировано!";
    setTimeout(() => linkInput.setSelectionRange(0, 0), 150);
  }
});

// QR fade только после главного
qrBtn.addEventListener('click', () => {
  mainActions.classList.add('hide');
  setTimeout(() => {
    qrWrap.classList.remove('hide');
    myID = randomID();
    const url = `https://pepelonmyown.ru/mobile_upload.html?to=${myID}`;
    qrBox.innerHTML = '';
    new QRious({ element: qrBox.appendChild(document.createElement('canvas')), value: url, size: 180 });
    progress.textContent = "Считай QR на телефоне. После записи кружка ссылка появится ниже!";
    pollForLink();
  }, ANIMATION);
});

backBtn.addEventListener('click', () => {
  qrWrap.classList.add('hide');
  setTimeout(() => {
    mainActions.classList.remove('hide');
    progress.textContent = "";
    if (!preview.srcObject && (!preview.src || preview.src === "")) {
      standbyGif.style.display = "block";
      preview.style.display = "none";
    }
  }, ANIMATION);
});

function randomID(len = 8) {
  const dict = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let s = '';
  for (let i = 0; i < len; ++i) s += dict[Math.floor(Math.random() * dict.length)];
  return s;
}

async function pollForLink() {
  if (!myID) return;
  const resp = await fetch('https://pepelonmyown.ru/get_link.php?to=' + myID);
  const link = await resp.text();
  if (link && link.length > 5) {
    linkInput.value = link;
    progress.textContent = "Кружок с телефона получен — можешь скопировать!";
    qrWrap.classList.add('hide');
    setTimeout(() => {
      mainActions.classList.remove('hide');
      if (!preview.srcObject && (!preview.src || preview.src === "")) {
        standbyGif.style.display = "block";
        preview.style.display = "none";
      }
    }, ANIMATION);
    clearTimeout(pollingTimeout);
  } else {
    pollingTimeout = setTimeout(pollForLink, 1200);
  }
}

// В начале QR скрыт
qrWrap.classList.add('hide');
standbyGif.style.display = "block";
preview.style.display = "none";







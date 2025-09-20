let stream, recorder, chunks = [], blob;
const preview = document.getElementById('preview');
const startBtn = document.getElementById('start');
const stopBtn = document.getElementById('stop');
const downloadBtn = document.getElementById('download');
const openUploadBtn = document.getElementById('openUpload');
const linkInput = document.getElementById('link');
const copyBtn = document.getElementById('copy');
const progress = document.getElementById('progress');

startBtn.addEventListener('click', async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 480 }, audio: false }); // убрал аудио для надёжности
    preview.srcObject = stream;
    chunks = [];
    recorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
    recorder.ondataavailable = e => chunks.push(e.data);

    recorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      blob = new Blob(chunks, { type: 'video/webm' });
      downloadBtn.disabled = false;
      progress.textContent = "Готово! Теперь скачайте кружок и загрузите его на pepelonmyown.ru";
    };

    recorder.start();
    startBtn.disabled = true;
    stopBtn.disabled = false;
    downloadBtn.disabled = true;
    progress.textContent = "Запись...";
  } catch (e) {
    progress.textContent = "Нет доступа к камере!";
  }
});

stopBtn.addEventListener('click', () => {
  recorder.stop();
  startBtn.disabled = false;
  stopBtn.disabled = true;
  progress.textContent = "Обработка видео...";
});

downloadBtn.addEventListener('click', () => {
  if (blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "circle.webm";
    a.click();
    URL.revokeObjectURL(url);
  }
});

openUploadBtn.addEventListener('click', () => {
  window.open('https://pepelonmyown.ru');
});

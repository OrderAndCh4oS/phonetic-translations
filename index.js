const textEl = document.getElementById('text');
const resultEl = document.getElementById('result');
const responseTimeEl = document.getElementById('response-time');
const languageEl = document.getElementById('language');
const submitEl = document.getElementById('submit');
const listenEl = document.getElementById('listen');
const genderEl = document.getElementById('gender');
const statusEl = document.getElementById('status');
const stopEl = document.getElementById('stop');
const downloadEl = document.getElementById('download');

submitEl.addEventListener('click', async() => {
    setProcessing();
    const text = textEl.value;
    if(!text) alert('Please enter some text');
    const t0 = performance.now();
    const response = await fetch(
        `https://9k24oe3gyg.execute-api.eu-west-2.amazonaws.com/prod/translate/${languageEl.value}`,
        {
            method: 'post',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({text}),
        });
    const t1 = performance.now();
    responseTimeEl.innerText = (t1 - t0).toFixed(2);
    const result = await response.json();
    resultEl.value = result.translation;
    setProcessingDone();
});

listenEl.addEventListener('click', async() => {
    setProcessing();
    const text = textEl.value;
    if(!text) alert('Please enter some text');
    const response = await fetchTranslation(text);
    await playAudioFromBlob(response)
    setProcessingDone();
});

downloadEl.addEventListener('click', async() => {
    setProcessing();
    const response = await fetchAudio(text);
    await downloadMp3(response)
    setProcessingDone();
});

async function fetchTranslation() {
    const text = getText();
    const t0 = performance.now();
    const response = await fetch(
        `https://9k24oe3gyg.execute-api.eu-west-2.amazonaws.com/prod/translate/${languageEl.value}?audio=true&gender=${genderEl.value}`,
        {
            method: 'post',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({text}),
        });
    const t1 = performance.now();
    responseTimeEl.innerText = (t1 - t0).toFixed(2);
    return response;
}

async function fetchAudio() {
    const text = getText();
    const t0 = performance.now();
    const response = await fetch(
        `https://9k24oe3gyg.execute-api.eu-west-2.amazonaws.com/prod/translate/${languageEl.value}?audio=true&gender=${genderEl.value}`,
        {
            method: 'post',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({text}),
        });
    const t1 = performance.now();
    responseTimeEl.innerText = (t1 - t0).toFixed(2);
    return response;
}

async function playAudioFromBlob(response) {
    try {
        stopEl.style.display = 'inline-block';
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        const clickEventListener = () => {
            audio.pause()
            stopEl.style.display = 'none';
            stopEl.removeEventListener('click', clickEventListener)
        }
        stopEl.addEventListener('click', clickEventListener);
        await audio.play();
    } catch(e) {
        stopEl.style.display = 'none';
    }
}

async function downloadMp3(response) {
    const blob = await response.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.setAttribute("download", 'audio-transcript.mp3');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function getText() {
    const text = textEl.value;
    if(!text) alert('Please enter some text');
    return text;
}

function setProcessing() {
    statusEl.innerText = 'Processing...';
}

function setProcessingDone() {
    statusEl.innerText = 'Done';
    setTimeout(() => {
        statusEl.innerText = '';
    }, 2500);
}

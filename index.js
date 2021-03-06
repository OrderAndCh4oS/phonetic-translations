const textEl = document.getElementById('text');
const resultAlternativesEl = document.getElementById('result-alternatives');
const responseTimeEl = document.getElementById('response-time');
const languageEl = document.getElementById('language');
const genderEl = document.getElementById('gender');
const listenEl = document.getElementById('listen');
const prosodyEl = document.getElementById('prosody');
const prosodyValueEl = document.getElementById('prosody-value');
const stopEl = document.getElementById('stop');
const stopFinalEl = document.getElementById('stop-final');
const submitEl = document.getElementById('submit');
const downloadEl = document.getElementById('download');
const statusEl = document.getElementById('status');
const listenToFinalEl = document.getElementById('listen-to-final');
const downloadFinalEl = document.getElementById('download-final');
const statusFinalEl = document.getElementById('status-final');

const isLetter = (str) => /\p{L}/u.test(str);

let finalTranslation = [];
let playing = false;

submitEl.addEventListener('click', async() => {
    finalTranslation = [];
    resultAlternativesEl.innerHTML = '&nbsp;';
    setProcessing(statusEl);
    const text = textEl.value;
    if(!text) {
        setProcessingDone(statusEl);
        alert('Please enter some text');
        return;
    }
    const t0 = performance.now();
    const response = await fetchTranslation(text, t0);
    const result = await response.json();
    const raw = result.raw;
    for(let i = 0; i < raw.length; i++) {
        let item = raw[i];
        const span = document.createElement('span');
        span.style.position = 'relative';
        if('char' in item) {
            finalTranslation.push(item);
            span.innerText = item.char;
            span.style.color = isLetter(item.char) ? 'red' : 'initial';
        } else if('phonetics' in item) {
            finalTranslation.push({phonetic: item.phonetics[0], word: item.word});
            span.innerText = item.phonetics[0];
            if(item.phonetics.length > 1) {
                makeAlternatesSpan(span, item, i);
            }
        }
        resultAlternativesEl.append(span);
    }
    if(response.status === 200) {
        setProcessingDone(statusEl);
    } else {
        setProcessingError(statusEl)
    }
});

listenEl.addEventListener('click', async() => {
    if(playing) {
        console.log('Already playing');
        return;
    }
    setProcessing(statusEl);
    const text = textEl.value;
    if(!text) {
        setProcessingDone(statusEl);
        alert('Please enter some text');
        return;
    }
    const response = await fetchAudio(text);
    if(response.status === 200) {
        await playAudioFromBlob(response, stopEl);
        setProcessingDone(statusEl);
    } else {
        setProcessingError(statusEl)
    }
});

downloadEl.addEventListener('click', async() => {
    setProcessing(statusEl);
    const text = textEl.value;
    if(!text) {
        setProcessingDone(statusEl);
        alert('Please enter some text');
        return;
    }
    const response = await fetchAudio(text);
    if(response.status === 200) {
        await downloadMp3(response);
        setProcessingDone(statusEl);
    } else {
        setProcessingError(statusEl)
    }
});

listenToFinalEl.addEventListener('click', async() => {
    if(playing) {
        console.log('Already playing');
        return;
    }
    setProcessing(statusFinalEl);
    if(!finalTranslation.length) {
        setProcessingDone(statusFinalEl);
        alert('Please add translate some text first');
        return;
    }
    const response = await fetchFinalAudio();
    if(response.status === 200) {
        await playAudioFromBlob(response, stopFinalEl);
        setProcessingDone(statusFinalEl);
    } else {
        setProcessingError(statusFinalEl)
    }
});

downloadFinalEl.addEventListener('click', async() => {
    setProcessing(statusFinalEl);
    const text = textEl.value;
    if(!text) {
        setProcessingDone(statusFinalEl);
        alert('Please add translate some text first');
        return;
    }
    const response = await fetchFinalAudio(text);
    if(response.status === 200) {
        await downloadMp3(response);
        setProcessingDone(statusFinalEl);
    } else {
        setProcessingError(statusFinalEl)
    }
});

prosodyEl.addEventListener('input', function() {
    prosodyValueEl.value = this.value;
})

async function fetchTranslation(text, t0) {
    const response = await fetch(
        `https://9k24oe3gyg.execute-api.eu-west-2.amazonaws.com/prod/translate/${languageEl.value}`,
        {
            method: 'post',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-API-Key': 'OI0UuQNcMp4mGlWoIeya49M7Y119Z2vxaWYcD4Kz'
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
        `https://9k24oe3gyg.execute-api.eu-west-2.amazonaws.com/prod/translate/${languageEl.value}?audio=true&gender=${genderEl.value}&prosody=${prosodyValueEl.value}`,
        {
            method: 'post',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'X-API-Key': 'OI0UuQNcMp4mGlWoIeya49M7Y119Z2vxaWYcD4Kz'
            },
            body: JSON.stringify({text}),
        });
    const t1 = performance.now();
    responseTimeEl.innerText = (t1 - t0).toFixed(2);
    return response;
}

async function fetchFinalAudio() {
    const t0 = performance.now();
    const response = await fetch(
        `https://9k24oe3gyg.execute-api.eu-west-2.amazonaws.com/prod/translate/${languageEl.value}/audio?gender=${genderEl.value}&prosody=${prosodyValueEl.value}`,
        {
            method: 'post',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'X-API-Key': 'OI0UuQNcMp4mGlWoIeya49M7Y119Z2vxaWYcD4Kz'
            },
            body: JSON.stringify({text: finalTranslation}),
        });
    const t1 = performance.now();
    responseTimeEl.innerText = (t1 - t0).toFixed(2);
    return response;
}

async function playAudioFromBlob(response, stopButtonEl) {
    if(playing) {
        console.log('Already playing');
        return;
    }
    try {
        stopButtonEl.style.display = 'inline-block';
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        const clickEventListener = () => {
            audio.pause();
            stopButtonEl.style.display = 'none';
            stopButtonEl.removeEventListener('click', clickEventListener);
            playing = false;
        };
        stopButtonEl.addEventListener('click', clickEventListener);
        audio.addEventListener('ended', () => {
            stopButtonEl.style.display = 'none';
            stopButtonEl.removeEventListener('click', clickEventListener);
            playing = false;
        });
        playing = true;
        await audio.play();
    } catch(e) {
        stopButtonEl.style.display = 'none';
    }
}

async function downloadMp3(response) {
    const blob = await response.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.setAttribute('download', 'audio-transcript.mp3');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function makeAlternatesSpan(span, item, index) {
    let i = 1;
    span.style.color = 'blue';
    span.style.cursor = 'pointer';
    const infoBox = makeInfoBox(item);
    span.append(infoBox);
    span.addEventListener('mouseenter', () => {
        infoBox.style.display = 'inline-block';
    });
    span.addEventListener('mouseleave', () => {
        infoBox.style.display = 'none';
    });
    span.addEventListener('click', () => {
        const newPhonetic = item.phonetics[i++ % item.phonetics.length];
        span.innerText = newPhonetic;
        finalTranslation[index].phonetic = newPhonetic;
        span.append(infoBox);
    });
}

function makeInfoBox(item) {
    const infoBox = document.createElement('span');
    infoBox.innerHTML = item.phonetics
        .map((p, i) => `<span>${i + 1}. ${p}</span>`)
        .join('</br>');
    infoBox.style.padding = '3px 5px';
    document.body.append(infoBox);
    const width = infoBox.offsetWidth;
    document.body.removeChild(infoBox);
    infoBox.style.display = 'none';
    infoBox.style.position = 'absolute';
    infoBox.style.transform = 'translate(-50%)';
    infoBox.style.left = '50%';
    infoBox.style.bottom = '20px';
    infoBox.style.width = `${width + 12}px`;
    infoBox.style.backgroundColor = 'black';
    infoBox.style.color = 'white';
    infoBox.style.borderRadius = '2px';
    return infoBox;
}

function getText() {
    const text = textEl.value;
    if(!text) alert('Please enter some text');
    return text;
}

function setProcessing(statusEl) {
    statusEl.innerText = 'Processing...';
}

function setProcessingDone(statusEl) {
    statusEl.innerText = 'Done';
    setTimeout(() => {
        statusEl.innerText = '';
    }, 1800);
}

function setProcessingError(statusEl) {
    statusEl.innerText = 'Error';
    statusEl.style.color = 'red';
    setTimeout(() => {
        statusEl.style.color = 'rgb(27, 24, 24)';
        statusEl.innerText = '';
    }, 1800);
}

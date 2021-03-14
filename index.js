const textEl = document.getElementById('text');
const resultAlternativesEl = document.getElementById('result-alternatives');
const responseTimeEl = document.getElementById('response-time');
const languageEl = document.getElementById('language');
const genderEl = document.getElementById('gender');
const listenEl = document.getElementById('listen');
const stopEl = document.getElementById('stop');
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
    setProcessing();
    resultAlternativesEl.innerHTML = '';
    const text = textEl.value;
    if(!text) {
        setProcessingDone();
        alert('Please enter some text');
        return
    }
    const t0 = performance.now();
    const result = await fetchTranslation(text, t0);
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
    setProcessingDone();
});

listenEl.addEventListener('click', async() => {
    if(playing) {
        console.log('Already playing');
        return;
    }
    setProcessing();
    const text = textEl.value;
    if(!text) {
        setProcessingDone();
        alert('Please enter some text');
        return
    }
    const response = await fetchAudio(text);
    await playAudioFromBlob(response);
    setProcessingDone();
});

downloadEl.addEventListener('click', async() => {
    setProcessing();
    const text = textEl.value;
    if(!text) {
        setProcessingDone();
        alert('Please enter some text');
        return
    }
    const response = await fetchAudio(text);
    await downloadMp3(response);
    setProcessingDone();
});

listenToFinalEl.addEventListener('click', async() => {
    if(playing) {
        console.log('Already playing');
        return;
    }
    setProcessingFinal()
    console.log(finalTranslation);
    if(!finalTranslation.length) {
        setProcessingFinalDone();
        alert('Please add translate some text first');
        return
    }
    const response = await fetchFinalAudio();
    await playAudioFromBlob(response);
    setProcessingFinalDone();
});

downloadFinalEl.addEventListener('click', async() => {
    setProcessingFinal();
    const text = textEl.value;
    if(!text) {
        setProcessingFinalDone();
        alert('Please add translate some text first');
        return
    }
    const response = await fetchFinalAudio(text);
    await downloadMp3(response);
    setProcessingFinalDone();
});

async function fetchTranslation(text, t0) {
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
    return await response.json();
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

async function fetchFinalAudio() {
    const t0 = performance.now();
    const response = await fetch(
        `https://9k24oe3gyg.execute-api.eu-west-2.amazonaws.com/prod/translate/${languageEl.value}/audio?gender=${genderEl.value}`,
        {
            method: 'post',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({text: finalTranslation}),
        });
    const t1 = performance.now();
    responseTimeEl.innerText = (t1 - t0).toFixed(2);
    return response;
}

async function playAudioFromBlob(response) {
    if(playing) {
        console.log('Already playing');
        return;
    }
    try {
        stopEl.style.display = 'inline-block';
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        const clickEventListener = () => {
            audio.pause();
            stopEl.style.display = 'none';
            stopEl.removeEventListener('click', clickEventListener);
            playing = false;
        };
        stopEl.addEventListener('click', clickEventListener);
        playing = true;
        audio.addEventListener('ended', () => {
            playing = false;
            console.log('Ended')
        })
        await audio.play();
    } catch(e) {
        stopEl.style.display = 'none';
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
    infoBox.style.padding = '3px';
    document.body.append(infoBox);
    const width = infoBox.offsetWidth;
    document.body.removeChild(infoBox);
    infoBox.style.display = 'none';
    infoBox.style.position = 'absolute';
    infoBox.style.transform = 'translate(-50%)';
    infoBox.style.left = '50%';
    infoBox.style.bottom = '20px';
    infoBox.style.width = `${width + 8}px`;
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

function setProcessing() {
    statusEl.innerText = 'Processing...';
}

function setProcessingDone() {
    statusEl.innerText = 'Done';
    setTimeout(() => {
        statusEl.innerText = '';
    }, 2500);
}

function setProcessingFinal() {
    statusFinalEl.innerText = 'Processing...';
}

function setProcessingFinalDone() {
    statusFinalEl.innerText = 'Done';
    setTimeout(() => {
        statusFinalEl.innerText = '';
    }, 2500);
}

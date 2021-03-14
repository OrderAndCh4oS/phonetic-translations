const textEl = document.getElementById('text');
const resultEl = document.getElementById('result');
const responseTimeEl = document.getElementById('response-time');
const languageEl = document.getElementById('language');
const submitEl = document.getElementById('submit');
const listenEl = document.getElementById('listen');
const genderEl = document.getElementById('gender');
const statusEl = document.getElementById('status');
const stopEl = document.getElementById('stop');

submitEl.addEventListener('click', async() => {
    statusEl.innerText = 'Processing...'
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
    statusEl.innerText = 'Done'
    setTimeout(() => {
        statusEl.innerText = ''
    }, 2500);
});

listenEl.addEventListener('click', async() => {
    statusEl.innerText = 'Processing...'
    const text = textEl.value;
    if(!text) alert('Please enter some text');
    const t0 = performance.now();
    const response = await fetch(
        `https://9k24oe3gyg.execute-api.eu-west-2.amazonaws.com/prod/translate/${languageEl.value}?audio=true&gender=${genderEl.value}`,
        {
            method: 'post',
            headers: {
                'Accept': '*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({text}),
        });
    const t1 = performance.now();
    responseTimeEl.innerText = (t1 - t0).toFixed(2);
    const encodedAudio = await response.text();
    const arrayBuffer = base64ToArrayBuffer(encodedAudio)
    await createSoundWithBuffer(arrayBuffer);
    statusEl.innerText = 'Done'
    setTimeout(() => {
        statusEl.innerText = ''
    }, 2500);
});

function base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for(let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

async function createSoundWithBuffer( buffer ) {
    stopEl.style.display = 'inline-block';
    const context = new AudioContext();
    const audioSource = context.createBufferSource();
    audioSource.connect( context.destination );
    audioSource.buffer = await context.decodeAudioData(buffer);
    const clickEvent = stopEl.addEventListener('click', () => {
        audioSource.stop()
        stopEl.style.display = 'none';
        stopEl.removeEventListener('click', clickEvent)
    });
    audioSource.start(0);
}

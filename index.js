const textEl = document.getElementById('text');
const resultEl = document.getElementById('result');
const responseTimeEl = document.getElementById('response-time');
const languageEl = document.getElementById('language');
const submitEl = document.getElementById('submit');
const listenEl = document.getElementById('listen');
const genderEl = document.getElementById('gender');

submitEl.addEventListener('click', async() => {
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
});

listenEl.addEventListener('click', async() => {
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
    createSoundWithBuffer(arrayBuffer)

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
    const context = new AudioContext();
    const audioSource = context.createBufferSource();
    audioSource.connect( context.destination );
    audioSource.buffer = await context.decodeAudioData(buffer);
    audioSource.start(0);
}

const textEl = document.getElementById('text');
const resultEl = document.getElementById('result');
const languageEl = document.getElementById('language');
const submitEl = document.getElementById('submit');

submitEl.addEventListener('click', async () => {
    const text = textEl.value;
    if(!text) alert('Please enter some text')
    const response = await fetch(`https://9k24oe3gyg.execute-api.eu-west-2.amazonaws.com/prod/translate/${languageEl.value}`, {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({text})
    });
    console.log(response);
    const result = await response.json()
    console.log(result);
    resultEl.value = result.translation
});

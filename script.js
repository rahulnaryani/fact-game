import apiKey from './config.js';

const apiUrl = 'https://api.openai.com/v1/chat/completions';

let currentRound = 1;
const totalRounds = 10;
let score = 0;
let facts = [];

const factsContainer = document.getElementById('facts-container');
const nextBtn = document.getElementById('next-btn');
const scoreDisplay = document.getElementById('score-display');
const loadingWidget = document.getElementById('loading-widget');
const gameOverScreen = document.getElementById('game-over-screen');

async function fetchFacts(prompt) {
    try {
        const messages = [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt}
        ];
        const response = await axios.post(apiUrl, {
            model: 'gpt-4o',  // Use the correct model name for GPT-4
            messages: messages,
            max_tokens: 500,
            n: 1,
            stop: null,
            temperature: 0.5
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        const gptResponse = response.data.choices[0].message.content.trim();
        return gptResponse.split('\n').filter(line => line.trim().length > 0);
    } catch (error) {
        console.error("Error fetching facts from GPT-4:", error);
        return [];
    }
}

async function fetchInitialFacts() {
    loadingWidget.style.display = 'block';  // Show loading widget

    const trueFactsPrompt = "Give me 20 unique fun facts, each of which is accurate. These fun facts can be about anything. Make sure they are concise, accurate, and 20 unique facts. Do not give me any additional text in the response. Just the facts as requested.";
    const falseFactsPrompt = "Give me 10 unique fun facts, each of which sounds accurate and credible, but is in fact false and inaccurate. Make sure they are concise, inaccurate, and unique. . Do not give me any additional text in the response. Just the facts as requested.";

    let trueFacts = [];
    let falseFacts = [];
    const maxRetries = 3;
    let attempts = 0;

    while (trueFacts.length < 20 && attempts < maxRetries) {
        trueFacts = await fetchFacts(trueFactsPrompt);
        attempts++;
    }

    attempts = 0;
    while (falseFacts.length < 10 && attempts < maxRetries) {
        falseFacts = await fetchFacts(falseFactsPrompt);
        attempts++;
    }

    if (trueFacts.length >= 20 && falseFacts.length >= 10) {
        facts = [
            ...trueFacts.slice(0, 20).map(fact => ({ statement: fact.trim().replace(/^\d+\.\s*/, ''), isTrue: true })),
            ...falseFacts.slice(0, 10).map(fact => ({ statement: fact.trim().replace(/^\d+\.\s*/, ''), isTrue: false }))
        ];
        loadingWidget.style.display = 'none';  // Hide loading widget
        startGame();
    } else {
        loadingWidget.style.display = 'none';  // Hide loading widget
        console.error(`Failed to fetch the required number of facts. Received ${trueFacts.length} true facts and ${falseFacts.length} false facts.`);
    }
}

function startGame() {
    nextRound();
}

function displayFacts(factsForRound) {
    factsContainer.innerHTML = '';
    factsForRound.forEach((fact, index) => {
        const factElement = document.createElement('div');
        factElement.classList.add('fact');
        factElement.textContent = fact.statement;
        factElement.addEventListener('click', () => checkFact(fact, factElement));
        factsContainer.appendChild(factElement);
    });
}

function checkFact(selectedFact, element) {
    if (!selectedFact.isTrue) {
        element.style.backgroundColor = 'green';
        score += 3;
    } else {
        element.style.backgroundColor = 'red';
        score -= 1;
    }
    scoreDisplay.textContent = `Score: ${score}`;
    setTimeout(nextRound, 1000);  // Wait 1 second before moving to the next round
}

function nextRound() {
    if (currentRound <= totalRounds) {
        currentRound++;
        const factsForRound = getFactsForRound();
        if (factsForRound) {
            displayFacts(factsForRound);
        } else {
            alert('Not enough facts to continue the game.');
        }
    } else {
        showGameOver();
    }
}

function getFactsForRound() {
    if (facts.length < 3) {
        return null;
    }
    // Randomly select 3 facts for the round (2 true, 1 false)
    let trueFacts = facts.filter(fact => fact.isTrue);
    let falseFacts = facts.filter(fact => !fact.isTrue);
    if (trueFacts.length < 2 || falseFacts.length < 1) {
        return null;
    }
    let selectedFacts = [];
    selectedFacts.push(...trueFacts.splice(0, 2));
    selectedFacts.push(...falseFacts.splice(0, 1));
    facts = facts.filter(fact => !selectedFacts.includes(fact));
    return shuffleArray(selectedFacts);
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function showGameOver() {
    factsContainer.style.display = 'none';
    nextBtn.style.display = 'none';
    gameOverScreen.style.display = 'block';
    gameOverScreen.innerHTML = `<h1 style="color: blue; font-size: 48px;">GAME OVER</h1><p style="color: blue; font-size: 36px;">Final Score: ${score}</p>`;
}

// Initialize game
document.addEventListener('DOMContentLoaded', async () => {
    gameOverScreen.style.display = 'none';
    factsContainer.style.display = 'block';
    await fetchInitialFacts();
    scoreDisplay.textContent = `Score: ${score}`;
});

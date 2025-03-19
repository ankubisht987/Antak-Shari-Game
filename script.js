let lastWord = "";
let lastLetter = "";
let playerName = "";
let score = 0;
let timer;
let wrongAttempts = 0;
const maxWrongAttempts = 3;
const timeLimit = 10;

// Retrieve highest scorer and score from localStorage
let highestScorer = localStorage.getItem("highestScorer") || "None";
let highestScore = parseInt(localStorage.getItem("highestScore")) || 0;

// Start the game and get the player's name
function startGame() {
  playerName = prompt("Enter your name:");
  if (!playerName) {
    playerName = "Player 1";
  }

  document.getElementById("player-name").innerText = playerName;
  document.getElementById("player-score").innerText = score;
  document.getElementById(
    "previous-player"
  ).innerText = `🏆 Highest Scorer: ${highestScorer}, Score: ${highestScore}`;

  wrongAttempts = 0;

  // Fetch a random word from the server
  fetch("/start")
    .then((response) => response.json())
    .then((data) => {
      if (data.word) {
        lastWord = data.word;
        lastLetter = lastWord.slice(-1).toLowerCase();
        document.getElementById("start-word").innerText = `Start with: ${lastWord}`;
        startTimer();
      }
    });
}

// Start the 10-second timer
function startTimer() {
  clearInterval(timer);
  let timeLeft = timeLimit;
  document.getElementById("time-played").innerText = `${timeLeft}s`;

  timer = setInterval(() => {
    timeLeft -= 1;
    document.getElementById("time-played").innerText = `${timeLeft}s`;

    if (timeLeft <= 0) {
      clearInterval(timer);
      handleTimeout(); // Handle timeout if player doesn't answer
    }
  }, 1000);
}

// Submit user's word
async function submitWord() {
  const userWord = document.getElementById("user-word").value.trim();

  if (!userWord) {
    document.getElementById("result").innerText = "❗️ Please enter a word.";
    return;
  }

  const response = await fetch("/check-word", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userWord, lastLetter }),
  });

  if (response.ok) {
    const data = await response.json();
    document.getElementById("result").innerText = data.message;
    lastWord = userWord;
    lastLetter = lastWord.slice(-1).toLowerCase();
    document.getElementById("start-word").innerText = `Your word: ${lastWord}`;
    document.getElementById("user-word").value = "";

    // Increase score by 10 points
    score += 10;
    document.getElementById("player-score").innerText = score;

    // Reset timer after successful attempt
    startTimer();
  } else {
    const errorText = await response.text();
    handleWrongAttempt(errorText);
  }
}

// Handle wrong attempt
function handleWrongAttempt(message) {
  wrongAttempts++;
  document.getElementById("result").innerText = `❌ ${message}`;

  if (wrongAttempts >= maxWrongAttempts) {
    endGame(); // End game if 3 wrong attempts
  } else {
    startTimer(); // Restart timer for next attempt
  }
}

// Handle timeout if player doesn't submit in 10 seconds
function handleTimeout() {
  document.getElementById("result").innerText = "⏰ Time's up! Game over.";
  endGame(); // Automatically end game on timeout
}

// End the game and restart with a new name
function endGame() {
  clearInterval(timer);
  updateHighestScore(); // Check and update highest score
  alert(`Game Over! Final score: ${score}`);
  resetGame();
}

// Update the highest score if the current score is higher
function updateHighestScore() {
  if (score > highestScore) {
    highestScore = score;
    highestScorer = playerName;

    localStorage.setItem("highestScorer", highestScorer);
    localStorage.setItem("highestScore", highestScore);
  }
}

// Reset the game and ask for a new name
function resetGame() {
  score = 0;
  wrongAttempts = 0;
  startGame();
}

// Save highest scorer before leaving
window.onbeforeunload = () => {
  updateHighestScore();
};

// Start the game when the page loads
window.onload = startGame;

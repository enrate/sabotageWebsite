// eloService.js

function calculateElo(oldElo, score, expected, K = 64) {
  return Math.round(oldElo + K * (score - expected));
}

module.exports = { calculateElo }; 
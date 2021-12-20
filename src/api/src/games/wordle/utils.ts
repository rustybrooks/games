import * as fs from 'fs';

const words: { [id: number]: string[] } = {};

export function evaluateGuess(expected: string, guess: string) {
  const expectedCounts = expected.split('').reduce((prev: { [id: string]: number }, current) => {
    const prev2 = { ...prev };
    prev2[current] = (prev2[current] || 0) + 1;
    return prev2;
  }, {});
  const guessCounts = guess.split('').reduce((prev: { [id: string]: number }, current, i) => {
    const prev2 = { ...prev };
    if (expected[i] === current) {
      prev2[current] = (prev2[current] || 0) + 1;
    }
    return prev2;
  }, {});
  return guess.split('').map((l, i) => {
    if (l !== expected[i]) {
      guessCounts[l] = (guessCounts[l] || 0) + 1;
    }
    if (l === expected[i]) {
      return '+';
    }
    if (expected.includes(l) && guessCounts[l] <= expectedCounts[l]) {
      return '-';
    }
    return ' ';
  });
}

export function wordList(length: number) {
  if (!(length in words)) {
    console.log('Loading words of length', length);
    words[length] = fs
      .readFileSync('../../data/scrabble.txt', 'utf8')
      .split('\n')
      .filter(w => w.length === length);
  }

  return words[length];
}

export function randomWord(length: number) {
  const wl = wordList(length);
  return wl[Math.floor(Math.random() * wl.length)];
}

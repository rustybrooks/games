import * as fs from 'fs';

const words: { [id: string]: string[] } = {};

export function evaluateGuess(expected: string, guess: string) {
  const expectedl = expected.toLowerCase();
  const guessl = guess.toLowerCase();

  const expectedCounts = expected.split('').reduce((prev: { [id: string]: number }, current) => {
    const prev2 = { ...prev };
    prev2[current] = (prev2[current] || 0) + 1;
    return prev2;
  }, {});
  const guessCounts = guessl.split('').reduce((prev: { [id: string]: number }, current, i) => {
    const prev2 = { ...prev };
    if (expectedl[i] === current) {
      prev2[current] = (prev2[current] || 0) + 1;
    }
    return prev2;
  }, {});
  return guessl.split('').map((l, i) => {
    if (l !== expectedl[i]) {
      guessCounts[l] = (guessCounts[l] || 0) + 1;
    }
    if (l === expectedl[i]) {
      return '+';
    }
    if (expectedl.includes(l) && guessCounts[l] <= expectedCounts[l]) {
      return '-';
    }
    return ' ';
  });
}

export function wordList(length: number, source: string) {
  const wkey = `${source}-${length}`;
  if (!(wkey in words)) {
    console.log('Loading words of length', wkey, length, source);

    try {
      words[wkey] = fs
        .readFileSync(`./data/${source}`, 'utf8')
        .split('\n')
        .filter(w => w.length === length);
    } catch (e) {
      console.log('error loading list', e);
    }
    console.log('len words', words[wkey].length);
  }

  return words[wkey];
}

export function randomWord(length: number, wordFile: string) {
  const wl = wordList(length, wordFile);
  return wl[Math.floor(Math.random() * wl.length)];
}

export function isWordInList(word: string, wordFile: string) {
  const wl = wordList(word.length, wordFile);
  return wl.includes(word);
}

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

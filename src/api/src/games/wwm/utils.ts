import { HttpBadRequest, HttpNotFound } from '@rustybrooks/api-framework';
import * as fs from 'fs';
import { Guess, League } from '../../../../ui/types';
import * as queries from './queries';

export const defaultSourceWordList = 'filtered/twl06.txt.filtered';
export const defaultAnswerWordList = 'sources/collins.2019.txt.clean';

const words: { [id: string]: string[] } = {};
const letters: string[] = [...Array(26).keys()].map(i => String.fromCharCode(i + 97));

function remove<T>(list: T[], element: T) {
  const index = list.indexOf(element);
  if (index !== -1) {
    list.splice(index, 1);
  }
}

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

export function nameToSlug(name: string) {
  let newname = name.toLowerCase().split('');
  const achar = 'a'.charCodeAt(0);
  const zchar = 'z'.charCodeAt(0);
  const zerochar = '0'.charCodeAt(0);
  const ninechar = '9'.charCodeAt(0);
  newname = newname.map((c: string) => {
    return (c.charCodeAt(0) >= achar && c.charCodeAt(0) <= zchar) || (c.charCodeAt(0) >= zerochar && c.charCodeAt(0) <= ninechar) ? c : '-';
  });
  return newname
    .join('')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
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

export function randomWord(length: number, wordFile: string, rejects: string[] = null) {
  let word;

  for (let i = 0; i < 100; i += 1) {
    const wl = wordList(length, wordFile);
    word = wl[Math.floor(Math.random() * wl.length)];
    if (!rejects || !rejects.includes(word)) {
      return word;
    }
  }

  return word;
}

export function isWordInList(word: string, wordFile: string) {
  const wl = wordList(word.length, wordFile);
  return wl.includes(word);
}

export function eliminateGuessHelper(guess: string, result: string): [string[][], string[], string[]] {
  const lcno = Object.fromEntries(letters.map(l => [l, 0]));
  const lc = Object.fromEntries(letters.map(l => [l, 0]));
  const l = guess.length;

  const allowed: string[][] = [...Array(l).keys()].map(() => [...letters]);
  const pos_required: string[] = [];
  const required: string[] = [];
  const not_allowed: string[] = [];

  for (let i = 0; i < l; i += 1) {
    lc[guess[i]] += 1;
    if (result[i] === '-' || result[i] === '+') {
      lcno[guess[i]] += 1;
    }

    if (result[i] === '+') {
      pos_required.push(guess[i]);
    } else if (result[i] === '-') {
      required.push(guess[i]);
    }
  }

  for (let i = 0; i < l; i += 1) {
    if (result[i] === '+') {
      allowed[i] = [guess[i]];
    } else if (result[i] === '-') {
      remove(allowed[i], guess[i]);
    } else if ((!pos_required.includes(guess[i]) && !required.includes(guess[i])) || lc[guess[i]] === lcno[guess[i]]) {
      not_allowed.push(guess[i]);
    } else {
      remove(allowed[i], guess[i]);
    }
  }

  return [allowed, not_allowed, required];
}

export function eliminateGuess(inWords: string[], guess: string, result: string) {
  const [allowed, not_allowed, required] = eliminateGuessHelper(guess, result);

  return inWords.filter(word => {
    const tmp_required = [...required];
    let keep = true;
    for (const [i, c] of word.split('').entries()) {
      if (not_allowed.includes(c)) {
        keep = false;
        break;
      }
      if (!allowed[i].includes(c)) {
        keep = false;
        break;
      }

      const cp = [...allowed[i]];
      remove(cp, c);
      if (cp.length) {
        remove(tmp_required, c);
      }
    }
    return keep && tmp_required.length === 0;
  });
}

export function checkHardMode(league: League, guess: string, result: string[], guesses: Guess[], answer: any): boolean {
  let wordsLeft = wordList(league.letters, league.accept_word_list || defaultAnswerWordList);
  for (const g of guesses) {
    const r = evaluateGuess(answer.answer, g.guess);
    wordsLeft = eliminateGuess(wordsLeft, g.guess, r.join(''));
  }

  return wordsLeft.includes(guess);
}

export async function checkLeague(
  league_slug: string,
  user: { [id: string]: any },
  isMemberOnly = true,
  requireSlug = true,
  overrideUser = false,
): Promise<League> {
  if (requireSlug) {
    if (!league_slug || !league_slug.length) {
      throw new HttpBadRequest('Must pass in league_slug');
    }
  }

  if (league_slug) {
    const league = await queries.getLeague({ league_slug, user_id: user?.user_id, isMemberOnly, overrideUser });
    if (league) {
      return league;
    }
    if (!league) {
      const league2 = await queries.getLeague({ league_slug });
      if (league2) {
        throw new HttpBadRequest('You are not in this league', 'not_in_league');
      }
      throw new HttpNotFound('League not found');
    }
  }
  return null;
}

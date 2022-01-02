#!/usr/bin/env python3

from collections import defaultdict
import copy
import random
import re

from sample_bot import *


# This will return a structure like the following:
# {
#   completed: True | False,
#   correct: True | False,
#   answer: None or string (None if you're still in the game, answer if the puzzle is complete)
#   guesses: [{guess: string, result: [list of chars]} ..., ..., ]
# }
# It always returns all your guesses up to this point
# The result is a list of characters, each character is ' ', '+', or '-'
# ' ' means the character at this index is not in the word
# '-' means it is, but it's not in the right spot
# '+' means it is, and you have it in the right spot
# (' ' is gray, '-' is yellow and '+' is green)
def make_one_puzzle_guess(league, puzzle, gr):
    rest = eliminate_guesses(league['letters'], gr['guesses'])
    guess = random.choice(rest)
    guess_result = submit_guess(puzzle, guess)
    return guess_result


# This makes a random guess and ignores the result
def solve_one_puzzle(league, puzzle):
    gr = get_puzzle_guesses(puzzle)
    while True:
        try:
            gr = make_one_puzzle_guess(league, puzzle, gr)
            print(
                f"correct={gr['correct']}, completed={gr['completed']}, guess_result={gr['guesses'][-1]}, answer={gr['answer']}"
            )
            if gr["completed"]:
                break
        except HttpExceptionBadRequest as e:
            print(f"Our guess was not accepted: {e.message}")

        # This is just to make sure if there's a problem or a bug you don't slam the server too hard.
        # time.sleep(1)
        # break


alphabet = [chr(i).lower() for i in range(65, 65+26)]


def eliminate_guesses(letters, guesses):
    w = words(letters)
    wordsleft = copy.deepcopy(w)
    non_letters = set()
    non_letters_elim = set()
    pos_letters_yes = defaultdict(str)
    pos_letters_no = defaultdict(set)

    for g in guesses:
        lc = defaultdict(int)
        these_non_letters = set()
        for i, gl, rs in zip(range(letters), g['guess'], g['result']):
            lc[gl] += 1
            if rs == '+':
                pos_letters_yes[i] = gl
            elif rs == '-':
                pos_letters_no[i].add(gl)
            else:
                these_non_letters.add(gl)

        non_letters_elim.update(x for x in these_non_letters if x not in pos_letters_no or lc[x] > 1)


    print("non", non_letters, "non elim", non_letters_elim)
    regex1 = ''
    for i in range(letters):
        if pos_letters_yes[i]:
            possible = [pos_letters_yes[i]]
        elif pos_letters_no[i]:
            remove = pos_letters_no[i] | non_letters_elim
            possible = [x for x in alphabet if x not in remove]
        else:
            possible = [x for x in alphabet if x not in non_letters_elim]

        regex1 += f"[{''.join(possible)}]"

    regex1 = f"^{regex1}$"
    pl = set()
    if pos_letters_no:
        for v in pos_letters_no.values():
            pl.update(v)

    regex1 = re.compile(regex1)
    newleft = [x for x in wordsleft if regex1.match(x) and (pl - set(list(x)) == set())]
    print(regex1, pl)
    print(len(newleft), newleft[:100])

    return newleft

# eliminate_guesses(5, [
#     {'guess': 'boobs', 'result': [' ', ' ', ' ', '　', '-']},
#     {'guess': 'train', 'result': [' ', ' ', ' ', '-', '']},
#     {'guess': 'prude', 'result': [' ', ' ', '-', ' ', '+']},
#     {'guess': 'sulci', 'result': ['-', '+', ' ', ' ', '-']}
# ])

# This is the name of the current only bot league
slug = "bot_league_5l_5m"
bot_league = get_league(slug)
puzzles = get_active_puzzles(slug)
unsolved = [p for p in puzzles if not p["completed"]]
solve_one_puzzle(bot_league, unsolved[0])

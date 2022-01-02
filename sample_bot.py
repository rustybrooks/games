#!/usr/bin/env python3

import os
import random
import requests
import time

session = requests.Session()
session.headers = {
    "X-API-KEY": os.getenv("WWM_API_KEY"),  # put API key in this env var
    "Content-Type": "application/json",
}

basedir = os.path.dirname(os.path.realpath(__file__))

web_url = "http://games.rustybrooks.com"
base_url = f"{web_url}/api/games/wwm"
# base_url = 'http://localhost:5000'

# This is the path to the list of words you want to use to make your
# guesses.  It assumes you have that file in the same directory as this script.
dict_file = os.path.join(basedir, "collins.2019.txt.clean")

# This is where the list of words of length N are stored.
wordlist = {}


class HttpExceptionUnknown(Exception):
    pass


class HttpExceptionBadRequest(Exception):
    def __init__(self, data):
        self.message = data["detail"]


# A simple convenience function to post data.  It will raise an exception for
# any "error" status code (4xx or 5xx).  Otherwise it will return the decoded payload.
def post(url, json=None):
    r = session.post(f"{base_url}{url}", json=json or {})

    if r.status_code == 400:
        raise (HttpExceptionBadRequest(r.json()))
    elif r.status_code > 400:
        r.raise_for_status()
    elif r.status_code == 200:
        return r.json()
    else:
        raise (HttpExceptionUnknown(f"Unexpected status code: {r.status_code}"))


def words(length):
    if length not in wordlist:
        dwords = open(dict_file).read().splitlines()
        wordlist[length] = [x for x in dwords if len(x) == length]

    return wordlist[length]


# If things are working, you can try this as the simplest way to see if you
# have the right API key for your expected user
def test_connectivity():
    print(session.get(f"{web_url}/api/user").content)


def get_league(league_slug):
    return post("/leagues/info", json={"league_slug": league_slug})


# get_active_puzzles returns *all* puzzles in a league that are currently active
# active means that their start_date is before now and their end_date is after now
# This includes puzzles you've already solved - see the end of this script for and
# example of filtering those out
def get_active_puzzles(league_slug):
    return post("/puzzles/active", json={"league_slug": league_slug})


# This gets all the guesses for a given puzzle.  You won't normally need to call this
# since the same data structure is returned whenever you submit a guess.  But I included
# it for completeness
def get_puzzle_guesses(puzzle):
    return post(
        "/puzzles/guesses",
        json={
            "league_slug": puzzle["league_slug"],
            "wordle_answer_id": puzzle["wordle_answer_id"],
        },
    )


def submit_guess(puzzle, guess):
    return post(
        "/puzzles/check",
        json={
            "league_slug": puzzle["league_slug"],
            "wordle_answer_id": puzzle["wordle_answer_id"],
            "guess": guess,
        },
    )


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
def make_one_puzzle_guess(league, puzzle):
    guess = random.choice(words(league["letters"]))
    guess_result = submit_guess(puzzle, guess)
    return guess_result


# This makes a random guess and ignores the result
def solve_one_puzzle(league, puzzle):
    while True:
        try:
            gr = make_one_puzzle_guess(league, puzzle)
            print(
                f"correct={gr['correct']}, completed={gr['completed']}, guess_result={gr['guesses'][-1]}, answer={gr['answer']}"
            )
            if gr["completed"]:
                break
        except HttpExceptionBadRequest as e:
            print(f"Our guess was not accepted: {e.message}")

        # This is just to make sure if there's a problem or a bug you don't slam the server too hard.
        time.sleep(1)


if __name__ == "__main__":
    # uncomment this to print out the username of the user attached to the api key you're
    # providing.  (Or a message that indicates auth failed, which looks like
    # {"status":403, "detail":"unauthorized"}
    # test_connectivity()

    # This is the name of the current only bot league
    slug = "bot_league_5l_5m"
    bot_league = get_league(slug)
    puzzles = get_active_puzzles(slug)
    unsolved = [p for p in puzzles if not p["completed"]]
    solve_one_puzzle(bot_league, unsolved[0])

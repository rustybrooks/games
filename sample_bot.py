#!/usr/bin/env python3

import json
import os
import random
import requests
import time

session = requests.Session()
session.headers = {
    'X-API-KEY': os.getenv("WWM_API_KEY"),  # put API key in this env var
    'Content-Type': 'application/json',
}

basedir = os.path.dirname(os.path.realpath(__file__))

base_url = 'http://games.rustybrooks.com/api/games/wwm'
# base_url = 'http://localhost:5000'
dict_file = ''
wordlist = {}


def post(url, json=None):
    r = session.post(
        f'{base_url}{url}',
        json=json or {},
    )
    r.raise_for_status()
    return r.json()


def words(length):
    if length not in wordlist:
        fname = os.path.join(basedir, 'collins.2019.txt.clean')
        dwords = open(fname).read().splitlines()
        wordlist[length] = [x for x in dwords if len(x) == length]

    return wordlist[length]


def test_connectivity():
    print(session.get(f'{base_url}/api/user').json())


def get_league(league_slug):
    return post('/leagues/info', json={'league_slug': league_slug})


def get_active_puzzles(league_slug):
    return post('/puzzles/active', json={'league_slug': league_slug})


def get_puzzle_guesses(puzzle):
    return post('/puzzles/guesses', json={
        'league_slug': puzzle['league_slug'],
        'wordle_answer_id': puzzle['wordle_answer_id'],
    })


def submit_guess(puzzle, guess):
    return post('/puzzles/check', json={
        'league_slug': puzzle['league_slug'],
        'wordle_answer_id': puzzle['wordle_answer_id'],
        'guess': guess,
    })


def make_one_puzzle_guess(league, puzzle):
    guess = random.choice(words(league['letters']))
    guess_result = submit_guess(puzzle, guess)
    return guess_result


def solve_one_puzzle(league, puzzle):
    while True:
        guess_result = make_one_puzzle_guess(league, puzzle)
        if guess_result['completed']:
            break

        # This is just to make sure if there's a problem or a bug you don't slam the server too hard.
        time.sleep(1)


# This is the name of the current only bot league
slug = 'bot_league_5l_5m'
bot_league = get_league(slug)
puzzles = get_active_puzzles(slug)
unsolved = [p for p in puzzles if not p['completed']]
solve_one_puzzle(bot_league, unsolved[0])

export interface Guess {
  wordle_guess_id: number;
  user_id: number;
  wordle_answer_id: number;
  guess: string;
  correct_placement: number;
  correct_letters: number;
  correct: boolean;
  create_date: Date;
}

export interface League {
  wordle_league_id?: number;
  league_slug: string;
  league_name: string;
  letters: number;
  max_guesses: number;
  series_days: number;
  time_to_live_hours: number;
  answer_interval_hours: number;
  create_date: Date;
  start_date: Date;
  is_member: boolean;
}

export interface ActivePuzzle {
  league_slug: string;
  league_name: string;
  wordle_answer_id: number;
  active_after: Date;
  active_before: Date;
  series_start_date: Date;
  series_end_date: Date;
  num_guesses: number;
  correct_answer: string;
  correct: boolean;
  completed: boolean;
}

export interface WordleStatus {
  username: string;
  user_id: number;
  wordle_answer_id: number;
  completed: boolean;
  correct: boolean;
  correct_placement: number;
  correct_letters: number;
  num_guesses: number;
  start_date: Date;
  end_date: Date;
}

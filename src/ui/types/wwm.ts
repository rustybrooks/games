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
  answer_interval_minutes: number;
  create_date: Date;
  start_date: Date;
  is_member: boolean;
  is_creator: boolean;
  is_private: boolean;
  is_hard_mode: boolean;
  invite_code: string;
  source_word_list: string;
  accept_word_list: string;
  create_user_id: number;
}

export interface LeagueSeries {
  wordle_league_series_id: number;
  wordle_league_id: number;
  create_date: Date;
  start_date: Date;
  end_date: Date;
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
  num_comments: number;
}

export interface WWMStatus {
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

export interface LeagueStats {
  user_id: number;
  username: string;
  raw_score: number;
  score: number;
  avg_guesses: number;
  avg_guesses_correct: number;
  min_guesses_correct: number;
  max_guesses: number;
  done: number;
  wins: number;
  win_pct: number;
  win_pct_possible: number;
  possible: number;
}

export interface Comment {
  wordle_comment_id: number;
  user_id: number;
  username: string;
  comment: string;
  create_date: Date;
  wordle_answer_id: number;
}

export interface UserStats {
  wordle_league_id: number;
  league_name: string;
  buckets: number[];
  counts: number[];
  completed: number;
  correct: number;
  pct_correct: number;
}

export interface League {
  wordle_league_id?: number;
  league_slug: string;
  league_name: string;
  letters: number;
  series_days: number;
  time_to_live_hours: number;
  create_date: number;
  start_date: number;
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
}

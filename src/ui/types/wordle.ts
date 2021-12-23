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

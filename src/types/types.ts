export interface Team {
  id: number;
  name: string;
}

export interface Match {
  id: number;
  matchday: number;
  team1_id: number;
  team2_id: number;
  score1: number | null;
  score2: number | null;
  match_timestamp: string | null;
  teams: [Team, Team] | null;
}

export interface StandingsEntry {
  team_id: number;
  team_name: string;
  mp: number;
  w: number;
  d: number; // Tetap ada di sini
  l: number;
  points: number;
  gf: number;
  ga: number;
  gd: number;
}
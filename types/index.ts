export interface Player {
  id: string;
  name: string;
  passphrase: string;
  created_at: string;
}

export interface Rider {
  id: string;
  name: string;
  number: number;
  team: string;
  active: boolean;
}

export interface Race {
  id: string;
  round_number: number;
  name: string;
  circuit: string;
  country: string;
  race_date: string;
  sprint_date: string;
  fp1_datetime: string;
  status: 'upcoming' | 'in_progress' | 'completed';
}

export interface RaceResult {
  id: string;
  race_id: string;
  result_type: 'sprint' | 'race';
  position: number;
  rider_id: string;
}

export interface RacePrediction {
  id: string;
  player_id: string;
  race_id: string;
  // Top 3 Sprint predictions
  sprint_1st_id: string;
  sprint_2nd_id: string;
  sprint_3rd_id: string;
  // Top 3 Race predictions
  race_1st_id: string;
  race_2nd_id: string;
  race_3rd_id: string;
  // Glorious 7 prediction (Mini-League)
  glorious_1st_id: string;
  glorious_2nd_id: string;
  glorious_3rd_id: string;
  submitted_at: string;
  is_late: boolean;
}

export interface ChampionshipPrediction {
  id: string;
  player_id: string;
  season_year: number;
  first_place_id: string;
  second_place_id: string;
  third_place_id: string;
  submitted_at: string;
}

export interface ChampionshipResult {
  id: string;
  season_year: number;
  position: number;
  rider_id: string;
}

export interface PlayerScore {
  id: string;
  player_id: string;
  race_id: string;
  // Individual position points for sprint top 3
  sprint_1st_points: number;
  sprint_2nd_points: number;
  sprint_3rd_points: number;
  // Individual position points for race top 3
  race_1st_points: number;
  race_2nd_points: number;
  race_3rd_points: number;
  // Glorious 7 and penalties
  glorious_7_points: number;
  penalty_points: number;
  total_points: number;
}

export interface Penalty {
  id: string;
  player_id: string;
  race_id: string;
  offense_number: number;
  penalty_points: number;
  reason: string;
  created_at: string;
}

export interface LeaderboardEntry {
  name: string;
  race_points: number;
  championship_points: number;
  total_points: number;
}

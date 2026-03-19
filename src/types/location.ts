export interface UserLocationData {
  userId: string;
  username: string;
  avatarUrl: string | null;
  totalCommits: number;
  towerTier: number;
  latitude: number;
  longitude: number;
  distance: number;
}

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

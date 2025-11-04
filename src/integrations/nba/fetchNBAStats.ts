/**
 * Fetch team stats (season averages) via balldontlie.
 * Note: balldontlie may not provide all stats you want, but we can adapt.
 */
export async function fetchAllNBATeamStats(season = "2024") {
  console.log(`📡 Fetching NBA stats for season ${season}...`);
  const url = `https://www.balldontlie.io/api/v1/season_averages?season=${season}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch NBA team stats: ${res.statusText}`);
  const json = await res.json();
  // This endpoint returns player stats; balldontlie may not support full team stats.
  // If they don’t, you can pivot to API-NBA.
  const teamStats: Record<string, any> = {};
  // possible logic: aggregate from team id, or switch to another provider if needed.
  return teamStats;
}

// src/utils/fetchMLBTeams.ts
/**
 * Fetches all MLB teams from the official MLB Stats API.
 * Returns an array of { name, externalId } objects.
 */
export async function fetchMLBTeams() {
  // Official MLB Stats API endpoint
  const url = "https://statsapi.mlb.com/api/v1/teams?sportId=1";

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch MLB teams: ${res.statusText}`);

  const json = await res.json();

  // Map MLB API data → internal structure
  return json.teams.map((team: any) => ({
    name: team.name,           // e.g. "Philadelphia Phillies"
    externalId: String(team.id), // e.g. "143"
  }));
}

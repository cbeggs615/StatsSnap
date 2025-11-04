/**
 * Fetch all NBA teams (no key, via balldontlie.io)
 * Docs: https://www.balldontlie.io/#get-all-teams
 */
export async function fetchNBATeams() {
  const url = "https://www.balldontlie.io/api/v1/teams";
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch NBA teams: ${res.statusText}`);
  const json = await res.json();

  const teams = json.data.map((t: any) => ({
    name: t.full_name,
    externalId: String(t.id),
  }));

  console.log(`✅ Loaded ${teams.length} NBA teams.`);
  return teams;
}

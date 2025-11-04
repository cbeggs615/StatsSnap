/**
 * Fetch all NFL teams from ESPN's teams API.
 * Returns an array of { name, externalId, logo } objects.
 */
export async function fetchNFLTeams() {
  const url = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams";
  console.log(`📡 Fetching NFL teams from ${url}`);

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (StatsSnap Integration)",
      "Accept": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch teams: ${res.statusText}`);
  }

  const data = await res.json();

  // 🏈 Navigate into ESPN JSON structure
  const teams = data?.sports?.[0]?.leagues?.[0]?.teams;
  if (!Array.isArray(teams) || teams.length === 0) {
    console.error("❌ Unexpected ESPN structure or no teams found.");
    console.dir(Object.keys(data.sports?.[0]?.leagues?.[0] || {}));
    return [];
  }

  const parsedTeams = teams.map((entry: any) => ({
    name: entry.team?.displayName ?? "Unknown Team",
    externalId: String(entry.team?.id ?? ""),
    logo: entry.team?.logos?.[0]?.href ?? null,
  }));

  console.log(`✅ Found ${parsedTeams.length} NFL teams from ESPN`);
  return parsedTeams;
}

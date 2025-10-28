/**
 * Fetch all NHL teams from ESPN's teams API.
 * Returns an array of { name, externalId, logo } objects.
 */
export async function fetchNHLTeams() {
  const url = "https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams";
  console.log(`📡 Fetching NHL teams from ${url}`);

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (StatsSnap Integration)",
      "Accept": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch NHL teams: ${res.statusText}`);
  }

  const data = await res.json();

  // 🏒 Navigate into ESPN JSON structure
  const teams = data?.sports?.[0]?.leagues?.[0]?.teams;
  if (!Array.isArray(teams) || teams.length === 0) {
    console.error("❌ Unexpected ESPN structure or no NHL teams found.");
    console.dir(Object.keys(data.sports?.[0]?.leagues?.[0] || {}));
    return [];
  }

  const parsedTeams = teams.map((entry: any) => ({
    name: entry.team?.displayName ?? "Unknown Team",
    externalId: String(entry.team?.id ?? ""),
    abbreviation: entry.team?.abbreviation ?? null,
    location: entry.team?.location ?? null,
    shortName: entry.team?.shortDisplayName ?? null,
    logo: entry.team?.logos?.[0]?.href ?? null,
  }));

  console.log(`✅ Found ${parsedTeams.length} NHL teams from ESPN`);
  return parsedTeams;
}

if (import.meta.main) {
  const teams = await fetchNHLTeams();
  console.log(teams.slice(0, 5)); // preview first 5
}

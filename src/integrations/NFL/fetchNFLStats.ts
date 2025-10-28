let cachedStandings: any[] | null = null;

async function getAllNFLStandings() {
  if (cachedStandings) return cachedStandings;

  const url = "https://cdn.espn.com/core/nfl/standings?xhr=1";
  console.log(`📡 Fetching NFL standings from ${url}`);

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (StatsSnap Integration)",
      "Accept": "application/json",
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch standings: ${res.statusText}`);

  const data = await res.json();
  const rootGroups = data?.content?.standings?.groups;
  if (!Array.isArray(rootGroups)) {
    console.error("❌ Could not find 'content.standings.groups' in ESPN response.");
    throw new Error("Unexpected ESPN standings format.");
  }

  const teams: any[] = [];

  // Recursively collect all groups → standings.entries
  function collectGroups(groups: any[]) {
    for (const g of groups) {
      if (g.standings?.entries) {
        for (const e of g.standings.entries) {
          if (e.team?.id) teams.push(e);
        }
      }
      if (Array.isArray(g.groups)) collectGroups(g.groups);
    }
  }

  collectGroups(rootGroups);
  console.log(`📊 Collected ${teams.length} total NFL teams from ESPN standings`);
  cachedStandings = teams;
  return teams;
}

export async function fetchNFLTeamStats(teamId: string) {
  const standings = await getAllNFLStandings();

  const entry = standings.find((t) => String(t.team?.id) === String(teamId));
  if (!entry) {
    const allIds = standings.map((t) => t.team?.id).filter(Boolean);
    throw new Error(
      `Team ${teamId} not found in ESPN standings. Found ${standings.length} teams. Available IDs: [${allIds.join(", ")}]`
    );
  }

  // Build a stats map — convert string values to numbers if needed
  const statsMap: Record<string, number> = {};
  for (const s of entry.stats || []) {
    if (!s.name || s.value == null) continue;
    const num = typeof s.value === "string" ? parseFloat(s.value) : s.value;
    if (!isNaN(num)) statsMap[s.name] = num;
  }

  const wins = statsMap["wins"] ?? 0;
  const losses = statsMap["losses"] ?? 0;
  const ties = statsMap["ties"] ?? 0;
  const totalPointsFor = statsMap["pointsFor"] ?? 0;
  const totalPointsAgainst = statsMap["pointsAgainst"] ?? 0;
  const gamesPlayed = wins + losses + ties;

  // 🧮 Compute averages per game (rounded to 1 decimal)
  const avgPointsFor =
    gamesPlayed > 0 ? Number((totalPointsFor / gamesPlayed).toFixed(1)) : 0;
  const avgPointsAgainst =
    gamesPlayed > 0 ? Number((totalPointsAgainst / gamesPlayed).toFixed(1)) : 0;

  console.log(
    `✅ Parsed ${entry.team.displayName}: W=${wins}, L=${losses}, T=${ties}, PPG=${avgPointsFor}, PAPG=${avgPointsAgainst}`
  );

  return {
    wins,
    losses,
    ties,
    gamesPlayed,
    avgPointsFor,
    avgPointsAgainst,
    record: `${wins}-${losses}${ties ? `-${ties}` : ""}`,
    logo: entry.team?.logos?.[0]?.href ?? null,
  };
}

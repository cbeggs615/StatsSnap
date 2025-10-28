// src/integrations/nhl/fetchNHLTeamStats.ts
/**
 * Fetch current NHL team standings + stats from ESPN Core API.
 * Includes wins, losses, OT losses, points, GF, GA, and per-game averages.
 */
export async function fetchNHLTeamStats() {
  const url =
    "https://sports.core.api.espn.com/v2/sports/hockey/leagues/nhl/seasons/2026/types/2/groups/9/standings/0?lang=en&region=us";
  console.log(`📡 Fetching NHL standings from ${url}`);

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (StatsSnap Integration)",
      "Accept": "application/json",
    },
  });
  if (!res.ok) throw new Error(`❌ Failed to fetch standings: ${res.statusText}`);
  const data = await res.json();

  const teams: any[] = [];
  if (!Array.isArray(data.standings)) {
    console.error("❌ No standings array found in NHL data.");
    return [];
  }

  for (const entry of data.standings) {
    const record = entry.records?.find((r: any) => r.name.toLowerCase() === "overall");
    if (!record?.stats) continue;

    // build stat map
    const stats: Record<string, number> = {};
    for (const s of record.stats) {
      if (!s.name || s.value == null) continue;
      stats[s.name] = s.value;
    }

    const wins = stats["wins"] ?? 0;
    const losses = stats["losses"] ?? 0;
    const otLosses = stats["otLosses"] ?? 0;
    const points = stats["points"] ?? 0;
    const goalsFor = stats["pointsFor"] ?? 0;
    const goalsAgainst = stats["pointsAgainst"] ?? 0;
    const gamesPlayed = stats["gamesPlayed"] ?? wins + losses + otLosses;

    const avgGF = gamesPlayed ? Number((goalsFor / gamesPlayed).toFixed(1)) : 0;
    const avgGA = gamesPlayed ? Number((goalsAgainst / gamesPlayed).toFixed(1)) : 0;

    // fetch team info (name + logo)
    const teamUrl = entry.team?.$ref;
    let teamName = "Unknown Team";
    let abbreviation = "";
    let logo = null;
    if (teamUrl) {
      try {
        const teamRes = await fetch(teamUrl);
        const teamData = await teamRes.json();
        teamName = teamData.displayName ?? teamData.name ?? "Unknown Team";
        abbreviation = teamData.abbreviation ?? "";
        logo = teamData.logos?.[0]?.href ?? null;
      } catch {
        console.warn(`⚠️ Failed to fetch team info for ${teamUrl}`);
      }
    }

    teams.push({
      teamId: entry.team?.$ref?.split("/").pop()?.split("?")[0],
      teamName,
      abbreviation,
      wins,
      losses,
      otLosses,
      points,
      goalsFor,
      goalsAgainst,
      gamesPlayed,
      avgGoalsFor: avgGF,
      avgGoalsAgainst: avgGA,
      logo,
    });
  }

  console.log(`✅ Parsed ${teams.length} NHL teams`);
  return teams;
}

// test
if (import.meta.main) {
  const all = await fetchNHLTeamStats();
  console.table(
    all.slice(0, 5).map((t) => ({
      Team: t.teamName,
      W: t.wins,
      L: t.losses,
      OTL: t.otLosses,
      PTS: t.points,
      GF: t.goalsFor,
      GA: t.goalsAgainst,
      "GF/G": t.avgGoalsFor,
      "GA/G": t.avgGoalsAgainst,
    })),
  );
}

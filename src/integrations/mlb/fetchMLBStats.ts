/**
 * Fetches team stats for all MLB teams (batting, pitching, wins/losses).
 * Combines data from the stats and standings endpoints.
 */
export async function fetchAllMLBTeamStats(season = 2024) {
  console.log(`📡 Fetching MLB stats for season ${season}...`);

  // --- Team hitting/pitching/fielding stats ---
  const statsUrl = `https://statsapi.mlb.com/api/v1/teams/stats?group=hitting,pitching,fielding&season=${season}&sportId=1`;
  const statsRes = await fetch(statsUrl);
  if (!statsRes.ok) throw new Error(`Failed to fetch team stats: ${statsRes.statusText}`);
  const statsJson = await statsRes.json();
  const statSplits = statsJson.stats?.[0]?.splits ?? [];

  // --- Team standings (wins/losses) ---
  const standingsUrl = `https://statsapi.mlb.com/api/v1/standings?leagueId=103,104&season=${season}`; // AL + NL
  const standingsRes = await fetch(standingsUrl);
  if (!standingsRes.ok) throw new Error(`Failed to fetch standings: ${standingsRes.statusText}`);
  const standingsJson = await standingsRes.json();

  // Build quick lookup of { teamId → { wins, losses } }
  const recordMap: Record<string, any> = {};
  for (const record of standingsJson.records ?? []) {
    for (const teamRecord of record.teamRecords ?? []) {
      const t = teamRecord.team;
      recordMap[String(t.id)] = {
        wins: Number(teamRecord.wins) || 0,
        losses: Number(teamRecord.losses) || 0,
      };
    }
  }

  // --- Combine both data sources ---
  const combined: Record<string, any> = {};
  for (const entry of statSplits) {
    const team = entry.team;
    const stat = entry.stat ?? {};
    if (team?.id) {
      const id = String(team.id);
      combined[id] = {
        ...recordMap[id],
        runs: stat.runs ?? 0,
        homeRuns: stat.homeRuns ?? 0,
        battingAverage: parseFloat(stat.avg ?? stat.battingAverage ?? 0),
        strikeouts: stat.strikeouts ?? 0,
        stolenBases: stat.stolenBases ?? 0,
      };
    }
  }

  console.log(`✅ Loaded ${Object.keys(combined).length} MLB team stats from API.`);
  return combined;
}

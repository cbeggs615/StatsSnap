const url = "https://cdn.espn.com/core/nfl/standings?xhr=1";
const res = await fetch(url, {
  headers: {
    "User-Agent": "Mozilla/5.0 (StatsSnap Integration)",
    "Accept": "application/json",
  },
});
if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);
const data = await res.json();

const groups = data?.content?.standings?.groups;
function collectGroups(groups: any[], teams: any[]) {
  for (const g of groups) {
    if (g.standings?.entries) teams.push(...g.standings.entries);
    if (Array.isArray(g.groups)) collectGroups(g.groups, teams);
  }
  return teams;
}
const entries = collectGroups(groups, []);

console.log(`📊 Found ${entries.length} entries.`);
const sample = entries.find((e) => e.team?.displayName === "Philadelphia Eagles") || entries[0];

console.log(`\n🦅 Sample team: ${sample.team?.displayName}`);
console.log(`🏈 Stats array length: ${sample.stats?.length}`);
console.log(JSON.stringify(sample.stats?.slice(0, 10), null, 2));

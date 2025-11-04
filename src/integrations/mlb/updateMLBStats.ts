import SportsStatsConcept from "@concepts/SportsStats/SportsStatsConcept.ts";
import { fetchAllMLBTeamStats } from "./fetchMLBStats.ts";
import { getDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import { MongoClient } from "npm:mongodb";

export async function updateMLBTeamStats() {
  console.log("⚾ Starting MLB stats update...");

  const [db, client] = await getDb() as [import("npm:mongodb").Db, MongoClient];
  const statsConcept = new SportsStatsConcept(db);

  // 1️⃣ Find MLB sport
  const mlbSport = await db.collection("SportsStats.sports").findOne({
    name: "MLB-Baseball",
  });
  if (!mlbSport?._id) {
    console.error("❌ MLB sport not found. Run importMLBTeams.ts first.");
    await client.close();
    return;
  }

  // 2️⃣ Get all MLB teams
  const teams = await db.collection("SportsStats.teams").find({
    sport: String(mlbSport._id),
  }).toArray();
  console.log(`Found ${teams.length} MLB teams.\n`);

  // 3️⃣ Fetch bulk stats from MLB API
  console.log("📡 Fetching bulk stats from MLB API...");
  const currentYear = new Date().getFullYear();
  const allStats = await fetchAllMLBTeamStats(currentYear);

  let updatedCount = 0;

  // 4️⃣ Update both raw data + concept stat values through _setStatValue
  for (const team of teams) {
    const stats = allStats[team.externalId];
    if (!stats) {
      console.warn(`⚠️  No stats found for ${team.name} (id=${team.externalId})\n`);
      continue;
    }

    // Store flat raw snapshot (optional, for debugging or analytics)
    await db.collection("SportsStats.data").updateOne(
      { team: team._id },
      { $set: { ...stats, updatedAt: new Date() } },
      { upsert: true },
    );

    // Define mapping from raw → stat IDs
    const statMap: Record<string, number> = {
      "stat:wins": stats.wins,
      "stat:losses": stats.losses,
      "stat:runs": stats.runs,
      "stat:home_runs": stats.homeRuns,
      "stat:batting_average": stats.battingAverage,
      "stat:stolen_bases": stats.stolenBases,
    };

    console.log(`\n📊 Updating stats for ${team.name}:`);
    for (const [statId, value] of Object.entries(statMap)) {
      console.log(`   • ${statId} → ${value}`);
      const res = await statsConcept._setStatValue({
        teamname: team.name,
        sport: String(mlbSport._id) as ID,
        statId: statId as ID,
        value,
      });
      if ("error" in res) {
        console.warn(`     ⚠️ Failed to set ${statId}: ${res.error}`);
      }
    }

    console.log(`✅ [${team.name}] Stats synced via _setStatValue\n`);
    updatedCount++;
  }

  console.log(`\n🎉 Updated and synced ${updatedCount}/${teams.length} MLB teams.`);
  await client.close();
  console.log("🔒 Database connection closed.");
}

// Run directly
if (import.meta.main) {
  updateMLBTeamStats()
    .then(() => console.log("✅ Done seeding MLB stats."))
    .catch((err) => {
      console.error("❌ Error updating MLB stats:", err);
      Deno.exit(1);
    });
}

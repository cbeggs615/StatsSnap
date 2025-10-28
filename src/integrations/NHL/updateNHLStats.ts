// src/integrations/nhl/updateNHLTeamStats.ts

import { fetchNHLTeamStats } from "./fetchNHLStats.ts";
import SportsStatsConcept from "@concepts/SportsStats/SportsStatsConcept.ts";
import { getDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import { MongoClient } from "npm:mongodb";

export async function updateNHLTeamStats() {
  console.log("🏒 Starting NHL stats update...");

  // 1️⃣ Fetch stats directly (no Python needed)
  const allStats = await fetchNHLTeamStats();

  // 2️⃣ Connect to Mongo
  const [db, client] = (await getDb()) as [import("npm:mongodb").Db, MongoClient];
  const statsConcept = new SportsStatsConcept(db);

  // 3️⃣ Get NHL sport
  const nhlSport = await db.collection("SportsStats.sports").findOne({ name: "NHL-Hockey" });
  if (!nhlSport?._id) {
    console.error("❌ NHL sport not found. Run importNHLTeams.ts first.");
    await client.close();
    return;
  }

  // 4️⃣ Get all NHL teams
  const teams = await db
    .collection("SportsStats.teams")
    .find({ sport: String(nhlSport._id) })
    .toArray();

  // 5️⃣ Update stats for each
  let updatedCount = 0;
  for (const team of teams) {
    const stats = allStats.find((s) => String(s.teamId) === team.externalId);
    if (!stats) {
      console.warn(`⚠️ No stats found for ${team.name}`);
      continue;
    }

    // save snapshot
    await db.collection("SportsStats.data").updateOne(
      { team: team._id },
      { $set: { ...stats, updatedAt: new Date() } },
      { upsert: true },
    );

    const statMap: Record<string, number> = {
      "stat:wins": stats.wins,
      "stat:losses": stats.losses,
      "stat:OT_losses": stats.otLosses,
      "stat:total_points": stats.points,
      "stat:total_goals_for": stats.goalsFor,
      "stat:total_goals_against": stats.goalsAgainst,
      "stat:avg_goals_for_per_game": stats.avgGoalsFor,
      "stat:avg_goals_against_per_game": stats.avgGoalsAgainst,
    };

    console.log(`\n📊 Updating ${team.name}:`);
    for (const [statId, value] of Object.entries(statMap)) {
      console.log(`   • ${statId} → ${value}`);
      const res = await statsConcept._setStatValue({
        teamname: team.name,
        sport: String(nhlSport._id) as ID,
        statId: statId as ID,
        value,
      });
      if ("error" in res) console.warn(`     ⚠️ Failed to set ${statId}: ${res.error}`);
    }

    console.log(`✅ [${team.name}] Stats synced.`);
    updatedCount++;
  }

  console.log(`\n🎉 Updated ${updatedCount}/${teams.length} NHL teams.`);
  await client.close();
  console.log("🔒 Database connection closed.");
}

if (import.meta.main) {
  updateNHLTeamStats()
    .then(() => console.log("✅ NHL stats update complete"))
    .catch((err) => {
      console.error("❌ Error updating NHL stats:", err);
      Deno.exit(1);
    });
}

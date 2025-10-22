// src/integrations/nfl/updateNFLTeamStats.ts

import SportsStatsConcept from "@concepts/SportsStats/SportsStatsConcept.ts";
import { getDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import { MongoClient } from "npm:mongodb";
import { fetchNFLTeamStats } from "./fetchNFLStats.ts";

/**
 * Updates all NFL teams in MongoDB with their latest stats from ESPN.
 */
export async function updateNFLTeamStats() {
  console.log("🏈 Starting NFL team stats update...");

  const [db, client] = await getDb() as [import("npm:mongodb").Db, MongoClient];
  const statsConcept = new SportsStatsConcept(db);

  const nflSport = await db.collection("SportsStats.sports").findOne({ name: "NFL-Football" });
  if (!nflSport?._id) {
    console.error("❌ NFL sport not found. Run importNFLTeams.ts first.");
    await client.close();
    return;
  }

  const teams = await db.collection("SportsStats.teams").find({ sport: String(nflSport._id) }).toArray();
  if (teams.length === 0) {
    console.warn("⚠️  No NFL teams found in database. Did you run importNFLTeams?");
    await client.close();
    return;
  }

  let updated = 0;
  for (const team of teams) {
    try {
      const stats = await fetchNFLTeamStats(team.externalId);
      const statMap = {
        "stat:wins": stats.wins,
        "stat:losses": stats.losses,
        "stat:ties": stats.ties,
        "stat:win_percent": stats.winPercent,
        "stat:points": stats.pointsFor,
        "stat:points_against": stats.pointsAgainst,
      };

      for (const [statId, value] of Object.entries(statMap)) {
        await statsConcept._setStatValue({
          teamname: team.name,
          sport: String(nflSport._id) as ID,
          statId: statId as ID,
          value,
        });
      }

      console.log(
        `✅ Updated ${team.name}: W=${stats.wins}, L=${stats.losses}, T=${stats.ties}, PF=${stats.pointsFor}, PA=${stats.pointsAgainst}`
      );
      updated++;
    } catch (err) {
      console.warn(`⚠️  Failed to update ${team.name}: ${err.message}`);
    }
  }

  console.log(`🎉 Updated ${updated}/${teams.length} NFL teams.`);
  await client.close();
  console.log("🔒 Closed database connection.");
}

// 👇 Run directly
if (import.meta.main) {
  updateNFLTeamStats()
    .then(() => console.log("✅ Done updating NFL stats"))
    .catch((err) => {
      console.error("❌ Error updating NFL stats:", err);
      Deno.exit(1);
    });
}

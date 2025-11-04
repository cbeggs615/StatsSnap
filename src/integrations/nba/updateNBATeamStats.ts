import SportsStatsConcept from "@concepts/SportsStats/SportsStatsConcept.ts";
import { getDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import { MongoClient } from "npm:mongodb";

/** Runs the Python stats fetcher and updates MongoDB with latest team stats. */
export async function updateNBATeamStats() {
  console.log("🏀 Starting NBA stats update...");

  // 1️⃣ Run Python to generate nba_team_stats.json
  const proc = Deno.run({
    cmd: ["python3", "src/integrations/nba/update_nba_team_stats.py"],
  });
  const status = await proc.status();
  if (!status.success) throw new Error("❌ Python update_nba_team_stats.py failed");

  // 2️⃣ Read the JSON
  const raw = await Deno.readTextFile("nba_team_stats.json");
  const allStats = JSON.parse(raw);

  // 3️⃣ Connect to MongoDB + concept
  const [db, client] = (await getDb()) as [import("npm:mongodb").Db, MongoClient];
  const statsConcept = new SportsStatsConcept(db);

  // 4️⃣ Find NBA sport
  const nbaSport = await db
    .collection("SportsStats.sports")
    .findOne({ name: "NBA-Basketball" });
  if (!nbaSport?._id) {
    console.error("❌ NBA sport not found. Run importNBATeams.ts first.");
    await client.close();
    return;
  }

  // 5️⃣ Get all NBA teams
  const teams = await db
    .collection("SportsStats.teams")
    .find({ sport: String(nbaSport._id) })
    .toArray();

  // 6️⃣ Update each team’s stats
  let updatedCount = 0;
  for (const team of teams) {
    const stats = allStats.find((s: any) => {
      const fullName = `${s.team_city ?? ""} ${s.team_name ?? ""}`.trim().toLowerCase();
      return (
        String(s.TEAM_ID ?? s.team_id) === team.externalId ||
        fullName === team.name.toLowerCase()
      );
    });

    if (!stats) {
      console.warn(`⚠️ No stats found for ${team.name}`);
      continue;
    }

    // Optional: Store raw snapshot
    await db.collection("SportsStats.data").updateOne(
      { team: team._id },
      { $set: { ...stats, updatedAt: new Date() } },
      { upsert: true },
    );

    // 7️⃣ Map fields to stat IDs
    const statMap: Record<string, number> = {
      "stat:wins": stats.wins,
      "stat:losses": stats.losses,
      "stat:ppg": stats.points_per_game,
      "stat:opp_ppg": stats.opp_points_per_game,
      "stat:diff_ppg": stats.diff_points_pg,
      "stat:fg_pct": stats.fg_pct ?? 0,
    };

    console.log(`\n📊 Updating ${team.name}:`);
    for (const [statId, value] of Object.entries(statMap)) {
      console.log(`   • ${statId} → ${value}`);
      const res = await statsConcept._setStatValue({
        teamname: team.name,
        sport: String(nbaSport._id) as ID,
        statId: statId as ID,
        value,
      });
      if ("error" in res)
        console.warn(`     ⚠️ Failed to set ${statId}: ${res.error}`);
    }

    console.log(`✅ [${team.name}] Stats synced.`);
    updatedCount++;
  }

  console.log(`\n🎉 Updated ${updatedCount}/${teams.length} NBA teams.`);
  await client.close();
  console.log("🔒 Database connection closed.");
}

if (import.meta.main) {
  updateNBATeamStats()
    .then(() => console.log("✅ NBA stats update complete"))
    .catch((err) => {
      console.error("❌ Error updating NBA stats:", err);
      Deno.exit(1);
    });
}

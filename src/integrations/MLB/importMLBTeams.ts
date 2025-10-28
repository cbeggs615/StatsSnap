// src/integrations/mlb/importMLBTeams.ts
import SportsStatsConcept from "@concepts/SportsStats/SportsStatsConcept.ts";
import { fetchMLBTeams } from "./fetchMLBTeams.ts";
import { getDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import { MongoClient } from "npm:mongodb";

export async function importMLBTeams() {
  console.log("🚀 Starting MLB import script...");
  const [db, client] = await getDb() as [import("npm:mongodb").Db, MongoClient];
  const stats = new SportsStatsConcept(db);

  // 1️⃣ Remove any old MLB sport so we can recreate it with correct defaultKeyStats
  console.log("🧹 Removing any existing MLB-Baseball sport...");
  await db.collection("SportsStats.sports").deleteOne({ name: "MLB-Baseball" });

  // 2️⃣ Add the MLB sport fresh with correct defaultKeyStats
  console.log("⚙️ Adding new sport: MLB-Baseball");
  const res = await stats.addSport({
    sportName: "MLB-Baseball",
    source: "source:MLB_API" as ID,
    default: new Set(["stat:wins" as ID, "stat:losses" as ID]),
  });

  if (!("sport" in res)) {
    console.error("❌ Failed to add MLB sport:", res.error);
    await client.close();
    return;
  }

  const sport = await db.collection("SportsStats.sports").findOne({ _id: res.sport });
  if (!sport?._id) {
    console.error("❌ Could not locate MLB sport after creation.");
    await client.close();
    return;
  }

  // 3️⃣ Remove all existing teams for this sport
  const deleteResult = await db.collection("SportsStats.teams").deleteMany({ sport: String(sport._id) });
  console.log(`🧹 Removed ${deleteResult.deletedCount ?? 0} existing MLB teams.`);

  // 4️⃣ Fetch all MLB teams from the official MLB API
  console.log("⚾ Fetching teams from MLB API...");
  const teams = await fetchMLBTeams();

  // 5️⃣ Add each team
  let addedCount = 0;
  for (const team of teams) {
    const addRes = await stats.addTeam({
      teamname: team.name,
      sport: String(sport._id) as ID,
      externalId: team.externalId, // numeric MLB API ID
    });

    if ("teamStats" in addRes) {
      console.log(`   ➕ Added ${team.name}`);
      addedCount++;
    } else {
      console.warn(`   ⚠️ Failed to add ${team.name}: ${addRes.error}`);
    }
  }

  console.log(`✅ Imported ${addedCount} new MLB teams (out of ${teams.length} total).`);
  await client.close();
  console.log("🔒 Closed database connection.");
  console.log("🎉 Import completed successfully");
}

// Allow direct CLI execution
if (import.meta.main) {
  importMLBTeams().catch((err) => {
    console.error("❌ Error during MLB team import:", err);
    Deno.exit(1);
  });
}

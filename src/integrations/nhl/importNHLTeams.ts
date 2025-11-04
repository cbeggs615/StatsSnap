// src/integrations/nhl/importNHLTeams.ts
import SportsStatsConcept from "@concepts/SportsStats/SportsStatsConcept.ts";
import { fetchNHLTeams } from "./fetchNHLTeams.ts";
import { getDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import { MongoClient } from "npm:mongodb";

export async function importNHLTeams() {
  console.log("🏒 Starting NHL import script...");
  const [db, client] = await getDb() as [import("npm:mongodb").Db, MongoClient];
  const stats = new SportsStatsConcept(db);

  // 1️⃣ Remove any old NHL-Hockey sport so we can recreate it cleanly
  console.log("🧹 Removing old NHL-Hockey sport...");
  await db.collection("SportsStats.sports").deleteOne({ name: "NHL-Hockey" });

  // 2️⃣ Add the NHL sport fresh with default stats
  console.log("⚙️ Adding new sport: NHL-Hockey");
  const res = await stats.addSport({
    sportName: "NHL-Hockey",
    source: "source:NHL_API" as ID,
    default: new Set([
      "stat:wins" as ID,
      "stat:losses" as ID,
    ]),
  });

  if (!("sport" in res)) {
    console.error("❌ Failed to add NHL sport:", res.error);
    await client.close();
    return;
  }

  const sport = await db.collection("SportsStats.sports").findOne({ _id: res.sport });
  if (!sport?._id) {
    console.error("❌ Could not locate NHL sport after creation.");
    await client.close();
    return;
  }

  // 3️⃣ Remove all existing teams for this sport
  const deleteResult = await db.collection("SportsStats.teams").deleteMany({ sport: String(sport._id) });
  console.log(`🧹 Removed ${deleteResult.deletedCount ?? 0} existing NHL teams.`);

  // 4️⃣ Fetch teams from ESPN API
  console.log("🏒 Fetching teams from ESPN...");
  const teams = await fetchNHLTeams();

  // 5️⃣ Add teams with externalId
  let addedCount = 0;
  for (const team of teams) {
    const res = await stats.addTeam({
      teamname: team.name,
      sport: String(sport._id) as ID,
      externalId: team.externalId,
    });

    if ("teamStats" in res) {
      console.log(`   ➕ Added ${team.name} (ESPN ID: ${team.externalId})`);
      addedCount++;
    } else {
      console.warn(`   ⚠️ Failed to add ${team.name}: ${res.error}`);
    }
  }

  console.log(`✅ Imported ${addedCount} NHL teams (out of ${teams.length} total).`);
  await client.close();
  console.log("🔒 Closed database connection.");
  console.log("🎉 NHL import completed successfully");
}

// CLI entrypoint
if (import.meta.main) {
  importNHLTeams().catch((err) => {
    console.error("❌ Error during NHL import:", err);
    Deno.exit(1);
  });
}

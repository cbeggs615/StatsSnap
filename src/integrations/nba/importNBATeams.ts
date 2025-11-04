import SportsStatsConcept from "@concepts/SportsStats/SportsStatsConcept.ts";
import { getDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import { MongoClient } from "npm:mongodb";

/** Runs the Python import script, reads nba_teams.json, and populates DB */
export async function importNBATeams() {
  console.log("🚀 Starting NBA import script...");

  // 1️⃣ Run Python to generate nba_teams.json
  const proc = Deno.run({ cmd: ["python3", "src/integrations/nba/import_nba_teams.py"] });
  const status = await proc.status();
  if (!status.success) throw new Error("❌ Python import_nba_teams.py failed");

  // 2️⃣ Load the JSON file
  const raw = await Deno.readTextFile("nba_teams.json");
  const teams = JSON.parse(raw);

  const [db, client] = await getDb() as [import("npm:mongodb").Db, MongoClient];
  const stats = new SportsStatsConcept(db);

  // 3️⃣ Remove existing NBA sport
  console.log("🧹 Removing any existing NBA-Basketball sport...");
  await db.collection("SportsStats.sports").deleteOne({ name: "NBA-Basketball" });

  // 4️⃣ Add the sport entry
  const res = await stats.addSport({
    sportName: "NBA-Basketball",
    source: "source:NBA_API" as ID,
    default: new Set(["stat:wins" as ID, "stat:losses" as ID]),
  });
  if (!("sport" in res)) {
    console.error("❌ Failed to add NBA sport:", res.error);
    await client.close();
    return;
  }
  const sport = await db.collection("SportsStats.sports").findOne({ _id: res.sport });

  // 5️⃣ Remove existing teams
  const del = await db.collection("SportsStats.teams").deleteMany({ sport: String(sport!._id) });
  console.log(`🧹 Removed ${del.deletedCount ?? 0} existing NBA teams.`);

  // 6️⃣ Add new teams
  let added = 0;
  for (const t of teams) {
    const addRes = await stats.addTeam({
      teamname: t.name,
      sport: String(sport!._id) as ID,
      externalId: String(t.id),
    });
    if ("teamStats" in addRes) {
      console.log(`   ➕ Added ${t.name}`);
      added++;
    } else {
      console.warn(`   ⚠️ Failed to add ${t.name}: ${addRes.error}`);
    }
  }

  console.log(`✅ Imported ${added}/${teams.length} NBA teams.`);
  await client.close();
  console.log("🔒 Database connection closed.");
}

if (import.meta.main) {
  importNBATeams()
    .then(() => console.log("🎉 NBA teams import complete"))
    .catch((err) => {
      console.error("❌ Error importing NBA teams:", err);
      Deno.exit(1);
    });
}

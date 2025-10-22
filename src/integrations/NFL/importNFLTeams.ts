// src/integrations/nfl/importNFLTeams.ts

import SportsStatsConcept from "@concepts/SportsStats/SportsStatsConcept.ts";
import { fetchNFLTeams } from "./fetchNFLTeams.ts";
import { getDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import { MongoClient } from "npm:mongodb";

/**
 * Imports all NFL teams into the SportsStats database.
 * - Ensures "NFL-Football" sport exists
 * - Removes old NFL teams (and their data)
 * - Fetches all teams from the ESPN API
 * - Adds each team with its ESPN external ID
 */
export async function importNFLTeams() {
  console.log("🏈 Starting NFL import script...");

  const [db, client] = await getDb() as [import("npm:mongodb").Db, MongoClient];
  const stats = new SportsStatsConcept(db);

  // 1️⃣ Ensure NFL sport exists
  let sport = await db.collection("SportsStats.sports").findOne({ name: "NFL-Football" });
  if (!sport) {
    console.log("⚙️  Adding new sport: NFL-Football");
    const res = await stats.addSport({
      sportName: "NFL-Football",
      source: "source:NFL_API" as ID,
      default: new Set([
        "stat:wins" as ID,
        "stat:losses" as ID,
        "stat:points" as ID,
        "stat:points_against" as ID,
      ]),
    });
    if ("sport" in res) {
      sport = await db.collection("SportsStats.sports").findOne({ _id: res.sport });
    }
  } else {
    console.log("✅ Sport already exists: NFL-Football");
  }

  // 2️⃣ Delete all existing NFL teams and their data for a clean reimport
  if (sport && sport._id) {
    console.log("🧹 Removing existing NFL teams and data...");
    const nflTeams = await db.collection("SportsStats.teams").find({ sport: String(sport._id) }).toArray();

    for (const team of nflTeams) {
      await db.collection("SportsStats.data").deleteMany({ team: team._id });
      await db.collection("SportsStats.statValues").deleteMany({ teamname: team.name, sport: String(sport._id) });
    }

    await db.collection("SportsStats.teams").deleteMany({ sport: String(sport._id) });
    console.log(`🗑️  Deleted ${nflTeams.length} old NFL teams and their associated data.`);
  }

  // 3️⃣ Fetch and add all NFL teams from ESPN
  console.log("🏈 Fetching teams from ESPN...");
  const teams = await fetchNFLTeams();

  let added = 0;
  for (const team of teams) {
    const res = await stats.addTeam({
      teamname: team.name,
      sport: String(sport._id) as ID,
    });

    if ("teamStats" in res) {
      await db.collection("SportsStats.teams").updateOne(
        { _id: res.teamStats },
        { $set: { externalId: team.externalId } },
      );
    }

    added++;
    console.log(`   ➕ Added ${team.name} (ESPN ID: ${team.externalId})`);
  }

  await client.close();
  console.log(`✅ Imported ${added} NFL teams (out of ${teams.length} total).`);
  console.log("🔒 Closed database connection.");
}

// 👇 Run directly
if (import.meta.main) {
  importNFLTeams()
    .then(() => console.log("🎉 NFL import completed successfully"))
    .catch((err) => {
      console.error("❌ NFL import failed:", err);
      Deno.exit(1);
    });
}

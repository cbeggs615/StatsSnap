import SportsStatsConcept from "@concepts/SportsStats/SportsStatsConcept.ts";
import { fetchMLBTeams } from "../integrations/MLB/fetchMLBTeams.ts";
import { getDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";

export async function importMLBTeams() {
  const [db, _client] = await getDb() as [import("npm:mongodb").Db, unknown];
  const stats = new SportsStatsConcept(db);

  // 1️⃣ Ensure MLB sport exists
  let sport = await db.collection("SportsStats.sports").findOne({
    name: "MLB-Baseball",
  });
  if (!sport) {
    const res = await stats.addSport({
      sportName: "MLB-Baseball",
      source: "source:MLB_API" as ID,
      default: new Set(["stat:runs" as ID, "stat:home_runs" as ID]),
    });
    if ("sport" in res) {
      sport = await db.collection("SportsStats.sports").findOne({
        _id: res.sport,
      });
    }
  }

  // 2️⃣ Fetch and add all MLB teams
  const teams = await fetchMLBTeams();
  for (const team of teams) {
    const exists = await db.collection("SportsStats.teams").findOne({
      name: team.name,
    });
    if (!exists && sport && sport._id) {
      await stats.addTeam({
        teamname: team.name,
        sport: String(sport._id) as ID,
      });
    }
  }

  console.log(`Imported ${teams.length} MLB teams.`);
}

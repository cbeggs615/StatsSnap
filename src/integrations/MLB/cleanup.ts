import { getDb } from "@utils/database.ts";
import { MongoClient } from "npm:mongodb";

/**
 * Removes old or unwanted stat fields from MLB data/statValues collections.
 */
export async function cleanupOldStats() {
  console.log("🧹 Starting MLB stat cleanup...");

  const [db, client] = await getDb() as [import("npm:mongodb").Db, MongoClient];

  // 1️⃣ Remove fields from raw data collection
  const dataResult = await db.collection("SportsStats.data").updateMany(
    {},
    { $unset: { era: "", strikeouts: "" } },
  );
  console.log(`🗑️  Removed 'era' and 'strikeouts' fields from ${dataResult.modifiedCount} data docs.`);

  // 2️⃣ Delete statValues entries matching these statIds
  const statValuesResult = await db.collection("SportsStats.statValues").deleteMany({
    statId: { $in: ["stat:era", "stat:strikeouts"] },
  });
  console.log(`🗑️  Deleted ${statValuesResult.deletedCount} old statValues entries (era/strikeouts).`);

  await client.close();
  console.log("✅ Cleanup complete and DB connection closed.");
}

// Run directly
if (import.meta.main) {
  cleanupOldStats()
    .then(() => console.log("✨ Done cleaning up old MLB stats."))
    .catch((err) => {
      console.error("❌ Error during cleanup:", err);
      Deno.exit(1);
    });
}

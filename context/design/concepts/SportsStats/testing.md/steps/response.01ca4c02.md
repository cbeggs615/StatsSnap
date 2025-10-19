---
timestamp: 'Thu Oct 16 2025 22:55:59 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_225559.522f1d10.md]]'
content_id: 01ca4c0262ffe7fbf0a65f330c96afb2008b3837d795bb77951680da18feae65
---

# response:

```typescript
// file: src/SportsStats/SportsStatsConcept.ts

import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts"; // Assuming these utilities are available as described
import { freshID } from "@utils/database.ts"; // Assuming these utilities are available as described

// Define collection prefix, using concept name
const PREFIX = "SportsStats" + ".";

/**
 * @concept SportsStats [Source, Stat, Data]
 * @purpose store team statistics in a structured way, where each sport defines which stats are tracked and which are considered key
 * @principle each sport defines a set of stats relevant to it (with some marked as key);
 *            teams belonging to that sport inherit those stat types and maintain their own current values
 */
export default class SportsStatsConcept {
  // --- Type Definitions for internal use and generic parameters ---
  // These map directly to the 'state' description in the concept and the generic parameters.

  type Source = ID; // Opaque ID for the data source
  type Stat = ID;   // Opaque ID for a specific statistic (e.g., "goals", "assists")
  type Data = unknown; // Generic data type, can be any value that MongoDB can store (string, number, object, etc.)

  /**
   * Represents a TeamStats entry in the database.
   * Corresponds to: "a set of TeamStats with a name String, a Sport"
   */
  interface TeamStatsDocument {
    _id: ID;       // Unique ID for this TeamStats entry
    name: string;  // The name of the team (e.g., "Lakers")
    sport: ID;     // The ID of the associated Sport (e.g., "NBA-Basketball")
  }

  /**
   * Represents a Sport entry in the database.
   * Corresponds to: "a set of Sports with a name String, a Source, a KeyStats set of Stats"
   */
  interface SportsDocument {
    _id: ID;         // Unique ID for this Sport entry
    name: string;    // The name of the sport (e.g., "Basketball", "Football")
    source: Source;  // An opaque ID referencing where the data for this sport *might* originate or be categorized.
                     // The concept itself does not interpret this ID for external fetching.
    keyStats: Stat[]; // A list of Stat IDs considered "key" for this sport.
  }

  /**
   * Internal collection to store actual statistical values for teams and their stats.
   * This collection is necessary to fulfill the `fetchTeamStats` action while adhering to
   * the "Completeness of functionality" principle, meaning the concept must manage its own data.
   * However, the concept's public actions, as specified, do not include an action to populate this
   * `statValues` collection. In a complete system, `syncs` would typically call an internal
   * or a system action (like `_setStatValue` below) to update these values from external sources.
   */
  interface StatValueDocument {
    _id: ID;         // Unique ID for this stat value entry
    teamStatId: ID;  // Reference to the _id of the associated TeamStatsDocument
    sportId: ID;     // Redundant but useful for indexing/querying, reference to SportsDocument._id
    statId: Stat;    // The ID of the statistic (e.g., "points", "assists")
    value: Data;     // The actual data value for the statistic
  }

  // MongoDB Collections for the concept's state
  private teams: Collection<TeamStatsDocument>;
  private sports: Collection<SportsDocument>;
  private statValues: Collection<StatValueDocument>;

  constructor(private readonly db: Db) {
    this.teams = this.db.collection<TeamStatsDocument>(PREFIX + "teams");
    this.sports = this.db.collection<SportsDocument>(PREFIX + "sports");
    this.statValues = this.db.collection<StatValueDocument>(PREFIX + "statValues");
  }

  /**
   * @action addTeam
   * @requires no TeamStats for this teamname with this sport already exists, and the sport must exist.
   * @effects creates a new TeamStats for this teamname for sport, returning its ID.
   */
  async addTeam(
    { teamname, sport }: { teamname: string; sport: ID },
  ): Promise<{ teamStats: ID } | { error: string }> {
    // Precondition 1: Check if a TeamStats entry for this teamname and sport already exists
    const existingTeam = await this.teams.findOne({ name: teamname, sport: sport });
    if (existingTeam) {
      return { error: `TeamStats for team '${teamname}' in sport '${sport}' already exists.` };
    }

    // Precondition 2: Ensure the specified sport exists
    const sportDoc = await this.sports.findOne({ _id: sport });
    if (!sportDoc) {
      return { error: `Sport with ID '${sport}' does not exist. Please add the sport first.` };
    }

    // Effect: Create a new TeamStats document
    const newTeamStatsId = freshID();
    const insertResult = await this.teams.insertOne({
      _id: newTeamStatsId,
      name: teamname,
      sport: sport,
    });

    if (insertResult.acknowledged) {
      return { teamStats: newTeamStatsId };
    } else {
      return { error: "Failed to create new team stats entry." };
    }
  }

  /**
   * @action removeTeam
   * @requires TeamStats for this teamname with this sport exists.
   * @effects removes TeamStats for this teamname for sport, and all associated stat values. Returns the ID of the removed entry.
   */
  async removeTeam(
    { teamname, sport }: { teamname: string; sport: ID },
  ): Promise<{ teamStats: ID } | { error: string }> {
    // Precondition: Check if TeamStats for this teamname with this sport exists
    const existingTeam = await this.teams.findOne({ name: teamname, sport: sport });
    if (!existingTeam) {
      return { error: `TeamStats for team '${teamname}' in sport '${sport}' does not exist.` };
    }

    // Effect: Remove the TeamStats document
    const deleteResult = await this.teams.deleteOne({ _id: existingTeam._id });

    if (deleteResult.acknowledged && deleteResult.deletedCount === 1) {
      // Also remove any associated stat values for this TeamStats entry to maintain consistency
      await this.statValues.deleteMany({ teamStatId: existingTeam._id });
      return { teamStats: existingTeam._id };
    } else {
      return { error: "Failed to remove team stats entry." };
    }
  }

  /**
   * @action addSport
   * @requires no Sport with this name exists.
   * @effects creates a new Sport with the given name, source, and default key stats. Returns the ID of the new sport.
   */
  async addSport(
    { sportName, source, default: defaultKeyStats }: { sportName: string; source: Source; default: Set<Stat> },
  ): Promise<{ sport: ID } | { error: string }> {
    // Precondition: Check if a Sport with this name already exists
    const existingSport = await this.sports.findOne({ name: sportName });
    if (existingSport) {
      return { error: `Sport '${sportName}' already exists.` };
    }

    // Effect: Create a new Sport document
    const newSportId = freshID();
    const insertResult = await this.sports.insertOne({
      _id: newSportId,
      name: sportName,
      source: source,
      keyStats: Array.from(defaultKeyStats), // Convert Set to Array for MongoDB storage
    });

    if (insertResult.acknowledged) {
      return { sport: newSportId };
    } else {
      return { error: "Failed to add sport." };
    }
  }

  /**
   * @action deleteSport
   * @requires Sport with this name exists and no teams are currently associated with it.
   * @effects removes the sport from the state, returning its ID.
   */
  async deleteSport(
    { sportName }: { sportName: string },
  ): Promise<{ sport: ID } | { error: string }> {
    // Precondition 1: Check if the Sport with this name exists
    const existingSport = await this.sports.findOne({ name: sportName });
    if (!existingSport) {
      return { error: `Sport '${sportName}' does not exist.` };
    }

    // Precondition 2: Check if any teams are associated with this sport
    const teamsForSport = await this.teams.countDocuments({ sport: existingSport._id });
    if (teamsForSport > 0) {
      return { error: `Cannot delete sport '${sportName}' because it has ${teamsForSport} associated team(s).` };
    }

    // Effect: Remove the Sport document
    const deleteResult = await this.sports.deleteOne({ _id: existingSport._id });

    if (deleteResult.acknowledged && deleteResult.deletedCount === 1) {
      // Also remove any associated stat values for this sport (if any were ever stored directly related to sportId)
      await this.statValues.deleteMany({ sportId: existingSport._id });
      return { sport: existingSport._id };
    } else {
      return { error: "Failed to delete sport." };
    }
  }

  /**
   * @action addKeyStat
   * @requires Sport with this name exists, and the stat is not already in its KeyStats.
   * @effects adds the specified stat to the sport's set of KeyStats.
   */
  async addKeyStat(
    { sportName, stat }: { sportName: string; stat: Stat },
  ): Promise<Empty | { error: string }> {
    // Precondition 1: Check if the Sport with this name exists
    const sportDoc = await this.sports.findOne({ name: sportName });
    if (!sportDoc) {
      return { error: `Sport '${sportName}' does not exist.` };
    }

    // Precondition 2: Check if the stat is not already a key stat for this sport
    if (sportDoc.keyStats.includes(stat)) {
      return { error: `Stat '${stat}' is already a key stat for sport '${sportName}'.` };
    }

    // Effect: Add the stat to the sport's KeyStats array
    const updateResult = await this.sports.updateOne(
      { _id: sportDoc._id },
      { $addToSet: { keyStats: stat } }, // $addToSet ensures uniqueness
    );

    if (updateResult.acknowledged && updateResult.modifiedCount === 1) {
      return {};
    } else {
      return { error: "Failed to add key stat." };
    }
  }

  /**
   * @action removeKeyStat
   * @requires Sport with this name exists, and the stat is currently in its KeyStats.
   * @effects removes the specified stat from the sport's set of KeyStats.
   */
  async removeKeyStat(
    { sportName, stat }: { sportName: string; stat: Stat },
  ): Promise<Empty | { error: string }> {
    // Precondition 1: Check if the Sport with this name exists
    const sportDoc = await this.sports.findOne({ name: sportName });
    if (!sportDoc) {
      return { error: `Sport '${sportName}' does not exist.` };
    }

    // Precondition 2: Check if the stat is currently a key stat for this sport
    if (!sportDoc.keyStats.includes(stat)) {
      return { error: `Stat '${stat}' is not a key stat for sport '${sportName}'.` };
    }

    // Effect: Remove the stat from the sport's KeyStats array
    const updateResult = await this.sports.updateOne(
      { _id: sportDoc._id },
      { $pull: { keyStats: stat } },
    );

    if (updateResult.acknowledged && updateResult.modifiedCount === 1) {
      return {};
    } else {
      return { error: "Failed to remove key stat." };
    }
  }

  /**
   * @action fetchTeamStats
   * @requires TeamStat for this teamname and sport exists.
   * @effects for each KeyStat in sport's KeyStats, fetches Data for this specific team from the concept's internal storage.
   *          Returns a map of Stat IDs to their corresponding Data values.
   *
   * @note Design Implication: The provided concept specification for SportsStats does not include an explicit
   *       action to *store* or *update* the actual statistical `Data` for teams. To adhere to the
   *       "Completeness of functionality" principle, this implementation assumes that `SportsStats` itself
   *       manages these values in an internal `statValues` collection. Without a public action to populate
   *       this collection, `fetchTeamStats` will primarily return an empty map or only data previously
   *       injected (e.g., via `syncs` calling an internal helper method like `_setStatValue` for testing).
   *       This highlights a potential gap in the concept's provided action set if the intention was for
   *       this concept to fully manage both definitions *and* values of statistics through its public API.
   */
  async fetchTeamStats(
    { teamname, sport }: { teamname: string; sport: ID },
  ): Promise<{ keyStatsData: Record<Stat, Data> } | { error: string }> {
    // Precondition: Check if TeamStat for this teamname and sport exists
    const teamStatsDoc = await this.teams.findOne({ name: teamname, sport: sport });
    if (!teamStatsDoc) {
      return { error: `TeamStats for team '${teamname}' in sport '${sport}' does not exist.` };
    }

    // Retrieve the associated Sport document to get its key stats
    const sportDoc = await this.sports.findOne({ _id: sport });
    if (!sportDoc) {
      // This case indicates an inconsistency (a team exists for a non-existent sport ID)
      return { error: `Associated sport with ID '${sport}' not found, which is an internal inconsistency.` };
    }

    const keyStatsData: Record<Stat, Data> = {};
    const teamStatId = teamStatsDoc._id;
    const sportId = sportDoc._id;

    // Fetch all relevant stat values from the internal `statValues` collection
    const statValuesDocs = await this.statValues.find({
      teamStatId: teamStatId,
      sportId: sportId,
      statId: { $in: sportDoc.keyStats }, // Filter only for key stats defined for this sport
    }).toArray();

    // Populate the result map with fetched data
    for (const statId of sportDoc.keyStats) {
      const valueDoc = statValuesDocs.find(doc => doc.statId === statId);
      if (valueDoc) {
        keyStatsData[statId] = valueDoc.value;
      }
      // If a key stat has no corresponding value in `statValues`, it's simply omitted from the map.
      // Depending on requirements, it could default to `null`, `0`, or `undefined`.
    }

    return { keyStatsData: keyStatsData };
  }

  /**
   * @system _setStatValue (Internal / System Action for data injection)
   * This is not a public action from the concept spec but is included as a 'system' or 'internal'
   * action to allow `fetchTeamStats` to actually return data, given the absence of such an
   * action in the provided concept specification. In a full system, `syncs` would typically
   * invoke such a method based on data from the `Source` identified in the `Sport` definition.
   * @requires a TeamStats entry for the given teamname and sport must exist.
   * @effects either creates a new stat value entry or updates an existing one for the specified team, sport, and stat.
   */
  async _setStatValue(
    { teamname, sport, statId, value }: { teamname: string; sport: ID; statId: Stat; value: Data },
  ): Promise<Empty | { error: string }> {
    const teamStatsDoc = await this.teams.findOne({ name: teamname, sport: sport });
    if (!teamStatsDoc) {
      return { error: `TeamStats for team '${teamname}' in sport '${sport}' does not exist.` };
    }
    const sportDoc = await this.sports.findOne({ _id: sport });
    if (!sportDoc) {
      return { error: `Sport with ID '${sport}' not found.` };
    }

    const teamStatId = teamStatsDoc._id;
    const sportId = sportDoc._id;

    const existingStatValue = await this.statValues.findOne({
      teamStatId: teamStatId,
      sportId: sportId,
      statId: statId,
    });

    if (existingStatValue) {
      // Update existing stat value
      await this.statValues.updateOne(
        { _id: existingStatValue._id },
        { $set: { value: value } },
      );
    } else {
      // Insert new stat value
      await this.statValues.insertOne({
        _id: freshID(),
        teamStatId: teamStatId,
        sportId: sportId,
        statId: statId,
        value: value,
      });
    }
    return {};
  }
}
```

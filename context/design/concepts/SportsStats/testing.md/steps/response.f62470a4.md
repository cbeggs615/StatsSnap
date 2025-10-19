---
timestamp: 'Thu Oct 16 2025 23:07:37 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_230737.ec5f3bb1.md]]'
content_id: f62470a4bed3cd34ba805c426b5341b7a3d3769b65f53cb704e843f9f6c512f8
---

# response:

Okay, this is a great exercise in focusing tests on the overarching design goals and interesting interactions rather than just atomistic action checks.

Here's a refactored test suite with 5 tests, explicitly targeting the concept's principle and unique scenarios, while ensuring all actions are still covered:

```typescript
// file: src/SportsStats/SportsStatsConcept.test.ts

import { assertEquals, assertExists, assertInstanceOf } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import SportsStatsConcept from "./SportsStatsConcept.ts";

// --- Global Test Constants ---
const SOURCE_API_MLB = "source:MLB_API" as ID;
const SOURCE_API_NBA = "source:NBA_API" as ID;

const SPORT_BASEBALL_NAME = "MLB-Baseball";
const SPORT_BASKETBALL_NAME = "NBA-Basketball";

const TEAM_PHILLIES_NAME = "Philadelphia Phillies";
const TEAM_LAKERS_NAME = "LA Lakers";

const STAT_RUNS = "stat:runs" as ID;
const STAT_HOME_RUNS = "stat:home_runs" as ID;
const STAT_POINTS = "stat:points" as ID;
const STAT_ASSISTS = "stat:assists" as ID;
const STAT_REBOUNDS = "stat:rebounds" as ID;
const STAT_FOULS = "stat:fouls" as ID;


// --- Test Helper for extracting ID from successful result ---
function assertSuccess<T extends { error?: string }>(
  result: T,
  message: string = "Action should succeed",
): Exclude<T, { error: string }> {
  assertEquals("error" in result, false, `${message}: ${result.error || ''}`);
  return result as Exclude<T, { error: string }>;
}

Deno.test(
  "Principle Test: SportsStats 1. Sport defines key stats, team inherits and maintains values",
  async () => {
    const [db, client] = await testDb();
    const stats = new SportsStatsConcept(db);
    try {
      // 1. Add a sport with initial key stats
      const addSportResult = assertSuccess(
        await stats.addSport({
          sportName: SPORT_BASKETBALL_NAME,
          source: SOURCE_API_NBA,
          default: new Set([STAT_POINTS, STAT_ASSISTS]),
        }),
        "addSport for Basketball",
      );
      const basketballSportId = addSportResult.sport;
      assertExists(basketballSportId);

      // 2. Add a team to that sport
      const addTeamResult = assertSuccess(
        await stats.addTeam({ teamname: TEAM_LAKERS_NAME, sport: basketballSportId }),
        "addTeam for Lakers",
      );
      const lakersTeamStatsId = addTeamResult.teamStats;
      assertExists(lakersTeamStatsId);

      // 3. Inject values for these key stats (simulating data ingestion)
      assertSuccess(
        await stats._setStatValue({
          teamname: TEAM_LAKERS_NAME,
          sport: basketballSportId,
          statId: STAT_POINTS,
          value: 115,
        }),
        "set STAT_POINTS",
      );
      assertSuccess(
        await stats._setStatValue({
          teamname: TEAM_LAKERS_NAME,
          sport: basketballSportId,
          statId: STAT_ASSISTS,
          value: 30,
        }),
        "set STAT_ASSISTS",
      );
      // Inject a non-key stat to ensure it's not fetched by default
      assertSuccess(
        await stats._setStatValue({
          teamname: TEAM_LAKERS_NAME,
          sport: basketballSportId,
          statId: STAT_FOULS,
          value: 10,
        }),
        "set STAT_FOULS (non-key)",
      );

      // 4. Fetch team stats and verify the values for key stats
      const fetchResult = assertSuccess(
        await stats.fetchTeamStats({
          teamname: TEAM_LAKERS_NAME,
          sport: basketballSportId,
        }),
        "fetchTeamStats for Lakers",
      );
      assertEquals(fetchResult.keyStatsData[STAT_POINTS], 115, "STAT_POINTS should match");
      assertEquals(fetchResult.keyStatsData[STAT_ASSISTS], 30, "STAT_ASSISTS should match");
      assertEquals(fetchResult.keyStatsData[STAT_FOULS], undefined, "Non-key STAT_FOULS should not be fetched");

      // 5. Clean up: Remove team and sport
      assertSuccess(
        await stats.removeTeam({ teamname: TEAM_LAKERS_NAME, sport: basketballSportId }),
        "removeTeam for Lakers",
      );
      assertSuccess(
        await stats.deleteSport({ sportName: SPORT_BASKETBALL_NAME }),
        "deleteSport for Basketball",
      );

      // Verify deletion
      const checkTeam = await stats.fetchTeamStats({ teamname: TEAM_LAKERS_NAME, sport: basketballSportId });
      assertEquals("error" in checkTeam, true, "Fetching deleted team should fail");
      const checkSport = await stats.deleteSport({ sportName: SPORT_BASKETBALL_NAME }); // Try deleting again
      assertEquals("error" in checkSport, true, "Deleting already deleted sport should fail");
    } finally {
      await client.close();
    }
  },
);

Deno.test(
  "Sports Stats 2. Dynamic Key Stat Management Affects Team Data Retrieval",
  async () => {
    const [db, client] = await testDb();
    const stats = new SportsStatsConcept(db);
    try {
      // Setup: Add sport, team, and initial stats
      const addSportResult = assertSuccess(
        await stats.addSport({
          sportName: SPORT_BASEBALL_NAME,
          source: SOURCE_API_MLB,
          default: new Set([STAT_RUNS]), // Only runs initially
        }),
        "addSport for Baseball",
      );
      const baseballSportId = addSportResult.sport;

      const addTeamResult = assertSuccess(
        await stats.addTeam({ teamname: TEAM_PHILLIES_NAME, sport: baseballSportId }),
        "addTeam for Phillies",
      );
      const philliesTeamStatsId = addTeamResult.teamStats;

      assertSuccess(
        await stats._setStatValue({
          teamname: TEAM_PHILLIES_NAME,
          sport: baseballSportId,
          statId: STAT_RUNS,
          value: 5,
        }),
        "set STAT_RUNS",
      );
      // Also set a value for a stat that's NOT a key stat yet
      assertSuccess(
        await stats._setStatValue({
          teamname: TEAM_PHILLIES_NAME,
          sport: baseballSportId,
          statId: STAT_HOME_RUNS,
          value: 2,
        }),
        "set STAT_HOME_RUNS (not key yet)",
      );

      // Verify initial fetch only gets STAT_RUNS
      let fetchResult = assertSuccess(
        await stats.fetchTeamStats({ teamname: TEAM_PHILLIES_NAME, sport: baseballSportId }),
        "initial fetchTeamStats",
      );
      assertEquals(Object.keys(fetchResult.keyStatsData).length, 1);
      assertEquals(fetchResult.keyStatsData[STAT_RUNS], 5);
      assertEquals(fetchResult.keyStatsData[STAT_HOME_RUNS], undefined); // Not a key stat yet

      // Add a new key stat (STAT_HOME_RUNS)
      assertSuccess(
        await stats.addKeyStat({ sportName: SPORT_BASEBALL_NAME, stat: STAT_HOME_RUNS }),
        "addKeyStat for HOME_RUNS",
      );

      // Fetch again: now STAT_HOME_RUNS should be included
      fetchResult = assertSuccess(
        await stats.fetchTeamStats({ teamname: TEAM_PHILLIES_NAME, sport: baseballSportId }),
        "fetchTeamStats after adding key stat",
      );
      assertEquals(Object.keys(fetchResult.keyStatsData).length, 2);
      assertEquals(fetchResult.keyStatsData[STAT_RUNS], 5);
      assertEquals(fetchResult.keyStatsData[STAT_HOME_RUNS], 2);

      // Remove a key stat (STAT_RUNS)
      assertSuccess(
        await stats.removeKeyStat({ sportName: SPORT_BASEBALL_NAME, stat: STAT_RUNS }),
        "removeKeyStat for RUNS",
      );

      // Fetch again: STAT_RUNS should no longer be included as a key stat
      fetchResult = assertSuccess(
        await stats.fetchTeamStats({ teamname: TEAM_PHILLIES_NAME, sport: baseballSportId }),
        "fetchTeamStats after removing key stat",
      );
      assertEquals(Object.keys(fetchResult.keyStatsData).length, 1);
      assertEquals(fetchResult.keyStatsData[STAT_RUNS], undefined);
      assertEquals(fetchResult.keyStatsData[STAT_HOME_RUNS], 2);
    } finally {
      await client.close();
    }
  },
);

Deno.test(
  "SportsStats 3: Strict Separation of Concerns - Data Isolation Across Sports",
  async () => {
    const [db, client] = await testDb();
    const stats = new SportsStatsConcept(db);
    try {
      // 1. Setup Basketball Sport and Lakers team
      const basketballSportResult = assertSuccess(
        await stats.addSport({
          sportName: SPORT_BASKETBALL_NAME,
          source: SOURCE_API_NBA,
          default: new Set([STAT_POINTS]),
        }),
        "add Basketball sport",
      );
      const basketballSportId = basketballSportResult.sport;
      const lakersTeamResult = assertSuccess(
        await stats.addTeam({ teamname: TEAM_LAKERS_NAME, sport: basketballSportId }),
        "add Lakers team",
      );
      const lakersTeamStatsId = lakersTeamResult.teamStats;
      assertSuccess(
        await stats._setStatValue({
          teamname: TEAM_LAKERS_NAME,
          sport: basketballSportId,
          statId: STAT_POINTS,
          value: 120,
        }),
        "set Lakers points",
      );

      // 2. Setup Baseball Sport and Phillies team (with a stat name that could overlap)
      const baseballSportResult = assertSuccess(
        await stats.addSport({
          sportName: SPORT_BASEBALL_NAME,
          source: SOURCE_API_MLB,
          default: new Set([STAT_RUNS]), // Use STAT_RUNS for runs in baseball
        }),
        "add Baseball sport",
      );
      const baseballSportId = baseballSportResult.sport;
      const philliesTeamResult = assertSuccess(
        await stats.addTeam({ teamname: TEAM_PHILLIES_NAME, sport: baseballSportId }),
        "add Phillies team",
      );
      const philliesTeamStatsId = philliesTeamResult.teamStats;
      assertSuccess(
        await stats._setStatValue({
          teamname: TEAM_PHILLIES_NAME,
          sport: baseballSportId,
          statId: STAT_RUNS,
          value: 8,
        }),
        "set Phillies runs",
      );

      // 3. Verify data isolation: Fetch Lakers stats, ensure no baseball stats are mixed in
      const lakersStats = assertSuccess(
        await stats.fetchTeamStats({
          teamname: TEAM_LAKERS_NAME,
          sport: basketballSportId,
        }),
        "fetch Lakers stats",
      );
      assertEquals(lakersStats.keyStatsData[STAT_POINTS], 120, "Lakers points should be correct");
      assertEquals(lakersStats.keyStatsData[STAT_RUNS], undefined, "Lakers should not have baseball runs stat");

      // 4. Verify data isolation: Fetch Phillies stats, ensure no basketball stats are mixed in
      const philliesStats = assertSuccess(
        await stats.fetchTeamStats({
          teamname: TEAM_PHILLIES_NAME,
          sport: baseballSportId,
        }),
        "fetch Phillies stats",
      );
      assertEquals(philliesStats.keyStatsData[STAT_RUNS], 8, "Phillies runs should be correct");
      assertEquals(philliesStats.keyStatsData[STAT_POINTS], undefined, "Phillies should not have basketball points stat");

      // Clean up
      await stats.removeTeam({ teamname: TEAM_LAKERS_NAME, sport: basketballSportId });
      await stats.removeTeam({ teamname: TEAM_PHILLIES_NAME, sport: baseballSportId });
      await stats.deleteSport({ sportName: SPORT_BASKETBALL_NAME });
      await stats.deleteSport({ sportName: SPORT_BASEBALL_NAME });
    } finally {
      await client.close();
    }
  },
);

Deno.test(
  "SportsStats 4: Robust Deletion with Precondition Enforcement and Cascade",
  async () => {
    const [db, client] = await testDb();
    const stats = new SportsStatsConcept(db);
    try {
      // Setup: Add sport, team, and some stats
      const addSportResult = assertSuccess(
        await stats.addSport({
          sportName: "Football",
          source: SOURCE_API_MLB,
          default: new Set([STAT_REBOUNDS]),
        }),
        "add Football sport",
      );
      const footballSportId = addSportResult.sport;
      const addTeamResult = assertSuccess(
        await stats.addTeam({ teamname: "Patriots", sport: footballSportId }),
        "add Patriots team",
      );
      const patriotsTeamStatsId = addTeamResult.teamStats;
      assertSuccess(
        await stats._setStatValue({
          teamname: "Patriots",
          sport: footballSportId,
          statId: STAT_REBOUNDS,
          value: 15,
        }),
        "set Patriots rebounds",
      );

      // Attempt to delete sport while team exists (should fail - precondition)
      const deleteSportAttempt1 = await stats.deleteSport({ sportName: "Football" });
      assertEquals(
        "error" in deleteSportAttempt1,
        true,
        "deleteSport should fail when teams are associated",
      );
      assertInstanceOf(deleteSportAttempt1, Object);
      assertEquals(
        deleteSportAttempt1.error,
        `Cannot delete sport 'Football' because it has 1 associated team(s).`,
      );

      // Remove the team first (enabling sport deletion)
      assertSuccess(
        await stats.removeTeam({ teamname: "Patriots", sport: footballSportId }),
        "removeTeam for Patriots",
      );

      // Verify team's stats are also gone due to cascade (implicitly tested by removeTeam effects)
      const fetchAfterTeamDelete = await stats.fetchTeamStats({ teamname: "Patriots", sport: footballSportId });
      assertEquals("error" in fetchAfterTeamDelete, true, "Fetching deleted team's stats should fail");

      // Now, delete the sport (should succeed)
      const deleteSportAttempt2 = assertSuccess(
        await stats.deleteSport({ sportName: "Football" }),
        "deleteSport for Football (after team removed)",
      );
      assertEquals(deleteSportAttempt2.sport, footballSportId, "Correct sport ID should be returned");

      // Verify the sport is truly gone
      const fetchSportAfterDelete = await stats.addSport({ // Try to re-add, should succeed if deleted
        sportName: "Football",
        source: SOURCE_API_MLB,
        default: new Set(),
      });
      assertEquals("error" in fetchSportAfterDelete, false, "Re-adding deleted sport should succeed.");
    } finally {
      await client.close();
    }
  },
);

Deno.test(
  "SportsStats 5: Comprehensive Error Handling for Non-Existent Entities and Duplicates",
  async () => {
    const [db, client] = await testDb();
    const stats = new SportsStatsConcept(db);
    try {
      // Test addTeam to a nonexistent sport
      const addTeamToNonExistentSport = await stats.addTeam({
        teamname: "NonexistentTeam",
        sport: "sport:bogus" as ID,
      });
      assertEquals("error" in addTeamToNonExistentSport, true);
      assertEquals(addTeamToNonExistentSport.error, "Sport with ID 'sport:bogus' does not exist. Please add the sport first.");

      // Add a legitimate sport and team for further tests
      const sportResult = assertSuccess(
        await stats.addSport({
          sportName: "Cricket",
          source: SOURCE_API_MLB,
          default: new Set([STAT_RUNS]),
        }),
        "add Cricket sport",
      );
      const cricketSportId = sportResult.sport;
      const teamResult = assertSuccess(
        await stats.addTeam({ teamname: "India", sport: cricketSportId }),
        "add India team",
      );
      const indiaTeamStatsId = teamResult.teamStats;

      // Test addTeam for a duplicate team in the same sport
      const addDuplicateTeam = await stats.addTeam({ teamname: "India", sport: cricketSportId });
      assertEquals("error" in addDuplicateTeam, true);
      assertEquals(addDuplicateTeam.error, `TeamStats for team 'India' in sport '${cricketSportId}' already exists.`);

      // Test removeTeam for a nonexistent team
      const removeNonExistentTeam = await stats.removeTeam({
        teamname: "NonexistentTeam",
        sport: cricketSportId,
      });
      assertEquals("error" in removeNonExistentTeam, true);
      assertEquals(removeNonExistentTeam.error, `TeamStats for team 'NonexistentTeam' in sport '${cricketSportId}' does not exist.`);

      // Test addKeyStat to a nonexistent sport
      const addKeyStatNonExistentSport = await stats.addKeyStat({
        sportName: "NonexistentSport",
        stat: STAT_ASSISTS,
      });
      assertEquals("error" in addKeyStatNonExistentSport, true);
      assertEquals(addKeyStatNonExistentSport.error, "Sport 'NonexistentSport' does not exist.");

      // Test addKeyStat for a duplicate stat
      const addDuplicateKeyStat = await stats.addKeyStat({ sportName: "Cricket", stat: STAT_RUNS });
      assertEquals("error" in addDuplicateKeyStat, true);
      assertEquals(addDuplicateKeyStat.error, `Stat '${STAT_RUNS}' is already a key stat for sport 'Cricket'.`);

      // Test removeKeyStat for a stat not in KeyStats
      const removeNonExistentKeyStat = await stats.removeKeyStat({
        sportName: "Cricket",
        stat: STAT_ASSISTS,
      });
      assertEquals("error" in removeNonExistentKeyStat, true);
      assertEquals(removeNonExistentKeyStat.error, `Stat '${STAT_ASSISTS}' is not a key stat for sport 'Cricket'.`);

      // Test fetchTeamStats for a team with no actual stat values (after setup, before _setStatValue)
      const fetchEmptyStats = assertSuccess(
        await stats.fetchTeamStats({ teamname: "India", sport: cricketSportId }),
        "fetch stats for team with no values yet",
      );
      assertEquals(Object.keys(fetchEmptyStats.keyStatsData).length, 0); // Key stat exists, but no value for it.

      // Clean up
      await stats.removeTeam({ teamname: "India", sport: cricketSportId });
      await stats.deleteSport({ sportName: "Cricket" });
    } finally {
      await client.close();
    }
  },
);
```

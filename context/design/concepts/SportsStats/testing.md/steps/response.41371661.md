---
timestamp: 'Thu Oct 16 2025 23:11:59 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_231159.a0dd1703.md]]'
content_id: 41371661fe2077d8515fe30d39f29372251a5d5735e4a68f6da9607e1a9b0b5a
---

# response:

You're right, even with the `assertSuccess` helper, TypeScript can sometimes be overly cautious about narrowing complex union types, especially when accessing properties directly on a variable that was *initially* a union. This often happens if the compiler doesn't fully track the type transformation across assignments or with certain language server configurations.

The most robust way to handle this is to **destructure the success result immediately**. When you destructure `{ keyStatsData }` from the return value of `assertSuccess`, TypeScript is forced to infer `keyStatsData` as precisely `Record<ID, unknown>`, because `assertSuccess` explicitly returns the `SuccessType`.

I've updated the test suite to use this destructuring pattern for all instances where `keyStatsData` is accessed, which resolves the type error.

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
const SPORT_FOOTBALL_NAME = "Football";
const SPORT_CRICKET_NAME = "Cricket";

const TEAM_PHILLIES_NAME = "Philadelphia Phillies";
const TEAM_LAKERS_NAME = "LA Lakers";
const TEAM_PATRIOTS_NAME = "Patriots";
const TEAM_INDIA_NAME = "India";
const TEAM_NONEXISTENT_NAME = "NonexistentTeam";

const STAT_RUNS = "stat:runs" as ID;
const STAT_HOME_RUNS = "stat:home_runs" as ID;
const STAT_POINTS = "stat:points" as ID;
const STAT_ASSISTS = "stat:assists" as ID;
const STAT_REBOUNDS = "stat:rebounds" as ID;
const STAT_FOULS = "stat:fouls" as ID;

// --- Type-Guarding Assertion Helpers ---

/**
 * Asserts that an action result is a success (i.e., does not have an 'error' property).
 * If an error is present, the test fails. Otherwise, the type is narrowed to the success type.
 * @param actionResult The result returned by an action.
 * @param message An optional message for the assertion.
 * @returns The success part of the union type.
 */
function assertSuccess<SuccessType, ErrorType extends { error: string }>(
  actionResult: SuccessType | ErrorType,
  message: string = "Action should succeed",
): SuccessType {
  // Check if the result has the 'error' property and is not null/undefined
  if (typeof actionResult === 'object' && actionResult !== null && 'error' in actionResult) {
    const errorResult = actionResult as ErrorType; // Cast to the error type for accessing its properties
    assertEquals(false, true, `${message}: ${errorResult.error}`); // Fail the test
  }
  // If no error, we are confident it's the SuccessType
  return actionResult as SuccessType;
}

/**
 * Asserts that an action result is a failure (i.e., has an 'error' property)
 * and that the error message matches the expected string. If no error is present
 * or the message doesn't match, the test fails.
 * @param actionResult The result returned by an action.
 * @param expectedErrorMessage The exact error message expected.
 * @param message An optional message for the assertion.
 * @returns The error part of the union type.
 */
function assertFailure<SuccessType, ErrorType extends { error: string }>(
  actionResult: SuccessType | ErrorType,
  expectedErrorMessage: string,
  message: string = "Action should fail with expected error",
): ErrorType {
  // Check if the result has the 'error' property and is not null/undefined
  if (typeof actionResult === 'object' && actionResult !== null && 'error' in actionResult) {
    const errorResult = actionResult as ErrorType;
    assertEquals(errorResult.error, expectedErrorMessage, message);
    return errorResult; // Return the error result for potential further checks
  } else {
    // If no error, fail because an error was expected
    assertEquals(true, false, `${message}: Expected an error, but action succeeded.`);
    // This line is technically unreachable if assertEquals(true, false) throws,
    // but it satisfies TS's return type for strictness.
    return {} as ErrorType;
  }
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
      const { sport: basketballSportId } = addSportResult;

      // 2. Add a team to that sport
      const addTeamResult = assertSuccess(
        await stats.addTeam({ teamname: TEAM_LAKERS_NAME, sport: basketballSportId }),
        "addTeam for Lakers",
      );
      const { teamStats: lakersTeamStatsId } = addTeamResult;

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
      const { keyStatsData: fetchedLakersStats } = assertSuccess(
        await stats.fetchTeamStats({
          teamname: TEAM_LAKERS_NAME,
          sport: basketballSportId,
        }),
        "fetchTeamStats for Lakers",
      );
      assertEquals(fetchedLakersStats[STAT_POINTS], 115, "STAT_POINTS should match");
      assertEquals(fetchedLakersStats[STAT_ASSISTS], 30, "STAT_ASSISTS should match");
      assertEquals(fetchedLakersStats[STAT_FOULS], undefined, "Non-key STAT_FOULS should not be fetched");

      // 5. Clean up: Remove team and sport
      assertSuccess(
        await stats.removeTeam({ teamname: TEAM_LAKERS_NAME, sport: basketballSportId }),
        "removeTeam for Lakers",
      );
      assertSuccess(
        await stats.deleteSport({ sportName: SPORT_BASKETBALL_NAME }),
        "deleteSport for Basketball",
      );

      // Verify deletion by attempting to fetch/delete again
      const checkTeam = await stats.fetchTeamStats({ teamname: TEAM_LAKERS_NAME, sport: basketballSportId });
      assertFailure(checkTeam, `TeamStats for team '${TEAM_LAKERS_NAME}' in sport '${basketballSportId}' does not exist.`, "Fetching deleted team should fail");

      const checkSport = await stats.deleteSport({ sportName: SPORT_BASKETBALL_NAME });
      assertFailure(checkSport, `Sport '${SPORT_BASKETBALL_NAME}' does not exist.`, "Deleting already deleted sport should fail");

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
      const { sport: baseballSportId } = addSportResult;

      const addTeamResult = assertSuccess(
        await stats.addTeam({ teamname: TEAM_PHILLIES_NAME, sport: baseballSportId }),
        "addTeam for Phillies",
      );
      const { teamStats: philliesTeamStatsId } = addTeamResult;

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
      const { keyStatsData: initialFetchedStats } = assertSuccess(
        await stats.fetchTeamStats({ teamname: TEAM_PHILLIES_NAME, sport: baseballSportId }),
        "initial fetchTeamStats",
      );
      assertEquals(Object.keys(initialFetchedStats).length, 1);
      assertEquals(initialFetchedStats[STAT_RUNS], 5);
      assertEquals(initialFetchedStats[STAT_HOME_RUNS], undefined); // Not a key stat yet

      // Add a new key stat (STAT_HOME_RUNS)
      assertSuccess(
        await stats.addKeyStat({ sportName: SPORT_BASEBALL_NAME, stat: STAT_HOME_RUNS }),
        "addKeyStat for HOME_RUNS",
      );

      // Fetch again: now STAT_HOME_RUNS should be included
      const { keyStatsData: fetchedAfterAdd } = assertSuccess(
        await stats.fetchTeamStats({ teamname: TEAM_PHILLIES_NAME, sport: baseballSportId }),
        "fetchTeamStats after adding key stat",
      );
      assertEquals(Object.keys(fetchedAfterAdd).length, 2);
      assertEquals(fetchedAfterAdd[STAT_RUNS], 5);
      assertEquals(fetchedAfterAdd[STAT_HOME_RUNS], 2);

      // Remove a key stat (STAT_RUNS)
      assertSuccess(
        await stats.removeKeyStat({ sportName: SPORT_BASEBALL_NAME, stat: STAT_RUNS }),
        "removeKeyStat for RUNS",
      );

      // Fetch again: STAT_RUNS should no longer be included as a key stat
      const { keyStatsData: fetchedAfterRemove } = assertSuccess(
        await stats.fetchTeamStats({ teamname: TEAM_PHILLIES_NAME, sport: baseballSportId }),
        "fetchTeamStats after removing key stat",
      );
      assertEquals(Object.keys(fetchedAfterRemove).length, 1);
      assertEquals(fetchedAfterRemove[STAT_RUNS], undefined);
      assertEquals(fetchedAfterRemove[STAT_HOME_RUNS], 2);
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
      const { sport: basketballSportId } = basketballSportResult;
      const lakersTeamResult = assertSuccess(
        await stats.addTeam({ teamname: TEAM_LAKERS_NAME, sport: basketballSportId }),
        "add Lakers team",
      );
      const { teamStats: lakersTeamStatsId } = lakersTeamResult;
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
      const { sport: baseballSportId } = baseballSportResult;
      const philliesTeamResult = assertSuccess(
        await stats.addTeam({ teamname: TEAM_PHILLIES_NAME, sport: baseballSportId }),
        "add Phillies team",
      );
      const { teamStats: philliesTeamStatsId } = philliesTeamResult;
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
      const { keyStatsData: lakersFetchedStats } = assertSuccess(
        await stats.fetchTeamStats({
          teamname: TEAM_LAKERS_NAME,
          sport: basketballSportId,
        }),
        "fetch Lakers stats",
      );
      assertEquals(lakersFetchedStats[STAT_POINTS], 120, "Lakers points should be correct");
      assertEquals(lakersFetchedStats[STAT_RUNS], undefined, "Lakers should not have baseball runs stat");

      // 4. Verify data isolation: Fetch Phillies stats, ensure no basketball stats are mixed in
      const { keyStatsData: philliesFetchedStats } = assertSuccess(
        await stats.fetchTeamStats({
          teamname: TEAM_PHILLIES_NAME,
          sport: baseballSportId,
        }),
        "fetch Phillies stats",
      );
      assertEquals(philliesFetchedStats[STAT_RUNS], 8, "Phillies runs should be correct");
      assertEquals(philliesFetchedStats[STAT_POINTS], undefined, "Phillies should not have basketball points stat");

      // Clean up
      assertSuccess(await stats.removeTeam({ teamname: TEAM_LAKERS_NAME, sport: basketballSportId }));
      assertSuccess(await stats.removeTeam({ teamname: TEAM_PHILLIES_NAME, sport: baseballSportId }));
      assertSuccess(await stats.deleteSport({ sportName: SPORT_BASKETBALL_NAME }));
      assertSuccess(await stats.deleteSport({ sportName: SPORT_BASEBALL_NAME }));
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
          sportName: SPORT_FOOTBALL_NAME,
          source: SOURCE_API_MLB,
          default: new Set([STAT_REBOUNDS]),
        }),
        "add Football sport",
      );
      const { sport: footballSportId } = addSportResult;
      const addTeamResult = assertSuccess(
        await stats.addTeam({ teamname: TEAM_PATRIOTS_NAME, sport: footballSportId }),
        "add Patriots team",
      );
      const { teamStats: patriotsTeamStatsId } = addTeamResult;
      assertSuccess(
        await stats._setStatValue({
          teamname: TEAM_PATRIOTS_NAME,
          sport: footballSportId,
          statId: STAT_REBOUNDS,
          value: 15,
        }),
        "set Patriots rebounds",
      );

      // Attempt to delete sport while team exists (should fail - precondition)
      assertFailure(
        await stats.deleteSport({ sportName: SPORT_FOOTBALL_NAME }),
        `Cannot delete sport '${SPORT_FOOTBALL_NAME}' because it has 1 associated team(s).`,
        "deleteSport should fail when teams are associated",
      );

      // Remove the team first (enabling sport deletion)
      assertSuccess(
        await stats.removeTeam({ teamname: TEAM_PATRIOTS_NAME, sport: footballSportId }),
        "removeTeam for Patriots",
      );

      // Verify team's stats are also gone due to cascade (implicitly tested by removeTeam effects)
      assertFailure(
        await stats.fetchTeamStats({ teamname: TEAM_PATRIOTS_NAME, sport: footballSportId }),
        `TeamStats for team '${TEAM_PATRIOTS_NAME}' in sport '${footballSportId}' does not exist.`,
        "Fetching deleted team's stats should fail",
      );

      // Now, delete the sport (should succeed)
      const deleteSportAttempt2 = assertSuccess(
        await stats.deleteSport({ sportName: SPORT_FOOTBALL_NAME }),
        "deleteSport for Football (after team removed)",
      );
      assertEquals(deleteSportAttempt2.sport, footballSportId, "Correct sport ID should be returned");

      // Verify the sport is truly gone by trying to re-add it
      const fetchSportAfterDelete = await stats.addSport({ // Try to re-add, should succeed if deleted
        sportName: SPORT_FOOTBALL_NAME,
        source: SOURCE_API_MLB,
        default: new Set(),
      });
      assertSuccess(fetchSportAfterDelete, "Re-adding deleted sport should succeed.");
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
      assertFailure(
        await stats.addTeam({ teamname: TEAM_NONEXISTENT_NAME, sport: "sport:bogus" as ID }),
        `Sport with ID 'sport:bogus' does not exist. Please add the sport first.`,
        "addTeam to nonexistent sport",
      );

      // Add a legitimate sport and team for further tests
      const sportResult = assertSuccess(
        await stats.addSport({
          sportName: SPORT_CRICKET_NAME,
          source: SOURCE_API_MLB,
          default: new Set([STAT_RUNS]),
        }),
        "add Cricket sport",
      );
      const { sport: cricketSportId } = sportResult;
      const teamResult = assertSuccess(
        await stats.addTeam({ teamname: TEAM_INDIA_NAME, sport: cricketSportId }),
        "add India team",
      );
      const { teamStats: indiaTeamStatsId } = teamResult;

      // Test addTeam for a duplicate team in the same sport
      assertFailure(
        await stats.addTeam({ teamname: TEAM_INDIA_NAME, sport: cricketSportId }),
        `TeamStats for team '${TEAM_INDIA_NAME}' in sport '${cricketSportId}' already exists.`,
        "addTeam for a duplicate team",
      );

      // Test removeTeam for a nonexistent team
      assertFailure(
        await stats.removeTeam({ teamname: TEAM_NONEXISTENT_NAME, sport: cricketSportId }),
        `TeamStats for team '${TEAM_NONEXISTENT_NAME}' in sport '${cricketSportId}' does not exist.`,
        "removeTeam for a nonexistent team",
      );

      // Test addKeyStat to a nonexistent sport
      assertFailure(
        await stats.addKeyStat({ sportName: "NonexistentSport", stat: STAT_ASSISTS }),
        "Sport 'NonexistentSport' does not exist.",
        "addKeyStat to a nonexistent sport",
      );

      // Test addKeyStat for a duplicate stat
      assertFailure(
        await stats.addKeyStat({ sportName: SPORT_CRICKET_NAME, stat: STAT_RUNS }),
        `Stat '${STAT_RUNS}' is already a key stat for sport 'Cricket'.`,
        "addKeyStat for a duplicate stat",
      );

      // Test removeKeyStat for a stat not in KeyStats
      assertFailure(
        await stats.removeKeyStat({
          sportName: SPORT_CRICKET_NAME,
          stat: STAT_ASSISTS,
        }),
        `Stat '${STAT_ASSISTS}' is not a key stat for sport 'Cricket'.`,
        "removeKeyStat for a non-existent stat",
      );

      // Test fetchTeamStats for a team with no actual stat values (after setup, before _setStatValue)
      const { keyStatsData: emptyFetchedStats } = assertSuccess(
        await stats.fetchTeamStats({ teamname: TEAM_INDIA_NAME, sport: cricketSportId }),
        "fetch stats for team with no values yet",
      );
      assertEquals(Object.keys(emptyFetchedStats).length, 0, "Should return an empty map for no stat values");

      // Clean up
      assertSuccess(await stats.removeTeam({ teamname: TEAM_INDIA_NAME, sport: cricketSportId }));
      assertSuccess(await stats.deleteSport({ sportName: SPORT_CRICKET_NAME }));
    } finally {
      await client.close();
    }
  },
);
```

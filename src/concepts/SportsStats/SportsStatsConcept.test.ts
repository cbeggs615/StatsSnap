import { assertEquals } from "jsr:@std/assert";
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

// --- Assertion Helpers ---

function assertSuccess<T extends Record<string, unknown>>(
  result: T | { error: string },
  message = "Action should succeed",
): asserts result is T {
  if (
    typeof result === "object" &&
    result !== null &&
    "error" in result
  ) {
    throw new Error(`${message}: ${(result as { error: string }).error}`);
  }
}

function assertFailure(
  result: unknown,
  expectedError: string,
  message = "Action should fail",
): asserts result is { error: string } {
  if (
    typeof result !== "object" ||
    result === null ||
    !("error" in result)
  ) {
    throw new Error(`${message}: expected failure but succeeded`);
  }
  const e = result as { error: string };
  if (e.error !== expectedError) {
    throw new Error(`${message}: expected '${expectedError}', got '${e.error}'`);
  }
}


Deno.test(
  "Principle: SportsStats – Sport defines default stats; teams inherit and track values independently",
  async () => {
    const [db, client] = await testDb();
    const stats = new SportsStatsConcept(db);
    try {
      // 1. Create a sport with defaults
      const addSport = await stats.addSport({
        sportName: SPORT_BASKETBALL_NAME,
        source: SOURCE_API_NBA,
        default: new Set([STAT_POINTS, STAT_ASSISTS]),
      });
      assertSuccess(addSport, "addSport should succeed");
      const sportId = addSport.sport;

      // 2. Add two teams under that sport
      const addLakers = await stats.addTeam({
        teamname: TEAM_LAKERS_NAME,
        sport: sportId,
      });
      const addCeltics = await stats.addTeam({
        teamname: "Boston Celtics",
        sport: sportId,
      });
      assertSuccess(addLakers);
      assertSuccess(addCeltics);

      // 3. Assign stat values independently to each team
      await stats._setStatValue({
        teamname: TEAM_LAKERS_NAME,
        sport: sportId,
        statId: STAT_POINTS,
        value: 115,
      });
      await stats._setStatValue({
        teamname: "Boston Celtics",
        sport: sportId,
        statId: STAT_POINTS,
        value: 110,
      });
      await stats._setStatValue({
        teamname: TEAM_LAKERS_NAME,
        sport: sportId,
        statId: STAT_ASSISTS,
        value: 30,
      });
      await stats._setStatValue({
        teamname: "Boston Celtics",
        sport: sportId,
        statId: STAT_ASSISTS,
        value: 25,
      });

      // 4. Fetch stats for each team – defaultKeyStats should apply automatically
      const lakersStats = await stats.fetchTeamStats({
        teamname: TEAM_LAKERS_NAME,
        sport: sportId,
      });
      const celticsStats = await stats.fetchTeamStats({
        teamname: "Boston Celtics",
        sport: sportId,
      });
      assertSuccess(lakersStats);
      assertSuccess(celticsStats);

      // 5. Verify inheritance of defaultKeyStats and independence of values
      assertEquals(
        Object.keys(lakersStats.keyStatsData).sort(),
        [STAT_ASSISTS, STAT_POINTS].sort(),
        "Teams inherit default stat types from the sport",
      );
      assertEquals(
        lakersStats.keyStatsData[STAT_POINTS],
        115,
        "Lakers points correct",
      );
      assertEquals(
        celticsStats.keyStatsData[STAT_POINTS],
        110,
        "Celtics points correct",
      );
      assertEquals(
        lakersStats.keyStatsData[STAT_ASSISTS],
        30,
        "Lakers assists correct",
      );
      assertEquals(
        celticsStats.keyStatsData[STAT_ASSISTS],
        25,
        "Celtics assists correct",
      );

      // 6. Clean up
      assertSuccess(await stats.removeTeam({ teamname: TEAM_LAKERS_NAME, sport: sportId }));
      assertSuccess(await stats.removeTeam({ teamname: "Boston Celtics", sport: sportId }));
      assertSuccess(await stats.deleteSport({ sportName: SPORT_BASKETBALL_NAME }));
    } finally {
      await client.close();
    }
  },
);

// ---------------------------------------------------------------------------
// 1. Default stats usage and team stat fetching
// ---------------------------------------------------------------------------

Deno.test("SportsStats 1: Default stats are respected when fetching team stats", async () => {
  const [db, client] = await testDb();
  const stats = new SportsStatsConcept(db);
  try {
    // Add sport with default stats
    const addSport = await stats.addSport({
      sportName: SPORT_BASKETBALL_NAME,
      source: SOURCE_API_NBA,
      default: new Set([STAT_POINTS, STAT_ASSISTS]),
    });
    assertSuccess(addSport);
    const sportId = addSport.sport;

    // Add team
    const addTeam = await stats.addTeam({
      teamname: TEAM_LAKERS_NAME,
      sport: sportId,
    });
    assertSuccess(addTeam);

    // Inject data
    await stats._setStatValue({
      teamname: TEAM_LAKERS_NAME,
      sport: sportId,
      statId: STAT_POINTS,
      value: 120,
    });
    await stats._setStatValue({
      teamname: TEAM_LAKERS_NAME,
      sport: sportId,
      statId: STAT_ASSISTS,
      value: 25,
    });
    await stats._setStatValue({
      teamname: TEAM_LAKERS_NAME,
      sport: sportId,
      statId: STAT_FOULS,
      value: 8,
    }); // non-default stat

    // Fetch without specifying stats → should use defaultKeyStats
    const fetched = await stats.fetchTeamStats({
      teamname: TEAM_LAKERS_NAME,
      sport: sportId,
    });
    assertSuccess(fetched);
    assertEquals(fetched.keyStatsData[STAT_POINTS], 120);
    assertEquals(fetched.keyStatsData[STAT_ASSISTS], 25);
    assertEquals(
      fetched.keyStatsData[STAT_FOULS],
      undefined,
      "non-default stat should not appear",
    );

    // Fetch with explicit stat list → should override defaultKeyStats
    const fetchedCustom = await stats.fetchTeamStats({
      teamname: TEAM_LAKERS_NAME,
      sport: sportId,
      stats: [STAT_FOULS],
    });
    assertSuccess(fetchedCustom);
    assertEquals(
      Object.keys(fetchedCustom.keyStatsData).length,
      1,
      "only requested stat should appear",
    );
    assertEquals(fetchedCustom.keyStatsData[STAT_FOULS], 8);

    // Cleanup
    assertSuccess(await stats.removeTeam({ teamname: TEAM_LAKERS_NAME, sport: sportId }));
    assertSuccess(await stats.deleteSport({ sportName: SPORT_BASKETBALL_NAME }));
  } finally {
    await client.close();
  }
});

// ---------------------------------------------------------------------------
// 2. Isolation between sports
// ---------------------------------------------------------------------------

Deno.test("SportsStats 2: Data isolation between sports", async () => {
  const [db, client] = await testDb();
  const stats = new SportsStatsConcept(db);
  try {
    // Add sports
    const basketball = await stats.addSport({
      sportName: SPORT_BASKETBALL_NAME,
      source: SOURCE_API_NBA,
      default: new Set([STAT_POINTS]),
    });
    assertSuccess(basketball);
    const basketballId = basketball.sport;

    const baseball = await stats.addSport({
      sportName: SPORT_BASEBALL_NAME,
      source: SOURCE_API_MLB,
      default: new Set([STAT_RUNS]),
    });
    assertSuccess(baseball);
    const baseballId = baseball.sport;

    // Add teams
    assertSuccess(await stats.addTeam({ teamname: TEAM_LAKERS_NAME, sport: basketballId }));
    assertSuccess(await stats.addTeam({ teamname: TEAM_PHILLIES_NAME, sport: baseballId }));

    // Insert stats
    await stats._setStatValue({
      teamname: TEAM_LAKERS_NAME,
      sport: basketballId,
      statId: STAT_POINTS,
      value: 100,
    });
    await stats._setStatValue({
      teamname: TEAM_PHILLIES_NAME,
      sport: baseballId,
      statId: STAT_RUNS,
      value: 6,
    });

    // Fetch & verify isolation
    const lakers = await stats.fetchTeamStats({
      teamname: TEAM_LAKERS_NAME,
      sport: basketballId,
    });
    assertSuccess(lakers);
    assertEquals(lakers.keyStatsData[STAT_POINTS], 100);
    assertEquals(lakers.keyStatsData[STAT_RUNS], undefined);

    const phillies = await stats.fetchTeamStats({
      teamname: TEAM_PHILLIES_NAME,
      sport: baseballId,
    });
    assertSuccess(phillies);
    assertEquals(phillies.keyStatsData[STAT_RUNS], 6);
    assertEquals(phillies.keyStatsData[STAT_POINTS], undefined);

    // Cleanup
    await stats.removeTeam({ teamname: TEAM_LAKERS_NAME, sport: basketballId });
    await stats.removeTeam({ teamname: TEAM_PHILLIES_NAME, sport: baseballId });
    await stats.deleteSport({ sportName: SPORT_BASKETBALL_NAME });
    await stats.deleteSport({ sportName: SPORT_BASEBALL_NAME });
  } finally {
    await client.close();
  }
});

// ---------------------------------------------------------------------------
// 3. Deletion rules and cascading
// ---------------------------------------------------------------------------

Deno.test("SportsStats 3: Deletion cascades and respects preconditions", async () => {
  const [db, client] = await testDb();
  const stats = new SportsStatsConcept(db);
  try {
    const addSport = await stats.addSport({
      sportName: SPORT_FOOTBALL_NAME,
      source: SOURCE_API_MLB,
      default: new Set([STAT_REBOUNDS]),
    });
    assertSuccess(addSport);
    const sportId = addSport.sport;

    assertSuccess(await stats.addTeam({ teamname: TEAM_PATRIOTS_NAME, sport: sportId }));

    // Deleting sport with existing team should fail
    assertFailure(
      await stats.deleteSport({ sportName: SPORT_FOOTBALL_NAME }),
      `Cannot delete sport '${SPORT_FOOTBALL_NAME}' because it has 1 associated team(s).`,
    );

    // Remove team and then delete sport
    assertSuccess(await stats.removeTeam({ teamname: TEAM_PATRIOTS_NAME, sport: sportId }));
    const del = await stats.deleteSport({ sportName: SPORT_FOOTBALL_NAME });
    assertSuccess(del);
    assertEquals(del.sport, sportId);
  } finally {
    await client.close();
  }
});

// ---------------------------------------------------------------------------
// 4. Error handling and query coverage
// ---------------------------------------------------------------------------

Deno.test("SportsStats 4: Error handling and queries", async () => {
  const [db, client] = await testDb();
  const stats = new SportsStatsConcept(db);
  try {
    // Invalid sport
    assertFailure(
      await stats.addTeam({ teamname: TEAM_NONEXISTENT_NAME, sport: "sport:fake" as ID }),
      `Sport with ID 'sport:fake' does not exist. Please add the sport first.`,
    );

    // Add sport & team
    const addCricket = await stats.addSport({
      sportName: SPORT_CRICKET_NAME,
      source: SOURCE_API_MLB,
      default: new Set([STAT_RUNS]),
    });
    assertSuccess(addCricket);
    const cricketId = addCricket.sport;

    assertSuccess(await stats.addTeam({ teamname: TEAM_INDIA_NAME, sport: cricketId }));

    // Duplicate team
    assertFailure(
      await stats.addTeam({ teamname: TEAM_INDIA_NAME, sport: cricketId }),
      `TeamStats for team '${TEAM_INDIA_NAME}' in sport '${cricketId}' already exists.`,
    );

    // Remove nonexistent team
    assertFailure(
      await stats.removeTeam({
        teamname: TEAM_NONEXISTENT_NAME,
        sport: cricketId,
      }),
      `TeamStats for team '${TEAM_NONEXISTENT_NAME}' in sport '${cricketId}' does not exist.`,
    );

    // Fetch stats (none set yet)
    const fetch = await stats.fetchTeamStats({
      teamname: TEAM_INDIA_NAME,
      sport: cricketId,
    });
    assertSuccess(fetch);
    assertEquals(Object.keys(fetch.keyStatsData).length, 0);

    // Queries
    const sportsList = await stats._getSportsList();
    assertEquals(sportsList.length, 1);
    assertEquals(sportsList[0].name, SPORT_CRICKET_NAME);

    const teamList = await stats._getTeamsBySport({ sportId: cricketId });
    assertEquals(teamList.length, 1);
    assertEquals(teamList[0].name, TEAM_INDIA_NAME);

    // Cleanup
    await stats.removeTeam({ teamname: TEAM_INDIA_NAME, sport: cricketId });
    await stats.deleteSport({ sportName: SPORT_CRICKET_NAME });
  } finally {
    await client.close();
  }
});

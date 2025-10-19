---
timestamp: 'Thu Oct 16 2025 22:55:59 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_225559.522f1d10.md]]'
content_id: 3e5eb6f79f8a65d1a85e0e90f6be96b45064ff222d9ef7246bfbd98df329ce9f
---

# src: src/concepts/SportsStats/SportsStatsConcept.test.ts

```typescript
// file: src/SportsStats/SportsStatsConcept.test.ts

import { assertEquals, assertExists } from "jsr:@std/assert";

import { testDb } from "@utils/database.ts";

import { ID } from "@utils/types.ts";

import SportsStatsConcept from "./SportsStatsConcept.ts";

  

const sourceA = "source:API" as ID;

const sportA = "sport:Basketball" as ID; // logical placeholders, real IDs are generated

const teamA = "team:Lakers";

const teamB = "team:Celtics";

const statPoints = "stat:points" as ID;

const statAssists = "stat:assists" as ID;

const statRebounds = "stat:rebounds" as ID;

  

//

// ─────────────────────────────────────────────

// TEST GROUP 1: Add and Delete Sports

// ─────────────────────────────────────────────

//

Deno.test("Action: addSport successfully creates a new sport", async () => {

const [db, client] = await testDb();

const stats = new SportsStatsConcept(db);

try {

const res = await stats.addSport({

sportName: "Basketball",

source: sourceA,

default: new Set([statPoints, statAssists]),

});

assertEquals("error" in res, false, "Adding a new sport should succeed.");

const { sport } = res as { sport: ID };

assertExists(sport);

} finally {

await client.close();

}

});

  

Deno.test("Action: addSport fails when sport already exists", async () => {

const [db, client] = await testDb();

const stats = new SportsStatsConcept(db);

try {

await stats.addSport({

sportName: "Basketball",

source: sourceA,

default: new Set([statPoints]),

});

const duplicate = await stats.addSport({

sportName: "Basketball",

source: sourceA,

default: new Set([statAssists]),

});

assertEquals("error" in duplicate, true, "Adding duplicate sport should fail.");

} finally {

await client.close();

}

});

  

Deno.test("Action: deleteSport removes a sport with no teams", async () => {

const [db, client] = await testDb();

const stats = new SportsStatsConcept(db);

try {

const add = await stats.addSport({

sportName: "Soccer",

source: sourceA,

default: new Set([statPoints]),

});

const sportId = (add as { sport: ID }).sport;

  

const del = await stats.deleteSport({ sportName: "Soccer" });

assertEquals("error" in del, false, "Deleting unused sport should succeed.");

assertEquals((del as { sport: ID }).sport, sportId);

} finally {

await client.close();

}

});

  

Deno.test("Action: deleteSport fails when sport has associated teams", async () => {

const [db, client] = await testDb();

const stats = new SportsStatsConcept(db);

try {

const addSport = await stats.addSport({

sportName: "Hockey",

source: sourceA,

default: new Set([statAssists]),

});

const sportId = (addSport as { sport: ID }).sport;

  

await stats.addTeam({ teamname: teamA, sport: sportId });

  

const del = await stats.deleteSport({ sportName: "Hockey" });

assertEquals("error" in del, true, "Deleting sport with teams should fail.");

} finally {

await client.close();

}

});

  

//

// ─────────────────────────────────────────────

// TEST GROUP 2: Add and Remove Teams

// ─────────────────────────────────────────────

//

Deno.test("Action: addTeam creates team for an existing sport", async () => {

const [db, client] = await testDb();

const stats = new SportsStatsConcept(db);

try {

const sportAdd = await stats.addSport({

sportName: "Baseball",

source: sourceA,

default: new Set([statPoints]),

});

const sportId = (sportAdd as { sport: ID }).sport;

  

const add = await stats.addTeam({ teamname: teamA, sport: sportId });

assertEquals("error" in add, false, "Adding team should succeed.");

assertExists((add as { teamStats: ID }).teamStats);

} finally {

await client.close();

}

});

  

Deno.test("Action: addTeam fails if sport does not exist or team duplicates", async () => {

const [db, client] = await testDb();

const stats = new SportsStatsConcept(db);

try {

const res1 = await stats.addTeam({ teamname: teamA, sport: "sport:Fake" as ID });

assertEquals("error" in res1, true, "Adding to nonexistent sport should fail.");

  

const sportAdd = await stats.addSport({

sportName: "Cricket",

source: sourceA,

default: new Set([statAssists]),

});

const sportId = (sportAdd as { sport: ID }).sport;

  

await stats.addTeam({ teamname: teamA, sport: sportId });

const duplicate = await stats.addTeam({ teamname: teamA, sport: sportId });

assertEquals("error" in duplicate, true, "Adding duplicate team should fail.");

} finally {

await client.close();

}

});

  

Deno.test("Action: removeTeam deletes a team and its stat values", async () => {

const [db, client] = await testDb();

const stats = new SportsStatsConcept(db);

try {

const sportAdd = await stats.addSport({

sportName: "Football",

source: sourceA,

default: new Set([statPoints]),

});

const sportId = (sportAdd as { sport: ID }).sport;

  

const teamAdd = await stats.addTeam({ teamname: teamA, sport: sportId });

const teamId = (teamAdd as { teamStats: ID }).teamStats;

  

const remove = await stats.removeTeam({ teamname: teamA, sport: sportId });

assertEquals("error" in remove, false, "Removing team should succeed.");

assertEquals((remove as { teamStats: ID }).teamStats, teamId);

} finally {

await client.close();

}

});

  

//

// ─────────────────────────────────────────────

// TEST GROUP 3: Managing Key Stats

// ─────────────────────────────────────────────

//

Deno.test("Action: addKeyStat and removeKeyStat update sport key stats", async () => {

const [db, client] = await testDb();

const stats = new SportsStatsConcept(db);

try {

await stats.addSport({

sportName: "Tennis",

source: sourceA,

default: new Set([statPoints]),

});

  

const addKey = await stats.addKeyStat({ sportName: "Tennis", stat: statAssists });

assertEquals("error" in addKey, false, "Adding new key stat should succeed.");

  

const removeKey = await stats.removeKeyStat({ sportName: "Tennis", stat: statAssists });

assertEquals("error" in removeKey, false, "Removing existing key stat should succeed.");

} finally {

await client.close();

}

});

  

Deno.test("Action: addKeyStat fails for nonexistent or duplicate stat", async () => {

const [db, client] = await testDb();

const stats = new SportsStatsConcept(db);

try {

const failNonexistent = await stats.addKeyStat({

sportName: "Nonexistent",

stat: statPoints,

});

assertEquals("error" in failNonexistent, true, "Adding key stat to missing sport should fail.");

  

await stats.addSport({

sportName: "Golf",

source: sourceA,

default: new Set([statRebounds]),

});

const failDuplicate = await stats.addKeyStat({ sportName: "Golf", stat: statRebounds });

assertEquals("error" in failDuplicate, true, "Adding duplicate key stat should fail.");

} finally {

await client.close();

}

});

  

Deno.test("Action: removeKeyStat fails for nonexistent sport or missing stat", async () => {

const [db, client] = await testDb();

const stats = new SportsStatsConcept(db);

try {

const failNoSport = await stats.removeKeyStat({

sportName: "Fake",

stat: statPoints,

});

assertEquals("error" in failNoSport, true, "Removing key stat from nonexistent sport should fail.");

  

await stats.addSport({

sportName: "Volleyball",

source: sourceA,

default: new Set([statAssists]),

});

const failNoStat = await stats.removeKeyStat({

sportName: "Volleyball",

stat: statRebounds,

});

assertEquals("error" in failNoStat, true, "Removing missing stat should fail.");

} finally {

await client.close();

}

});

  

//

// ─────────────────────────────────────────────

// TEST GROUP 4: Fetch and Set Team Stats

// ─────────────────────────────────────────────

//

Deno.test("Action: fetchTeamStats returns correct key stat data", async () => {

const [db, client] = await testDb();

const stats = new SportsStatsConcept(db);

try {

// Setup: create sport and team

const sportAdd = await stats.addSport({

sportName: "Basketball",

source: sourceA,

default: new Set([statPoints, statAssists]),

});

const sportId = (sportAdd as { sport: ID }).sport;

  

await stats.addTeam({ teamname: teamA, sport: sportId });

  

// Inject stat values

await stats._setStatValue({

teamname: teamA,

sport: sportId,

statId: statPoints,

value: 110,

});

await stats._setStatValue({

teamname: teamA,

sport: sportId,

statId: statAssists,

value: 25,

});

  

// Fetch stats

const result = await stats.fetchTeamStats({ teamname: teamA, sport: sportId });

assertEquals("error" in result, false, "Fetching team stats should succeed.");

if (!("error" in result)) {

const data = result.keyStatsData;

assertEquals(data[statPoints], 110);

assertEquals(data[statAssists], 25);

}

} finally {

await client.close();

}

});

  

Deno.test("Action: fetchTeamStats fails for nonexistent team or sport", async () => {

const [db, client] = await testDb();

const stats = new SportsStatsConcept(db);

try {

const sportAdd = await stats.addSport({

sportName: "Hockey",

source: sourceA,

default: new Set([statPoints]),

});

const sportId = (sportAdd as { sport: ID }).sport;

  

const res1 = await stats.fetchTeamStats({ teamname: teamA, sport: sportId });

assertEquals("error" in res1, true, "Fetching for nonexistent team should fail.");

  

// fetch after failed delete should succeed

await stats.addTeam({ teamname: teamA, sport: sportId });

const delAttempt = await stats.deleteSport({ sportName: "Hockey" });

assertEquals("error" in delAttempt, true, "Deleting sport with a team should fail.");

  

// Since deletion failed, sport and team should still exist

const res2 = await stats.fetchTeamStats({ teamname: teamA, sport: sportId });

assertEquals("error" in res2, false, "Fetching after failed deletion should still succeed.");

} finally {

await client.close();

}

});

  

Deno.test("System: _setStatValue creates and updates internal stat values", async () => {

const [db, client] = await testDb();

const stats = new SportsStatsConcept(db);

try {

const sportAdd = await stats.addSport({

sportName: "Rugby",

source: sourceA,

default: new Set([statPoints]),

});

const sportId = (sportAdd as { sport: ID }).sport;

await stats.addTeam({ teamname: teamA, sport: sportId });

  

// First insert

const set1 = await stats._setStatValue({

teamname: teamA,

sport: sportId,

statId: statPoints,

value: 50,

});

assertEquals("error" in set1, false, "Setting stat value should succeed.");

  

// Update existing stat

const set2 = await stats._setStatValue({

teamname: teamA,

sport: sportId,

statId: statPoints,

value: 75,

});

assertEquals("error" in set2, false, "Updating existing stat should succeed.");

  

const result = await stats.fetchTeamStats({ teamname: teamA, sport: sportId });

if (!("error" in result)) {

assertEquals(result.keyStatsData[statPoints], 75, "Value should be updated.");

}

} finally {

await client.close();

}

});
```

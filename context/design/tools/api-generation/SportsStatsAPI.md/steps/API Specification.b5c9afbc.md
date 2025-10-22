---
timestamp: 'Mon Oct 20 2025 13:20:59 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_132059.313f2fbd.md]]'
content_id: b5c9afbc905d08137dc110f6c830e3db530a2abf0d5a787ebb70046cd7b1ad6f
---

# API Specification: SportsStats Concept

**Purpose:** store team statistics in a structured way, where each sport defines which stats are tracked and which are considered key

***

## API Endpoints

### POST /api/SportsStats/addTeam

**Description:** Adds a new team with a specified name to a given sport, creating a new TeamStats entry.

**Requirements:**

* no TeamStats for this teamname with this sport already exists
* The sport must exist.

**Effects:**

* creates a new TeamStats for this teamname for sport, returning its ID.

**Request Body:**

```json
{
  "teamname": "string",
  "sport": "string"
}
```

**Success Response Body (Action):**

```json
{
  "teamStats": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/SportsStats/removeTeam

**Description:** Removes a team's statistics entry for a given sport, including all associated statistical values.

**Requirements:**

* TeamStats for this teamname with this sport exists

**Effects:**

* removes TeamStats for this teamname for sport
* removes all associated stat values for the removed TeamStats entry.

**Request Body:**

```json
{
  "teamname": "string",
  "sport": "string"
}
```

**Success Response Body (Action):**

```json
{
  "teamStats": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/SportsStats/addSport

**Description:** Adds a new sport, defining its associated data source and an initial set of key statistics.

**Requirements:**

* no Sport with this name exists

**Effects:**

* creates a new Sport with this source with KeyStats set as default
* returns the ID of the newly created sport.

**Request Body:**

```json
{
  "sportName": "string",
  "source": "string",
  "default": ["string"]
}
```

**Success Response Body (Action):**

```json
{
  "sport": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/SportsStats/deleteSport

**Description:** Deletes a sport definition from the concept's state.

**Requirements:**

* Sport with this name exists
* no teams associated with the sport exists

**Effects:**

* removes sportname from state
* removes any associated stat values for this sport (if they were stored with `sportId`).

**Request Body:**

```json
{
  "sportName": "string"
}
```

**Success Response Body (Action):**

```json
{
  "sport": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/SportsStats/addKeyStat

**Description:** Adds a specific statistic to a sport's list of key statistics.

**Requirements:**

* Sport with this name exists
* stat is not already in its KeyStats

**Effects:**

* adds stat to sportName's KeyStats

**Request Body:**

```json
{
  "sportName": "string",
  "stat": "string"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/SportsStats/removeKeyStat

**Description:** Removes a specific statistic from a sport's list of key statistics.

**Requirements:**

* Sport with this name exists
* stat is in its KeyStats

**Effects:**

* removes stat from sportName's KeyStats

**Request Body:**

```json
{
  "sportName": "string",
  "stat": "string"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/SportsStats/fetchTeamStats

**Description:** Fetches the current values for all key statistics for a specific team in a given sport.

**Requirements:**

* TeamStat for this teamname and sport exists

**Effects:**

* for each KeyStat in sport's KeyStats, fetches Data for this specific team from the concept's internal StatValues
* returns a map of Stat IDs to their corresponding Data values.

**Request Body:**

```json
{
  "teamname": "string",
  "sport": "string"
}
```

**Success Response Body (Action):**

```json
{
  "keyStatsData": {
    "statIdExample1": "any value (e.g., number, string, object)",
    "statIdExample2": "any value (e.g., number, string, object)"
  }
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/SportsStats/\_setStatValue

**Description:** (System Action) Either creates a new statistical value entry or updates an existing one for a specified team, sport, and stat. This action is intended for internal or system-level updates, typically triggered by syncs, and is not generally meant for direct client interaction.

**Requirements:**

* a TeamStats entry for the given teamname and sport must exist.

**Effects:**

* either creates a new StatValue entry or updates an existing one for the specified team, sport, and stat

**Request Body:**

```json
{
  "teamname": "string",
  "sport": "string",
  "statId": "string",
  "value": "any"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

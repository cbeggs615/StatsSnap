# API Specification: SportsStats Concept

**Purpose:** store team statistics in a structured way, where each sport defines which stats are tracked and which are considered key

---

## API Endpoints

### POST /api/SportsStats/addTeam

**Description:** Adds a new team with a specified name to a given sport, creating a new TeamStats entry.

**Requirements:**
- no TeamStats for this teamname with this sport already exists
- The sport must exist.

**Effects:**
- creates a new TeamStats for this teamname for sport, returning its ID.

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

---

### POST /api/SportsStats/removeTeam

**Description:** Removes a team's statistics entry for a given sport, including all associated statistical values.

**Requirements:**
- TeamStats for this teamname with this sport exists

**Effects:**
- removes TeamStats for this teamname for sport
- removes all associated stat values for the removed TeamStats entry.

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

---

### POST /api/SportsStats/addSport

**Description:** Adds a new sport, defining its associated data source and an initial set of key statistics.

**Requirements:**
- no Sport with this name exists

**Effects:**
- creates a new Sport with this source with KeyStats set as default
- returns the ID of the newly created sport.

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

---

### POST /api/SportsStats/deleteSport

**Description:** Deletes a sport definition from the concept's state.

**Requirements:**
- Sport with this name exists
- no teams associated with the sport exists

**Effects:**
- removes sportname from state
- removes any associated stat values for this sport (if they were stored with `sportId`).

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

---

### POST /api/SportsStats/addKeyStat

**Description:** Adds a specific statistic to a sport's list of key statistics.

**Requirements:**
- Sport with this name exists
- stat is not already in its KeyStats

**Effects:**
- adds stat to sportName's KeyStats

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

---

### POST /api/SportsStats/removeKeyStat

**Description:** Removes a specific statistic from a sport's list of key statistics.

**Requirements:**
- Sport with this name exists
- stat is in its KeyStats

**Effects:**
- removes stat from sportName's KeyStats

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

---

### POST /api/SportsStats/fetchTeamStats

**Description:** Fetches the current values for all key statistics for a specific team in a given sport.

**Requirements:**
- TeamStat for this teamname and sport exists

**Effects:**
- for each KeyStat in sport's KeyStats, fetches Data for this specific team from the concept's internal StatValues
- returns a map of Stat IDs to their corresponding Data values.

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

---

### POST /api/SportsStats/_setStatValue

**Description:** (System Action) Either creates a new statistical value entry or updates an existing one for a specified team, sport, and stat. This action is intended for internal or system-level updates, typically triggered by syncs, and is not generally meant for direct client interaction.

**Requirements:**
- a TeamStats entry for the given teamname and sport must exist.

**Effects:**
- either creates a new StatValue entry or updates an existing one for the specified team, sport, and stat

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

---

### POST /api/SportsStats/_getSportsList

**Description:** Retrieves a list of all sports, including their IDs and names.

**Request Body:**
```json
{}
```

**Effects:**
- Returns an array of sports objects, each containing `_id` and `name`.

**Success Response Body (Query):**
```json
[
  {
    "_id": "string",
    "name": "string"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/SportsStats/_getAllTeams

**Description:** Retrieves a list of all teams, including their IDs, names, and associated sport IDs.

**Request Body:**
```json
{}
```

**Effects:**
- Returns an array of team objects, each containing `_id`, `name`, and `sport`.

**Success Response Body (Query):**
```json
[
  {
    "_id": "string",
    "name": "string",
    "sport": "string"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/SportsStats/_getTeamsBySport

**Description:** Retrieves a list of all teams for a given sport ID.

**Request Body:**
```json
{
  "sport": "string"
}
```

**Effects:**
- Returns an array of team objects, each containing `_id` and `name`.

**Success Response Body (Query):**
```json
[
  {
    "_id": "string",
    "name": "string"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/SportsStats/fetchAvailableStatsForTeam

**Description:** Returns all stat IDs that have values for a given team in a specific sport.

**Request Body:**
```json
{
  "teamname": "string",
  "sport": "string"
}
```

**Success Response Body (Query):**
```json
{
  "stats": ["string"]
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

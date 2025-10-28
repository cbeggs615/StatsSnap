# API Specification: SportsStats Concept

**Purpose:**
store team statistics in a structured and extensible way, where each sport defines a set of *default stats* it typically tracks, and each team maintains its own independent values for those stats.

---

## API Endpoints

### POST /api/SportsStats/addTeam

**Description:**
Adds a new team with a specified name to a given sport, creating a new TeamStats entry.

**Requirements:**
- no TeamStats for this teamname with this sport already exists
- the specified sport must exist

**Effects:**
- creates a new TeamStats for this teamname and sport
- returns the ID of the newly created TeamStats entry

**Request Body:**
```
{
  "teamname": "string",
  "sport": "string"
}
```

**Success Response Body (Action):**
```
{
  "teamStats": "string"
}
```

**Error Response Body:**
```
{
  "error": "string"
}
```

---

### POST /api/SportsStats/removeTeam

**Description:**
Removes a team's statistics entry for a given sport, including all associated statistical values.

**Requirements:**
- TeamStats for this teamname with this sport exists

**Effects:**
- removes the TeamStats entry
- deletes all associated StatValues for that team

**Request Body:**
```
{
  "teamname": "string",
  "sport": "string"
}
```

**Success Response Body (Action):**
```
{
  "teamStats": "string"
}
```

**Error Response Body:**
```
{
  "error": "string"
}
```

---

### POST /api/SportsStats/addSport

**Description:**
Adds a new sport, defining its data source and a static set of default statistics.

**Requirements:**
- no Sport with this name already exists

**Effects:**
- creates a new Sport with the specified source
- records its default set of Stats as the sport’s baseline tracked metrics

**Request Body:**
```
{
  "sportName": "string",
  "source": "string",
  "defaults": ["string"]
}
```

**Success Response Body (Action):**
```
{
  "sport": "string"
}
```

**Error Response Body:**
```
{
  "error": "string"
}
```

---

### POST /api/SportsStats/deleteSport

**Description:**
Deletes a sport definition from the concept’s state.

**Requirements:**
- Sport with this name exists
- no teams are currently associated with this sport

**Effects:**
- removes the Sport
- removes all StatValues associated with that sport

**Request Body:**
```
{
  "sportName": "string"
}
```

**Success Response Body (Action):**
```
{
  "sport": "string"
}
```

**Error Response Body:**
```
{
  "error": "string"
}
```

---

### POST /api/SportsStats/fetchTeamStats

**Description:**
Fetches the current values for a team’s statistics in a given sport.
If a set of stat IDs is provided, returns only those.
Otherwise, returns values for the sport’s defaultKeyStats;
if the sport has no defaults, returns all existing StatValues for that team.

**Requirements:**
- TeamStats for this teamname and sport exists

**Effects:**
- retrieves data for either the requested stat IDs, the sport’s defaultKeyStats, or all available stats
- returns a map of Stat IDs to their Data values

**Request Body:**
```
{
  "teamname": "string",
  "sport": "string",
  "stats": ["string (optional)"]
}
```

**Success Response Body (Action):**
```
{
  "keyStatsData": {
    "statIdExample1": "any",
    "statIdExample2": "any"
  }
}
```

**Error Response Body:**
```
{
  "error": "string"
}
```

---

### POST /api/SportsStats/_setStatValue

**Description:**
(System Action) Creates or updates a StatValue entry for a specific team, sport, and stat.
Used internally or by sync processes that ingest data from external APIs.

**Requirements:**
- TeamStats for the given teamname and sport exists

**Effects:**
- creates or updates a StatValue entry for the given team, sport, and statId

**Request Body:**
```
{
  "teamname": "string",
  "sport": "string",
  "statId": "string",
  "value": "any"
}
```

**Success Response Body (Action):**
```
{}
```

**Error Response Body:**
```
{
  "error": "string"
}
```

---

### POST /api/SportsStats/_getSportsList

**Description:**
Retrieves a list of all sports, including their IDs, names, and optionally default stat definitions.

**Request Body:**
```
{}
```

**Effects:**
- returns an array of sports with `_id`, `name`, and `defaultKeyStats`

**Success Response Body (Query):**
```
[
  {
    "_id": "string",
    "name": "string",
    "defaultKeyStats": ["string"]
  }
]
```

**Error Response Body:**
```
{
  "error": "string"
}
```

---

### POST /api/SportsStats/_getAllTeams

**Description:**
Retrieves a list of all teams, including their IDs, names, and associated sport IDs.

**Request Body:**
```
{}
```

**Effects:**
- returns an array of all team documents

**Success Response Body (Query):**
```
[
  {
    "_id": "string",
    "name": "string",
    "sport": "string"
  }
]
```

**Error Response Body:**
```
{
  "error": "string"
}
```

---

### POST /api/SportsStats/_getTeamsBySport

**Description:**
Retrieves all teams for a specified sport.

**Request Body:**
```
{
  "sport": "string"
}
```

**Effects:**
- returns an array of teams (`_id`, `name`) for that sport

**Success Response Body (Query):**
```
[
  {
    "_id": "string",
    "name": "string"
  }
]
```

**Error Response Body:**
```
{
  "error": "string"
}
```

---

### POST /api/SportsStats/fetchAvailableStatsForTeam

**Description:**
Returns all stat IDs that currently have stored values for a given team in a specific sport.

**Request Body:**
```
{
  "teamname": "string",
  "sport": "string"
}
```

**Success Response Body (Query):**
```
{
  "stats": ["string"]
}
```

**Error Response Body:**
```
{
  "error": "string"
}
```

---
timestamp: 'Thu Nov 06 2025 13:29:29 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_132929.da8dae58.md]]'
content_id: 63471c29795841ebe79d19cabffa03df68bece5c5a622f76f96a68cfa689df6c
---

# concept: SportsStats

**concept** SportsStats\[Source, Stat, Data]

**purpose**
store team statistics in a structured way. Each sport defines a set of **default stats** it typically tracks, while teams maintain their own independent, up-to-date values for those stats.

**principle**
each sport provides a set of *default* stat types relevant to it; teams belonging to that sport inherit those defaults for fetching, while the actual stat values are maintained independently for each team. new or custom stats can be tracked dynamically without modifying the sport definition.

**state**

* a set of **TeamStats** with
  * a name String
  * a Sport

* a set of **Sports** with
  * a name String
  * a Source
  * a defaultStats set of Stats

* a set of **StatValues** with
  * a teamStatId TeamStats
  * a sportId Sport
  * a statId Stat
  * a value Data

* a **lastSyncTime** Time

**actions**

* **addTeam**(teamname: String, sport: Sport): (teamStats: TeamStat)
  * **requires** no TeamStats for this teamname with this sport already exists
  * **effects** creates a new TeamStats entry for this teamname and sport

* **removeTeam**(teamname: String, sport: Sport): (teamStats: TeamStat)
  * **requires** TeamStats for this teamname and sport exists
  * **effects** removes the TeamStats entry and all associated StatValues for that team

* **addSport**(sportName: String, source: Source, defaults: Set of Stats): (sport: Sport)
  * **requires** no Sport with this name already exists
  * **effects** creates a new Sport with the given source and records its default set of Stats to be used as the typical tracked metrics

* **deleteSport**(sportName: String): (sport: Sport)
  * **requires** Sport with this name exists and no teams are associated with it
  * **effects** removes the Sport and any StatValues associated with that sport

* **fetchTeamStats**(teamname: String, sport: Sport): (keyStatsData: Map\<Stat, Data>)
  * **requires** TeamStats for this teamname and sport exists
  * **effects**
    * returns data teamname for the Sport’s defaultStats

* **fetchTeamStats**(teamname: String, sport: Sport, stats: Set of Stats): (keyStatsData: Map\<Stat, Data>)
  * **requires** TeamStats for this teamname and sport exists, stats are stats in the StatValues for the TeamStats associated with teamname/sport
  * **effects**
    * if stats is provided, returns teamname's data for those specific Stats

* **system \_setStatValue**(teamname: String, sport: Sport, statId: Stat, value: Data)
  * **requires** a TeamStats entry for the given teamname and sport exists
  * **effects** creates or updates a StatValue entry for that team, sport, and statId

* **system syncAllSportsStats**():
  **requires** external APIs for each sport (NFL, NHL, MLB, NBA) are reachable and teams for each sport are in state
  **effects**
  * fetches and updates StatValues for all sports and teams from external APIs
  * updates `lastSyncTime` to the current system timestamp upon successful completion

* **system getLastSyncTime**(): (timestamp: Time)
  **effects** returns the last recorded synchronization time for the sports statistics database

* **system setLastSyncTime**(timestamp: Time): ()
  **requires** timestamp is a valid time
  **effects** updates or creates the `lastSyncTime` record with the provided timestamp

***

**notes**

* the concept defines the core relationships between Sports, Teams, and Stat Values.
* statistical data (`StatValues`) is managed internally but populated through external syncs (e.g., from an API identified by the Sport’s `source`).
* default Stats act as a baseline view for fetching, but the concept remains open to dynamic tracking of additional stats per team
* no actions mutate a Sport’s `defaultStats` after creation — defaults serve as static metadata for display and inheritance purposes.
* `syncAllSportsStats` is a system-level maintenance action called automatically at startup, on login, or on a daily schedule (decided by user of concept).
* The `lastSyncTime` field enables freshness checks to prevent redundant syncs (e.g., skip if data was updated within the last 24 hours).
* This design ensures all data updates occur through verified and consistent syncs, while read operations remain safe and isolated.

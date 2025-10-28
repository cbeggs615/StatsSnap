**concept** SportsStats[Source, Stat, Data]

**purpose**
store team statistics in a structured and extensible way, where each sport defines a set of *default stats* it typically tracks, and each team maintains its own independent values for those stats.

**principle**
each sport provides a set of *default* stat types relevant to it; teams belonging to that sport inherit those defaults for fetching, while the actual stat values are maintained independently for each team. new or custom stats can be tracked dynamically without modifying the sport definition.


**state**
- a set of **TeamStats** with
  - a name String
  - a Sport

- a set of **Sports** with
  - a name String
  - a Source
  - a defaultStats set of Stats

- a set of **StatValues** with
  - a teamStatId TeamStats
  - a sportId Sport
  - a statId Stat
  - a value Data


**actions**

- **addTeam**(teamname: String, sport: Sport): (teamStats: TeamStat)
  - **requires** no TeamStats for this teamname with this sport already exists
  - **effects** creates a new TeamStats entry for this teamname and sport

- **removeTeam**(teamname: String, sport: Sport): (teamStats: TeamStat)
  - **requires** TeamStats for this teamname and sport exists
  - **effects** removes the TeamStats entry and all associated StatValues for that team

- **addSport**(sportName: String, source: Source, defaults: Set of Stats): (sport: Sport)
  - **requires** no Sport with this name already exists
  - **effects** creates a new Sport with the given source and records its default set of Stats to be used as the typical tracked metrics

- **deleteSport**(sportName: String): (sport: Sport)
  - **requires** Sport with this name exists and no teams are associated with it
  - **effects** removes the Sport and any StatValues associated with that sport

- **fetchTeamStats**(teamname: String, sport: Sport): (keyStatsData: Map<Stat, Data>)
  - **requires** TeamStats for this teamname and sport exists
  - **effects**
    - returns data teamname for the Sport’s defaultStats

- **fetchTeamStats**(teamname: String, sport: Sport, stats: Set of Stats): (keyStatsData: Map<Stat, Data>)
  - **requires** TeamStats for this teamname and sport exists, stats are stats in the StatValues for the TeamStats associated with teamname/sport
  - **effects**
    - if stats is provided, returns teamname's data for those specific Stats

- **system _setStatValue**(teamname: String, sport: Sport, statId: Stat, value: Data)
  - **requires** a TeamStats entry for the given teamname and sport exists
  - **effects** creates or updates a StatValue entry for that team, sport, and statId

---

**notes**
- the concept defines the core relationships between Sports, Teams, and Stat Values.
- statistical data (`StatValues`) is managed internally but populated through external syncs (e.g., from an API identified by the Sport’s `source`).
- default Stats act as a baseline view for fetching, but the concept remains open to dynamic tracking of additional stats per team
- no actions mutate a Sport’s `defaultStats` after creation — defaults serve as static metadata for display and inheritance purposes.

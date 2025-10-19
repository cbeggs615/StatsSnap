---
timestamp: 'Sun Oct 19 2025 10:28:00 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_102800.f23d2e13.md]]'
content_id: f99539fcea1d51d8f360b6916835f726e32f59bb0fddc93ce293657f9e2a43af
---

# response:

That's a very insightful question, and it touches on a fundamental distinction in concept design: what belongs in the *specification* versus what is purely an *implementation detail*.

Based on the principles outlined in the concept design documentation, both `_setStatValue` (as a system action) and `StatValueDocument` (as part of the state) **should indeed be included in the concept's specification.**

Here's why:

### 1. Completeness of Functionality

The documentation emphasizes:

> "Another key distinction between concept design and traditional design is that concepts are *complete* with respect to their functionality and don't rely on functionality from other concepts."
> "...so long as the concept that remains is still coherent and fulfills all of its functionality without dependencies."

The `SportsStats` concept's purpose is to "store team statistics" and it has an action `fetchTeamStats` to retrieve these. If the concept doesn't explicitly define *how* these statistics are stored (its `StatValueDocument`) and *how* they are modified within its own boundaries (`_setStatValue`), then it's not truly "complete." `fetchTeamStats` would be retrieving data that, from the concept's own definition, never formally entered its state.

This would create an implicit dependency or an unexplained mechanism for data population, which goes against the idea of self-contained, independently understandable concepts.

### 2. Explicit State Definition

The documentation states:

> "The concept state is a data model that represents the set of possible states of the executing concept."

For `SportsStats` to fulfill its purpose of "storing team statistics," the actual statistical `Data` for each `Stat` of each `TeamStat` *must* be part of its defined state. Without `StatValueDocument` (or an equivalent representation), the concept's state would only define the *structure* of sports, teams, and key stats, but not the *values* themselves, making the "store" aspect of its purpose incomplete in the specification.

### 3. System Actions

The documentation explicitly supports `system` actions:

> "To mark an action as a system action, mark it with the `system` keyword..."

`_setStatValue` is not an action performed directly by a user. Instead, it's intended to be invoked by other system components (like `syncs` triggered by `MLBDataProvider` as discussed) to update the concept's internal state. This makes it a perfect candidate for a `system` action in the specification. While the underscore prefix `_` is an implementation convention for private/internal methods, the `system` keyword in the spec itself denotes its non-user-facing nature and role in state mutation.

### How the Spec Should Be Updated

To reflect this, the `SportsStats` concept specification should be updated as follows:

**concept** SportsStats\[Source, Stat, Data]\
**purpose** store team statistics in a structured way, where each sport defines which stats are tracked and which are considered key\
**principle** each sport defines a set of stats relevant to it (with some marked as key); teams belonging to that sport inherit those stat types and maintain their own current values\
**state**\
       a set of TeamStats with \
             a name String\
             a Sport\
       a set of Sports with \
             a name String\
             a Source\
             a KeyStats set of Stats\
       **a set of StatValues with** \
             **a teamStatId TeamStats** \
             **a sportId Sport** \
             **a statId Stat** \
             **a value Data**\
**actions**\
       addTeam (teamname: String, sport: Sport): (teamStats: TeamStat)\
             **requires** no TeamStats for this teamname with this sport already exists\
             **effects** creates a new TeamStats for this teamname for sport\
       removeTeam (teamname: String, sport: Sport): (teamStats: TeamStat)\
             **requires** TeamStats for this teamname with this sport exists\
             **effects** removes TeamStats for this teamname for sport and all associated StatValues\
       addSport (sportName: String, source: Source, default: Set of Stats): (sport: Sport)\
             **requires** no Sport with this name exists\
             **effects** creates a new Sport with this source with KeyStats set as default\
       deleteSport (sportName: String): (sport: Sport)\
             **requires** Sport with this name exists and no teams associated with the sport exists\
             **effects** removes sportname from state\
       addKeyStat (sportName: String, stat: Stat):\
             **requires** Sport with this name exists and stat is not already in its KeyStats\
             **effects** adds stat to sportName's KeyStats\
       removeKeyStat (sportName: String, stat: Stat):\
             **requires** Sport with this name exists and stat is in its KeyStats\
             **effects** removes stat from sportName's KeyStats\
       fetchTeamStats (teamname: String, sport: Sport): (keyStatsData: Map\<Stat, Data>)\
             **requires** TeamStat for this teamname and sport exists\
             **effects** for each KeyStat in sport's KeyStats, fetches Data for this specific team from the concept's internal StatValues\
       **system setStatValue (teamname: String, sport: Sport, statId: Stat, value: Data): Empty** \
             **requires** a TeamStats entry for the given teamname and sport must exist.\
             **effects** either creates a new StatValue entry or updates an existing one for the specified team, sport, and stat.

By including these elements, the concept's specification becomes fully transparent, independently understandable, and complete regarding its internal mechanics of storing and updating statistics, even if those updates are triggered externally by syncs.

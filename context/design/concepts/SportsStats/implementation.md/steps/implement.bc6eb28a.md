---
timestamp: 'Wed Oct 15 2025 13:49:00 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251015_134900.7a1ac21d.md]]'
content_id: bc6eb28ad40bd194c408cf8fcf78fa2e9797cadbbfcd9fc1aed6555aaac131c7
---

# implement: SportsStats

**concept** SportsStats\[Source, Stat, Data]\
**purpose** store team statistics in a structured way, where each sport defines which stats are tracked and which are considered key\
**principle** each sport defines a set of stats relevant to it (with some marked as key); teams belonging to that sport inherit those stat types and maintain their own current values\
**state**\
       a set of TeamStats with ...\
             a name String\
             a Sport\
       a set of Sports with ...\
             a name String\
             a Source\
             a KeyStats set of Stats\
**actions**\
       addTeam (teamname: String, sport: Sport): (teamStats: TeamStat)\
             **requires** no TeamStats for this teamname with this sport already exists\
             **effects** creates a new TeamStats for this teamname for sport\
       removeTeam (teamname: String, sport: Sport): (teamStats: TeamStat)\
             **requires** TeamStats for this teamname with this sport exists\
             **effects** removes TeamStats for this teamname for sport\
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
             **effects** for each KeyStat in sport's KeyStats, fetches Data for this specific team from Sport's Source

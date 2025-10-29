## Major Design & Backend Updates — StatSnap

### 1. `src/integrations/` Module
- **Purpose:** Introduced a dedicated folder for integrating and updating live stats from external APIs.  
- **Functionality:**  
  - Contains league-specific scripts for **MLB**, **NBA**, **NFL**, and **NHL**, which populate and refresh the database with up-to-date team and stat data.  
  - These integrations define which leagues, teams, and stats are available for users to select from in the app.  
- **Current Workflow:** Each league’s update script (e.g., `updateNFLStats.ts`, etc.) must be **run manually** to sync with the latest season data.  
- **Planned Improvement:** Automate these refreshes in full stack implementation to periodically update stats without manual execution.

---

### 2. Refactored `SportsStatsConcept`
- **State Changes:**  
  - Removed the `keyStats` field from the `Sport` state and replaced it with `defaultKeyStats`. 
  - This simplifies the model by separating a sport’s default tracked stats from user-specific fetch parameters.

- **Functional Changes:**  
  - `fetchTeamStats` now **optionally accepts a list of stats** to fetch for a given user/team/sport.  
  - If no list is provided, it defaults to the sport’s `defaultKeyStats`.  
  - This design ensures each fetch is **contextual and isolated**, preventing global side effects (e.g., one user’s edit unintentionally altering future fetch results for others).

- **Editing Behavior:**  
  - Removed the ability to edit a sport’s key stats after creation.  
  - Default stats are set at creation and **cannot be changed directly**.  
  - To modify defaults, the sport must be **deleted and re-added** with the updated stats.  
  - This ensures consistent and predictable fetch results across all users and sessions.
  
- **Spec changes**:
  - SportsStats spec changed to reflect above changes
  - Slight changes to purpose/principle to reflect changed concept

---

### 3. Additional Design Notes
- **Currently Omitting StreamedEvents Concept:**  
  Decided to keep StatSnap’s focus on **tracking key stats** for each team rather than also tracking upcoming games. While future updates could expand to include this functionality, the core stat-tracking feature already provides meaningful value to users.  
- **Project Naming:**  
  The project name was updated from **StatsSnap** to **StatSnap** for aesthetic purposes.



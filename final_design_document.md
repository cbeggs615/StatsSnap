 # Final Design Summary

 ## Concept Changes
### SportsStats Concept [Final Spec](context/design/concepts/SportsStats/SportsStats.md/20251106_132929.da8dae58.md)

- **Simplified Sport Model**
  - Removed the `keyStats` field from the `Sport` state and replaced it with `defaultKeyStats`.
    - This separation distinguishes *default tracked stats* for a sport from *user-specific fetch parameters*, simplifying the model and reducing coupling.

- **Contextual Data Fetching**
  - `fetchTeamStats` now optionally accepts a custom list of stats for a given user, team, or sport.
    - If no list is provided, it defaults to the sport’s `defaultKeyStats`.
    - This change makes fetches **contextual and isolated**, ensuring that one user’s edits cannot unintentionally alter the behavior of others.

- **Immutable Default Stats**
  - Removed the ability to edit a sport’s key stats after creation.
    - Default stats are set once at creation and cannot be modified directly.
    - To update defaults, the sport must be deleted and re-added with the new stats.
    - This guarantees consistent and predictable fetch results across users and sessions.

- **API Synchronization**
  - Added actions to sync the SportsStats database with data from external APIs for the **NFL, NHL, MLB, and NBA**.
    - These syncs are responsible for maintaining up-to-date stats without manual user edits.

- **Specification Updates**
  - Revised the SportsStats specification to reflect these structural and functional changes.
    - Updated the **Purpose** and **Principle** sections to emphasize stability, isolation, and data integrity in stat tracking.

### Item Tracking [Final Spec](context/design/concepts/ItemTracking/ItemTracking.md/20251106_130701.fee4d77c.md)
- **Specification Updates**
  - Made slight adjustments to ensure coherence and usability across syncs with other concepts.
  - Improved data consistency and inter-concept compatibility.
- **Lifecycle Maintenance**
  - Added a `deleteUserRecord` action to enable better lifecycle management and cleanup when users are deleted.

### PasswordAuth [Final Spec](context/design/concepts/PasswordAuth/PasswordAuth.md/20251106_132032.1f401dc0.md)
- **Specification Updates**
  - Made slight changes for coherence and smoother integration with concept syncs.
  - Improved alignment with updated session and item tracking flows.
- **State Maintenance**
  - From Assignment 2, added essential maintenance actions:
    - `changePassword`
    - `deleteAccount`
  - These actions support cleaner user lifecycle handling and secure state updates.

### StreamedEvents
- **Concept Decision**
  - Chose not to include the `StreamedEvents` concept in the final design.
  - May be revisited as a future enhancement, but the SportsStats concept currently provides sufficient value.

### Sessioning
- **Authorization and Sync Support**
  - Integrated the **Sessioning** concept from class to handle user sessions and authentication.
  - Enables seamless sync operations and ensures secure, session-based authorization across actions.



## Introduction of Backend Syncs and Requesting Concept

- **Centralized Sync Architecture**
  - Using **Requesting Concept** to handle all communication between the frontend and backend.
  - All queries to the SportsStats database are passthroughs, while all other actions are executed through controlled syncs.
    - This prevents direct API mutations and ensures updates only occur through validated syncs with external APIs for SportsStatsDB.

- **Session-Integrated User Management**
  - Any operation involving users now uses **sessions** to identify and authorize the active user.
  - Logging in and out automatically **creates and deletes sessions**, simplifying authentication and state consistency.
  - The **Register sync** now automatically creates corresponding `userRecord` in the ItemTracking concept, while `deleteAccount` removes it.

- **Expanded Sync Network**
  - Added complete sync coverage for the user lifecycle:
    - Registration and auto-login
    - Login and logout handling
    - Account deletion and password changes
    - Syncing SportsStats data post-login if outdated
    - Item addition, removal, and retrieval scoped to user sessions
  - Syncs now ensure **full lifecycle coherence** across the PasswordAuth, Sessioning, ItemTracking, and SportsStats concepts.

- **Evolution from Assignment 2**
  - The original Assignment 2 syncs (e.g., `createUser`, `followTeam`, `viewTeamStats`) were simplified and modularized into smaller, atomic syncs.
  - Removed user-side editing of key stats (`editKeyStatsAdd` / `editKeyStatsRemove`) to preserve consistency across sessions.
  - Replaced manual per-request stat fetching with background **SportsStats syncs** tied to login events for automatic updates.

## Design differences from Assignment 4b
  - **Optimized Dashboard Updates**
    - In Assignment 4b, any user action triggered a full dashboard reload, re-rendering all components regardless of scope.
    - In the final design, updates are **targeted and incremental**:
      - Adding a team dynamically inserts only that team’s tile.
      - Removing a team deletes only that specific element from the display.
      - When a sport’s stats are refreshed, only the tracked teams belonging to that sport are reloaded.
    - This selective update approach improves performance, reduces redundant data fetching, and provides a smoother, more responsive user experience.

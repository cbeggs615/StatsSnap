/**
 * The Requesting concept exposes passthrough routes by default,
 * which allow POSTs to the route:
 *
 * /{REQUESTING_BASE_URL}/{Concept name}/{action or query}
 *
 * to passthrough directly to the concept action or query.
 * This is a convenient and natural way to expose concepts to
 * the world, but should only be done intentionally for public
 * actions and queries.
 *
 * This file allows you to explicitly set inclusions and exclusions
 * for passthrough routes:
 * - inclusions: those that you can justify their inclusion
 * - exclusions: those to exclude, using Requesting routes instead
 */

/**
 * INCLUSIONS
 *
 * Each inclusion must include a justification for why you think
 * the passthrough is appropriate (e.g. public query).
 *
 * inclusions = {"route": "justification"}
 */

export const inclusions: Record<string, string> = {
  // Feel free to delete these example inclusions

  "/api/SportsStats/fetchTeamStats": "public can fetch stats for a team",
  "/api/SportsStats/_getSportsList": "public can get list of available sports in DB",
  "/api/SportsStats/_getAllTeams": "public can get list of available teams in DB",
  "/api/SportsStats/_getTeamsBySport": "public can get list of available teams for a given sport",
  "/api/SportsStats/fetchAvailableStatsForTeam": "public can read available stat types for a team",



};

/**
 * EXCLUSIONS
 *
 * Excluded routes fall back to the Requesting concept, and will
 * instead trigger the normal Requesting.request action. As this
 * is the intended behavior, no justification is necessary.
 *
 * exclusions = ["route"]
 */

export const exclusions: Array<string> = [
  "/api/SportsStats/syncAllSportsStats",
  "/api/SportsStats/getLastSyncTime",
  "/api/SportsStats/setLastSyncTime",

  // checking passwords/finding useres should be excluded
  "/api/PasswordAuth/_checkPassword",

  // changing passwords, registering, authenticate, deleteAccount
  // should be handled by syncs
  "/api/PasswordAuth/register",
  "/api/PasswordAuth/authenticate",
  "/api/PasswordAuth/changePassword",
  "/api/PasswordAuth/deleteAccount",

  "/api/PasswordAuth/_getUserByUsername",

  // sessioning should all be excluded
  "/api/Sessioning/create",
  "/api/Sessioning/delete",
  "/api/Sessioning/_getUser",

  "/api/ItemTracking/addUserRecord",
  "/api/ItemTracking/deleteUserRecord",

  // adding/removing item should be with syncs
  "/api/ItemTracking/addItem",
  "/api/ItemTracking/removeItem",

  "/api/ItemTracking/_getItemsTrackedByUser",

  "/api/ItemTracking/_getUsersTrackingItem",
  "/api/PasswordAuth/_getUsername",


  // modifications to Sports DB should only be done through system updates
  "/api/SportsStats/_setStatValue",
  "/api/SportsStats/deleteSport",
  "/api/SportsStats/addSport",
  "/api/SportsStats/removeTeam",
  "/api/SportsStats/addTeam",


];

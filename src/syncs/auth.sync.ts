import { actions, Sync } from "@engine";
import { Requesting, PasswordAuth, Sessioning, ItemTracking } from "@concepts";

//-- User Registration - Auto-Login upon success --//
export const RegisterRequest: Sync = ({ request, username, password }) => ({
  when: actions([
    Requesting.request,
    { path: "/PasswordAuth/register", username, password },
    { request },
  ]),
  then: actions([PasswordAuth.register, { username, password }]),
});

export const RegisterCreatesSession: Sync = ({ user }) => ({
  when: actions([PasswordAuth.register, {}, { user }]),
  then: actions([Sessioning.create, { user }]),
});

export const RegisterResponseSuccess: Sync = ({ request, user, session }) => ({
  when: actions(
    [Requesting.request, { path: "/PasswordAuth/register" }, { request }],
    [PasswordAuth.register, {}, { user }],
    [Sessioning.create, { user }, { session }],
  ),
  then: actions([Requesting.respond, { request, user, session }]),
});

export const RegisterResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/PasswordAuth/register" }, { request }],
    [PasswordAuth.register, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});


//-- Item Tracking: Automatically create user record after registration --//
export const AddUserRecordAfterRegister: Sync = ({ user }) => ({
  when: actions([PasswordAuth.register, {}, { user }]),
  then: actions([ItemTracking.addUserRecord, { user }]),
});


//-- User Login & Session Creation --//
export const LoginRequest: Sync = ({ request, username, password }) => ({
  when: actions([Requesting.request, { path: "/PasswordAuth/authenticate", username, password }, { request }]),
  then: actions([PasswordAuth.authenticate, { username, password }]),
});

export const LoginSuccessCreatesSession: Sync = ({ user }) => ({
  when: actions([PasswordAuth.authenticate, {}, { user }]),
  then: actions([Sessioning.create, { user }]),
});

export const LoginResponseSuccess: Sync = ({ request, user, session }) => ({
  when: actions(
    [Requesting.request, { path: "/PasswordAuth/authenticate" }, { request }],
    [PasswordAuth.authenticate, {}, { user }],
    [Sessioning.create, { user }, { session }],
  ),
  then: actions([Requesting.respond, { request, session }]),
});

export const LoginResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/PasswordAuth/authenticate" }, { request }],
    [PasswordAuth.authenticate, {}, { error }]
  ),
  then: actions([Requesting.respond, { request, error }]),
});

//-- User Logout --//
export const LogoutRequest: Sync = ({ request, session, user }) => ({
  when: actions([Requesting.request, { path: "/logout", session }, { request }]),
  where: (frames) => frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([Sessioning.delete, { session }]),
});

export const LogoutResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/logout" }, { request }],
    [Sessioning.delete, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "logged_out" }]),
});

import { getDb } from "@utils/database.ts";
import SportsStatsConcept from "@concepts/SportsStats/SportsStatsConcept.ts";

export const SyncSportsStatsAfterLogin: Sync = ({ user, session}) => ({
  when: actions(
    [PasswordAuth.authenticate, {}, { user }],
    [Sessioning.create, { user }, { session }]
  ),
  where: async (frames) => {
    const [db] = await getDb();
    const stats = new SportsStatsConcept(db);

    const lastSync = await stats.getLastSyncTime(db);
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;

    if (!lastSync || now - lastSync > ONE_DAY) {
      console.log("🕓 syncing stats after login...");
      stats
        .syncAllSportsStats()
        .then(() => stats.setLastSyncTime(db, now))
        .catch((err: unknown) => console.error("❌ sync failed:", err));
    } else {
      console.log("✅ stats already up to date");
    }

    return frames;
  },
  then: actions([Requesting.respond, { message: "Sync complete" }]),
});


// delete account


export const DeleteAccountRequest: Sync = ({ request, session, username, password, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/PasswordAuth/deleteAccount", session, password },
    { request },
  ]),
  // use the session to get user → then get username
  where: async (frames) => {
    const userFrames = await frames.query(Sessioning._getUser, { session }, { user });
    const usernameFrames = await userFrames.query(PasswordAuth._getUsername, { user }, { username });
    return usernameFrames;
  },
  then: actions([PasswordAuth.deleteAccount, { username, password }]),
});

export const DeleteUserRecordAfterAccountDeletion: Sync = ({ user }) => ({
  when: actions([PasswordAuth.deleteAccount, {}, { success: true, user}]),
  then: actions([ItemTracking.deleteUserRecord, { user }]),
});

export const DeleteAccountResponseSuccess: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/PasswordAuth/deleteAccount" }, { request }],
    [PasswordAuth.deleteAccount, {}, { success: true }]
  ),
  then: actions([Requesting.respond, { request, success: true }]),
});

export const DeleteAccountResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/PasswordAuth/deleteAccount" }, { request }],
    [PasswordAuth.deleteAccount, {}, { error }]
  ),
  then: actions([Requesting.respond, { request, error }]),
});


//-- Change Password --//
export const ChangePasswordRequest: Sync = ({ request, username, currentPass, newPass }) => ({
  when: actions([
    Requesting.request,
    { path: "/PasswordAuth/changePassword", username, currentPass, newPass },
    { request },
  ]),
  then: actions([
    PasswordAuth.changePassword,
    { username, currentPass, newPass },
  ]),
});

export const ChangePasswordResponseSuccess: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/PasswordAuth/changePassword" }, { request }],
    [PasswordAuth.changePassword, {}, { success: true }],
  ),
  then: actions([Requesting.respond, { request, success: true }]),
});

export const ChangePasswordResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/PasswordAuth/changePassword" }, { request }],
    [PasswordAuth.changePassword, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

import { actions, Sync } from "@engine";
import { Requesting, PasswordAuth, Sessioning } from "@concepts";

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


// -- Delete Account -- //
export const DeleteAccountRequest: Sync = ({ request, username, password }) => ({
  when: actions([
    Requesting.request,
    { path: "/PasswordAuth/deleteAccount", username, password },
    { request },
  ]),
  then: actions([PasswordAuth.deleteAccount, { username, password }]),
});

export const DeleteAccountResponseSuccess: Sync = ({ request, success }) => ({
  when: actions(
    [Requesting.request, { path: "/PasswordAuth/deleteAccount" }, { request }],
    [PasswordAuth.deleteAccount, {}, { success }],
  ),
  then: actions([Requesting.respond, { request, success }]),
});

export const DeleteAccountResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/PasswordAuth/deleteAccount" }, { request }],
    [PasswordAuth.deleteAccount, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

---
timestamp: 'Thu Nov 06 2025 13:20:32 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_132032.1f401dc0.md]]'
content_id: 32739095c4f62953e12fed65707dbcd0f6f37f22c8904398fdf321afffa5da34
---

# concept: PasswordAuth

**concept** PasswordAuth

**purpose** enables users to securely identify themselves and manage their access through username and password credentials.

**principle** If a user registers with a unique username and password, then they can later provide those same credentials to be authenticated as that user, thereby gaining access to associated functionality.

**state**
a set of Users with
a username String
a password String

**actions**

register (username: String, password: String): (user: User)
**requires** no User currently exists with the given `username`.
**effects** A new User is created, associated with the provided `username` and `password`. The identifier of this new `User` is returned.

authenticate (username: String, password: String): (user: User)
**requires** A User exists whose `username` matches the input `username` and whose `password` matches the input `password`
**effect** returns user associated with username

deleteAccount (username: String, password: String):
**requires** A User exists whose `username` matches the input `username` and whose `password` matches the input `password`.
**effects** The User associated with the given `username` is deleted, along with their `username` and `password` association.

changePassword (username: String, currentPass: String, newPass: String):
**requires** A User exists whose `username` matches the input `username` and whose `password` matches the `currentPass`.
**effects** The `password` of the User associated with the given `username` is updated to \`newPass.

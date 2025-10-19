---
timestamp: 'Thu Oct 16 2025 21:29:39 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_212939.27e6c16b.md]]'
content_id: b751953218cbeaf59ff1d928538c815aa0480fe30edcab87a173cd465d657364
---

# response:

You are absolutely right to ask about hashing! Storing passwords in plain text, as in the initial implementation, is a major security vulnerability. Passwords should always be hashed and salted before storage.

Here's how you would modify the `PasswordAuthConcept` to incorporate `bcrypt` hashing, a widely recommended method for secure password storage.

First, you'll need a `bcrypt` library for Deno. A common one is `https://deno.land/x/bcrypt@v0.4.1/mod.ts`.

```typescript
// file: src/PasswordAuth/PasswordAuthConcept.ts

import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";
// Import the bcrypt hashing functions for Deno
import { hash, compare } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

// Declare collection prefix, use concept name
const PREFIX = "PasswordAuth" + ".";

// Generic type of this concept - User is an ID
type User = ID;

// Define the number of salt rounds for bcrypt.
// Higher numbers are more secure but slower. 10-12 is a common balance.
const SALT_ROUNDS = 10;

/**
 * State declaration for the PasswordAuth concept:
 *
 * a set of Users with
 *   a username String
 *   a password String (now stored as a hash)
 */
interface PasswordAuthUser {
  _id: User; // The ID of the user in this concept, treated as an opaque identifier
  username: string;
  passwordHash: string; // Changed from 'password' to 'passwordHash' to reflect secure storage
}

/**
 * PasswordAuth Concept
 *
 * purpose: enables users to securely identify themselves and manage their access through username and password credentials.
 *
 * principle: If a user registers with a unique username and password, then they can later provide those same credentials
 *            to be authenticated as that user, thereby gaining access to associated functionality.
 */
export default class PasswordAuthConcept {
  // MongoDB Collection to store user credentials for this concept
  private users: Collection<PasswordAuthUser>;

  constructor(private readonly db: Db) {
    this.users = this.db.collection(PREFIX + "users");
  }

  /**
   * register (username: String, password: String): (user: User) | (error: String)
   *
   * requires: no User currently exists with the given `username`.
   * effects: A new User is created, associated with the provided `username` and a HASHED `password`.
   *          The identifier of this new `User` is returned.
   */
  async register({
    username,
    password,
  }: {
    username: string;
    password: string;
  }): Promise<{ user: User } | { error: string }> {
    // Precondition check: no User currently exists with the given username.
    const existingUser = await this.users.findOne({ username });
    if (existingUser) {
      return { error: "Username already exists." };
    }

    // Effect: Hash the password before storing it.
    const hashedPassword = await hash(password, SALT_ROUNDS);

    // Effect: A new User is created.
    const newUser: PasswordAuthUser = {
      _id: freshID() as User, // Generate a fresh, unique ID for the new user
      username,
      passwordHash: hashedPassword, // Store the hash, not the plain text password
    };
    await this.users.insertOne(newUser);

    // Effect: The identifier of this new User is returned.
    return { user: newUser._id };
  }

  /**
   * authenticate (username: String, password: String): { success: boolean } | (error: String)
   *
   * requires: A User exists whose `username` matches the input `username`
   *           and whose provided `password` matches the stored HASH.
   * effects: Authenticates the user if credentials match. Returns { success: true } on successful authentication.
   */
  async authenticate({
    username,
    password,
  }: {
    username: string;
    password: string;
  }): Promise<{ success: boolean } | { error: string }> {
    // Precondition check: Find user by username first.
    const user = await this.users.findOne({ username });
    if (!user) {
      // Return a generic error message to prevent username enumeration attacks.
      return { error: "Invalid username or password." };
    }

    // Compare the provided password with the stored hash.
    const isPasswordValid = await compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return { error: "Invalid username or password." };
    }

    // Effect: User is authenticated. Return a non-empty dictionary for success.
    return { success: true };
  }

  /**
   * deleteAccount (username: String, password: String): { success: boolean } | (error: String)
   *
   * requires: A User exists whose `username` matches the input `username`
   *           and whose provided `password` matches the stored HASH.
   * effects: The User associated with the given `username` is deleted,
   *          along with their `username` and `password` association. Returns { success: true } on successful deletion.
   */
  async deleteAccount({
    username,
    password,
  }: {
    username: string;
    password: string;
  }): Promise<{ success: boolean } | { error: string }> {
    // Precondition check: Find user by username first.
    const user = await this.users.findOne({ username });
    if (!user) {
      return { error: "Invalid username or password." };
    }

    // Compare the provided password with the stored hash.
    const isPasswordValid = await compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return { error: "Invalid username or password." };
    }

    // Effect: The User associated with the given username is deleted.
    await this.users.deleteOne({ _id: user._id });

    // Return a non-empty dictionary for success.
    return { success: true };
  }

  /**
   * changePassword (username: String, currentPass: String, newPass: String): { success: boolean } | (error: String)
   *
   * requires: A User exists whose `username` matches the input `username`
   *           and whose `currentPass` matches the stored HASH.
   * effects: The `password` of the User associated with the given `username` is updated to a HASHED `newPass`.
   *          Returns { success: true } on successful password change.
   */
  async changePassword({
    username,
    currentPass,
    newPass,
  }: {
    username: string;
    currentPass: string;
    newPass: string;
  }): Promise<{ success: boolean } | { error: string }> {
    // Precondition check: Find user by username first.
    const user = await this.users.findOne({ username });
    if (!user) {
      // Generic error for security
      return { error: "Invalid username or current password." };
    }

    // Compare the provided current password with the stored hash.
    const isCurrentPasswordValid = await compare(currentPass, user.passwordHash);
    if (!isCurrentPasswordValid) {
      return { error: "Invalid username or current password." };
    }

    // Hash the new password before storing it.
    const newHashedPassword = await hash(newPass, SALT_ROUNDS);

    // Effect: The password of the User is updated to newHashedPassword.
    await this.users.updateOne(
      { _id: user._id },
      { $set: { passwordHash: newHashedPassword } }, // Update the hashed password field
    );

    // Return a non-empty dictionary for success.
    return { success: true };
  }

  // --- Queries (non-mutating observations of the concept's state) ---

  /**
   * _getUserByUsername (username: String): { user: User } | Empty
   *
   * effects: Returns the User ID associated with a given username, if found.
   *          Returns an empty dictionary if no user is found with that username.
   */
  async _getUserByUsername(
    { username }: { username: string },
  ): Promise<{ user: User } | Empty> {
    const user = await this.users.findOne({ username });
    if (user) {
      return { user: user._id };
    }
    return {};
  }

  /**
   * _checkPassword (username: String, password: String): { success: boolean } | { error: String }
   *
   * effects: Checks if the provided username and password are correct by comparing
   *          the password against the stored hash.
   *          Returns { success: true } if credentials match, or { error: String } otherwise.
   */
  async _checkPassword(
    { username, password }: { username: string; password: string },
  ): Promise<{ success: boolean } | { error: string }> {
    const user = await this.users.findOne({ username });
    if (!user) {
      return { error: "Invalid username or password." };
    }

    const isPasswordValid = await compare(password, user.passwordHash);
    if (isPasswordValid) {
      return { success: true };
    }
    return { error: "Invalid username or password." };
  }
}
```

### Key Changes Made:

1. **Bcrypt Import:** Added `import { hash, compare } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";`.
2. **`SALT_ROUNDS` Constant:** Introduced `const SALT_ROUNDS = 10;` for configurable hashing strength.
3. **`PasswordAuthUser` Interface:** Changed `password: string;` to `passwordHash: string;` to reflect that we are storing a hash.
4. **`register` Action:**
   * Before inserting, `await hash(password, SALT_ROUNDS)` is used to generate a secure hash.
   * The `passwordHash` field of the `newUser` object stores this hash.
5. **`authenticate`, `deleteAccount`, `changePassword` Actions:**
   * Instead of searching for `{ username, password }` directly in the database (which would fail as plain text passwords are no longer stored), we now:
     * First, find the user by `username`.
     * Then, use `await compare(providedPassword, user.passwordHash)` to securely check if the provided plain text password matches the stored hash.
   * In `changePassword`, the `newPass` is also hashed before being stored.
6. **Error Messages:** Modified error messages in `authenticate` and `changePassword` to be more generic ("Invalid username or password," "Invalid username or current password") to prevent username enumeration attacks.
7. **`_checkPassword` Query:** Updated to use `bcrypt.compare` for verification.
8. **Documentation:** Updated comments to explicitly mention hashing and its implications.

This revised implementation significantly enhances the security of the `PasswordAuthConcept` by correctly handling password storage and verification.

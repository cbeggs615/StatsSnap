---
timestamp: 'Thu Oct 16 2025 21:30:50 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_213050.9707f256.md]]'
content_id: 34f5ee2cbffa00fafa16b97339e7fc8abcfef3591568720ce7e9be3dcaa868d9
---

# response:

You are absolutely right to consider using `node:crypto` for hashing, especially if you're working in a Node.js environment or a Deno environment that supports Node.js built-in modules. The `crypto` module offers powerful and flexible tools, including key derivation functions like PBKDF2, which are suitable for password hashing.

Unlike `bcrypt` which is a dedicated password hashing library, `node:crypto`'s PBKDF2 (Password-Based Key Derivation Function 2) allows you to specify the hashing algorithm (digest), iterations, and key length. This gives you more control, but also means you need to manage the salt, iterations, and digest algorithm yourself.

Here's how you'd refactor the `PasswordAuthConcept` to use `node:crypto`'s PBKDF2 for password hashing:

```typescript
// file: src/PasswordAuth/PasswordAuthConcept.ts

import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";
// Import the crypto module from Node.js built-ins, supported by Deno
import * as crypto from "node:crypto";

// Declare collection prefix, use concept name
const PREFIX = "PasswordAuth" + ".";

// Generic type of this concept - User is an ID
type User = ID;

// --- PBKDF2 Configuration Constants ---
// The number of iterations for PBKDF2. Higher numbers are more secure but slower.
// A value of 100,000 to 300,000 is often recommended as of current best practices (adjust based on hardware capabilities).
const PBKDF2_ITERATIONS = 100000;
// The desired byte length of the derived key (hash). 64 bytes (512 bits) is a good standard.
const PBKDF2_KEYLEN = 64;
// The HMAC digest algorithm to use. 'sha512' is a strong choice.
const PBKDF2_DIGEST = "sha512";
// The byte length for the randomly generated salt. 16 bytes is standard.
const SALT_BYTE_LENGTH = 16;

/**
 * State declaration for the PasswordAuth concept:
 *
 * a set of Users with
 *   a username String
 *   a password String (now stored as a PBKDF2 hash, along with its salt, iterations, and digest)
 */
interface PasswordAuthUser {
  _id: User; // The ID of the user in this concept, treated as an opaque identifier
  username: string;
  passwordHash: string; // The derived key (hashed password)
  salt: string; // The unique salt used for hashing this password
  iterations: number; // The number of iterations used (stored for verification)
  digest: string; // The digest algorithm used (stored for verification)
}

/**
 * Helper function to hash a password using PBKDF2.
 * @param password The plain-text password.
 * @param salt The salt to use.
 * @returns The generated hash as a hex string.
 */
async function hashPassword(password: string, salt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(
      password,
      salt,
      PBKDF2_ITERATIONS,
      PBKDF2_KEYLEN,
      PBKDF2_DIGEST,
      (err, derivedKey) => {
        if (err) reject(err);
        resolve(derivedKey.toString("hex"));
      },
    );
  });
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
   * effects: A new User is created, associated with the provided `username` and a PBKDF2 HASHED `password`.
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

    // Generate a unique salt for this user
    const salt = crypto.randomBytes(SALT_BYTE_LENGTH).toString("hex");

    // Hash the password using PBKDF2 with the generated salt
    const hashedPassword = await hashPassword(password, salt);

    // Effect: A new User is created.
    const newUser: PasswordAuthUser = {
      _id: freshID() as User, // Generate a fresh, unique ID for the new user
      username,
      passwordHash: hashedPassword,
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      digest: PBKDF2_DIGEST,
    };
    await this.users.insertOne(newUser);

    // Effect: The identifier of this new User is returned.
    return { user: newUser._id };
  }

  /**
   * authenticate (username: String, password: String): { success: boolean } | (error: String)
   *
   * requires: A User exists whose `username` matches the input `username`
   *           and whose provided `password` matches the stored PBKDF2 HASH.
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

    // Re-hash the provided password using the stored salt, iterations, and digest
    const providedPasswordHash = await new Promise<string>((resolve, reject) => {
      crypto.pbkdf2(
        password,
        user.salt,
        user.iterations,
        PBKDF2_KEYLEN, // Use the constant keylen, or ideally, store it in the user object as well if it could change per user.
        user.digest,
        (err, derivedKey) => {
          if (err) reject(err);
          resolve(derivedKey.toString("hex"));
        },
      );
    });

    // Compare the newly generated hash with the stored hash
    if (providedPasswordHash !== user.passwordHash) {
      return { error: "Invalid username or password." };
    }

    // Effect: User is authenticated. Return a non-empty dictionary for success.
    return { success: true };
  }

  /**
   * deleteAccount (username: String, password: String): { success: boolean } | (error: String)
   *
   * requires: A User exists whose `username` matches the input `username`
   *           and whose provided `password` matches the stored PBKDF2 HASH.
   * effects: The User associated with the given `username` is deleted,
   *          along with their `username` and password-related data. Returns { success: true } on successful deletion.
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

    // Re-hash the provided password for verification
    const providedPasswordHash = await new Promise<string>((resolve, reject) => {
      crypto.pbkdf2(
        password,
        user.salt,
        user.iterations,
        PBKDF2_KEYLEN,
        user.digest,
        (err, derivedKey) => {
          if (err) reject(err);
          resolve(derivedKey.toString("hex"));
        },
      );
    });

    if (providedPasswordHash !== user.passwordHash) {
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
   *           and whose `currentPass` matches the stored PBKDF2 HASH.
   * effects: The `password` of the User associated with the given `username` is updated to a PBKDF2 HASHED `newPass`.
   *          A new salt is generated for the new password.
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

    // Re-hash the provided current password for verification
    const providedCurrentPasswordHash = await new Promise<string>((resolve, reject) => {
      crypto.pbkdf2(
        currentPass,
        user.salt,
        user.iterations,
        PBKDF2_KEYLEN,
        user.digest,
        (err, derivedKey) => {
          if (err) reject(err);
          resolve(derivedKey.toString("hex"));
        },
      );
    });

    if (providedCurrentPasswordHash !== user.passwordHash) {
      return { error: "Invalid username or current password." };
    }

    // Generate a *new* salt for the *new* password
    const newSalt = crypto.randomBytes(SALT_BYTE_LENGTH).toString("hex");
    // Hash the new password using the new salt
    const newHashedPassword = await hashPassword(newPass, newSalt);

    // Effect: The password of the User is updated with the new hash, salt, etc.
    await this.users.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordHash: newHashedPassword,
          salt: newSalt,
          iterations: PBKDF2_ITERATIONS, // Potentially update iterations/digest if policies change
          digest: PBKDF2_DIGEST,
        },
      },
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
   * effects: Checks if the provided username and password are correct by re-hashing
   *          the password against the stored salt and parameters.
   *          Returns { success: true } if credentials match, or { error: String } otherwise.
   */
  async _checkPassword(
    { username, password }: { username: string; password: string },
  ): Promise<{ success: boolean } | { error: string }> {
    const user = await this.users.findOne({ username });
    if (!user) {
      return { error: "Invalid username or password." };
    }

    const providedPasswordHash = await new Promise<string>((resolve, reject) => {
      crypto.pbkdf2(
        password,
        user.salt,
        user.iterations,
        PBKDF2_KEYLEN,
        user.digest,
        (err, derivedKey) => {
          if (err) reject(err);
          resolve(derivedKey.toString("hex"));
        },
      );
    });

    if (providedPasswordHash === user.passwordHash) {
      return { success: true };
    }
    return { error: "Invalid username or password." };
  }
}
```

### Key Changes Made:

1. **`node:crypto` Import:** Replaced `bcrypt` import with `import * as crypto from "node:crypto";`.
2. **PBKDF2 Configuration Constants:** Defined `PBKDF2_ITERATIONS`, `PBKDF2_KEYLEN`, `PBKDF2_DIGEST`, and `SALT_BYTE_LENGTH` as constants to control the hashing process.
3. **`PasswordAuthUser` Interface Update:**
   * Changed `passwordHash` to `passwordHash: string;`.
   * Added `salt: string;`, `iterations: number;`, and `digest: string;` to store the parameters used for hashing each user's password. This is crucial because `pbkdf2` needs these exact parameters to verify a password later.
4. **`hashPassword` Helper Function:** Created an `async` helper function `hashPassword` that wraps `crypto.pbkdf2` in a `Promise`. This makes the code cleaner and easier to use with `await`.
5. **`register` Action:**
   * Generates a unique `salt` for each new user using `crypto.randomBytes().toString("hex")`.
   * Uses `await hashPassword(password, salt)` to hash the password.
   * Stores `passwordHash`, `salt`, `iterations`, and `digest` in the `PasswordAuthUser` document.
6. **`authenticate`, `deleteAccount`, `changePassword`, `_checkPassword` Actions:**
   * When verifying a password, it first retrieves the `user` document to get the stored `salt`, `iterations`, and `digest`.
   * It then re-hashes the *provided* plain-text password using these *retrieved* parameters.
   * Finally, it compares this newly generated hash with the stored `passwordHash`.
   * **Security Note:** In `changePassword`, a *new* salt is generated for the `newPass`. This is good practice as it makes the new hash independent of the old one.
7. **Error Handling:** Generic error messages are maintained for security.

This implementation effectively uses PBKDF2 from `node:crypto` to securely store and verify passwords, addressing the critical security vulnerability of plain-text password storage. Remember to choose appropriate `PBKDF2_ITERATIONS` based on your expected system load and security requirements.

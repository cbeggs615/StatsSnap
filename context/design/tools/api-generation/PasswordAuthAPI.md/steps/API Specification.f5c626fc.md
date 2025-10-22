---
timestamp: 'Mon Oct 20 2025 13:19:31 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_131931.8391e23a.md]]'
content_id: f5c626fc24e8cfa45daba9db4529cee0c0586d6a10287d00349b4472a29871a6
---

# API Specification: PasswordAuth Concept

**Purpose:** enables users to securely identify themselves and manage their access through username and password credentials.

***

## API Endpoints

### POST /api/PasswordAuth/register

**Description:** Creates a new user account with a unique username and password.

**Requirements:**

* No User currently exists with the given `username`.

**Effects:**

* A new User is created, associated with the provided `username` and a PBKDF2 HASHED `password`.
* The identifier of this new `User` is returned.

**Request Body:**

```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response Body (Action):**

```json
{
  "user": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/PasswordAuth/authenticate

**Description:** Authenticates a user by verifying their provided username and password against stored credentials.

**Requirements:**

* A User exists whose `username` matches the input `username`.
* The provided `password` matches the stored PBKDF2 HASH for that user.

**Effects:**

* Authenticates the user if credentials match.
* Returns `{ success: true }` on successful authentication.

**Request Body:**

```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response Body (Action):**

```json
{
  "success": "boolean"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/PasswordAuth/deleteAccount

**Description:** Deletes a user account and its associated credentials if the provided username and password are correct.

**Requirements:**

* A User exists whose `username` matches the input `username`.
* The provided `password` matches the stored PBKDF2 HASH for that user.

**Effects:**

* The User associated with the given `username` is deleted, along with their `username` and password-related data.
* Returns `{ success: true }` on successful deletion.

**Request Body:**

```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response Body (Action):**

```json
{
  "success": "boolean"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/PasswordAuth/changePassword

**Description:** Updates a user's password to a new value after verifying the current password.

**Requirements:**

* A User exists whose `username` matches the input `username`.
* The `currentPass` matches the stored PBKDF2 HASH for that user.

**Effects:**

* The `password` of the User associated with the given `username` is updated to a PBKDF2 HASHED `newPass`.
* A new salt is generated for the new password.
* Returns `{ success: true }` on successful password change.

**Request Body:**

```json
{
  "username": "string",
  "currentPass": "string",
  "newPass": "string"
}
```

**Success Response Body (Action):**

```json
{
  "success": "boolean"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/PasswordAuth/\_getUserByUsername

**Description:** Retrieves the User ID associated with a given username.

**Requirements:**

* (Implicit: no explicit `requires` defined in the specification)

**Effects:**

* Returns the User ID associated with a given username, if found.
* Returns an empty array `[]` if no user is found with that username.

**Request Body:**

```json
{
  "username": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "user": "string"
  }
]
```

*(Returns `[]` if no user is found.)*

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/PasswordAuth/\_checkPassword

**Description:** Verifies if the provided username and password combination is correct.

**Requirements:**

* (Implicit: no explicit `requires` defined in the specification)

**Effects:**

* Checks if the provided username and password are correct by re-hashing the password against the stored salt and parameters.
* Returns `{ success: true }` if credentials match.

**Request Body:**

```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "success": "boolean"
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

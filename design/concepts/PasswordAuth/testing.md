[@implementation](implementation.md)

[@testing-concepts](../../background/testing-concepts.md)

# file: src/concepts/PasswordAuth/PasswordAuthConcept.test.ts
```typescript
import {

assertEquals,

assertExists,

assertNotEquals,

} from "jsr:@std/assert";

import { testDb } from "@utils/database.ts";

import { ID } from "@utils/types.ts";

import PasswordAuthConcept from "./PasswordAuthConcept.ts";

  

const username = "user:alice" as ID;

const password = "password123";

const newPassword = "newpassword123";

  

Deno.test("Principle: PasswordAuth 1. user registers, authenticates, changes password, and deletes account", async () => {

const [db, client] = await testDb();

const auth = new PasswordAuthConcept(db);

  

try {

// 1. User registers successfully

const regResult = await auth.register({ username, password });

assertEquals("error" in regResult, false, "Registration should succeed.");

const { user } = regResult as { user: ID };

assertExists(user, "User ID should be returned after registration.");

  

// 2. Registration fails for duplicate username

const dupResult = await auth.register({ username, password });

assertEquals("error" in dupResult, true, "Duplicate registration should fail.");

assertEquals((dupResult as { error: string }).error, "Username already exists.");

  

// 3. Successful authentication

const authResult = await auth.authenticate({ username, password });

assertEquals("success" in authResult, true, "Authentication should succeed.");

  

// 4. Authentication fails for wrong password

const wrongPassResult = await auth.authenticate({ username, password: "wrongpass" });

assertEquals("error" in wrongPassResult, true, "Wrong password should fail.");

  

// 5. User changes password successfully

const chgResult = await auth.changePassword({

username,

currentPass: password,

newPass: newPassword,

});

assertEquals("success" in chgResult, true, "Password change should succeed.");

  

// 6. Old password no longer works

const oldAuth = await auth.authenticate({ username, password });

assertEquals("error" in oldAuth, true, "Old password should fail after change.");

  

// 7. New password works

const newAuth = await auth.authenticate({ username, password: newPassword });

assertEquals("success" in newAuth, true, "New password should succeed.");

  

// 8. User deletes account successfully

const delResult = await auth.deleteAccount({ username, password: newPassword });

assertEquals("success" in delResult, true, "Account deletion should succeed.");

  

// 9. Deleted user cannot authenticate

const postDelAuth = await auth.authenticate({ username, password: newPassword });

assertEquals("error" in postDelAuth, true, "Deleted user should not authenticate.");

} finally {

await client.close();

}

});

  

Deno.test("PasswordAuth: 2. register prevents duplicates", async () => {

const [db, client] = await testDb();

const auth = new PasswordAuthConcept(db);

try {

await auth.register({ username, password });

const second = await auth.register({ username, password });

assertEquals("error" in second, true, "Duplicate username should be rejected.");

} finally {

await client.close();

}

});

  

Deno.test("PasswordAuth: 3 authenticate enforces correctness", async () => {

const [db, client] = await testDb();

const auth = new PasswordAuthConcept(db);

try {

await auth.register({ username, password });

  

const correct = await auth.authenticate({ username, password });

assertEquals("success" in correct, true, "Correct credentials succeed.");

  

const wrongPass = await auth.authenticate({ username, password: "bad" });

assertEquals("error" in wrongPass, true, "Wrong password should fail.");

  

const noUser = await auth.authenticate({ username: "nouser", password });

assertEquals("error" in noUser, true, "Non-existent user should fail.");

} finally {

await client.close();

}

});

  

Deno.test("PasswordAuth: 4 changePassword enforces requirements", async () => {

const [db, client] = await testDb();

const auth = new PasswordAuthConcept(db);

try {

await auth.register({ username, password });

  

// Fails with wrong current password

const badChange = await auth.changePassword({

username,

currentPass: "bad",

newPass: "x",

});

assertEquals("error" in badChange, true, "Wrong current password should fail.");

  

// Fails for nonexistent user

const noUser = await auth.changePassword({

username: "fakeuser",

currentPass: password,

newPass: "x",

});

assertEquals("error" in noUser, true, "Nonexistent user should fail.");

  

// Succeeds for valid user

const goodChange = await auth.changePassword({

username,

currentPass: password,

newPass: newPassword,

});

assertEquals("success" in goodChange, true, "Password change should succeed.");

} finally {

await client.close();

}

});

  

Deno.test("PasswordAuth: 5 deleteAccount enforces correctness", async () => {

const [db, client] = await testDb();

const auth = new PasswordAuthConcept(db);

try {

await auth.register({ username, password });

  

// Fails with wrong password

const wrongPassDel = await auth.deleteAccount({ username, password: "bad" });

assertEquals("error" in wrongPassDel, true, "Wrong password deletion should fail.");

  

// Succeeds with correct password

const goodDel = await auth.deleteAccount({ username, password });

assertEquals("success" in goodDel, true, "Account deletion should succeed.");

  

// Fails for non-existent user

const noUserDel = await auth.deleteAccount({ username: "fake", password });

assertEquals("error" in noUserDel, true, "Nonexistent user deletion should fail.");

} finally {

await client.close();

}

});

  

Deno.test("PasswordAuth: 6 _getUserByUsername and _checkPassword work as expected", async () => {

const [db, client] = await testDb();

const auth = new PasswordAuthConcept(db);

try {

await auth.register({ username, password });

const found = await auth._getUserByUsername({ username });

assertEquals("user" in found, true, "Should find existing user.");

  

const notFound = await auth._getUserByUsername({ username: "nouser" });

assertEquals("user" in notFound, false, "Should not find non-existent user.");

  

const goodCheck = await auth._checkPassword({ username, password });

assertEquals("success" in goodCheck, true, "Correct credentials should pass check.");

  

const badCheck = await auth._checkPassword({ username, password: "bad" });

assertEquals("success" in badCheck, false, "Wrong password should fail check.");

} finally {

await client.close();

}

});

```
---
timestamp: 'Thu Oct 16 2025 14:00:22 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_140022.64c2d956.md]]'
content_id: 2fb84820c2e017fa47fc6538657a231dcd96ca1c25c4e62f5ea3388f3c8a1148
---

# file: src/concepts/ItemTracking/ItemTrackingConcept.test.ts\`

```typescript
import { assertEquals, assertExists } from "jsr:@std/assert";

import { testDb } from "@utils/database.ts";

import ItemTrackingConcept from "./ItemTrackingConcept.ts";

import { ID } from "@utils/types.ts";

  

const userA = "user:Alice" as ID;

const userB = "user:Bob" as ID;

const item1 = "item:1" as ID;

const item2 = "item:2" as ID;

const item3 = "item:3" as ID;

  

Deno.test("Action: addUserRecord successfully adds a new user", async () => {

const [db, client] = await testDb();

const tracking = new ItemTrackingConcept(db);

try {

const result = await tracking.addUserRecord({ user: userA });

assertEquals("error" in result, false, "User record creation should succeed.");

  

const tracked = await tracking._getItemsTrackedByUser({ user: userA });

assertEquals("error" in tracked, false, "Query should succeed.");

if (!("error" in tracked)) {

assertEquals(tracked.items.length, 0, "UserA should start with an empty set.");

}

} finally {

await client.close();

}

});

  

Deno.test("Action: addUserRecord fails if user already exists", async () => {

const [db, client] = await testDb();

const tracking = new ItemTrackingConcept(db);

try {

await tracking.addUserRecord({ user: userA });

const duplicate = await tracking.addUserRecord({ user: userA });

assertEquals("error" in duplicate, true, "Duplicate user creation should fail.");

assertEquals(

(duplicate as { error: string }).error,

`UserRecord for user ${userA} already exists.`,

);

} finally {

await client.close();

}

});

  

Deno.test("Action: addItem successfully adds first and second items", async () => {

const [db, client] = await testDb();

const tracking = new ItemTrackingConcept(db);

try {

await tracking.addUserRecord({ user: userA });

  

const add1 = await tracking.addItem({ user: userA, item: item1 });

assertEquals("error" in add1, false, "Adding Item1 should succeed.");

  

let tracked = await tracking._getItemsTrackedByUser({ user: userA });

if (!("error" in tracked)) {

assertEquals(tracked.items, [item1], "UserA should now track Item1.");

}

  

const add2 = await tracking.addItem({ user: userA, item: item2 });

assertEquals("error" in add2, false, "Adding Item2 should succeed.");

  

tracked = await tracking._getItemsTrackedByUser({ user: userA });

if (!("error" in tracked)) {

assertEquals(tracked.items.sort(), [item1, item2].sort());

}

} finally {

await client.close();

}

});

  

Deno.test("Action: addItem fails when item already tracked or user missing", async () => {

const [db, client] = await testDb();

const tracking = new ItemTrackingConcept(db);

try {

await tracking.addUserRecord({ user: userA });

await tracking.addItem({ user: userA, item: item1 });

await tracking.addItem({ user: userA, item: item2 });

  

const dup = await tracking.addItem({ user: userA, item: item1 });

assertEquals("error" in dup, true, "Re-adding existing item should fail.");

assertEquals(

(dup as { error: string }).error,

`Item ${item1} is already tracked by user ${userA}.`,

);

  

const missing = await tracking.addItem({ user: userB, item: item3 });

assertEquals("error" in missing, true, "Adding for missing user should fail.");

assertEquals(

(missing as { error: string }).error,

`UserRecord for user ${userB} not found.`,

);

} finally {

await client.close();

}

});

  

Deno.test("Action: removeItem successfully removes items", async () => {

const [db, client] = await testDb();

const tracking = new ItemTrackingConcept(db);

try {

await tracking.addUserRecord({ user: userA });

await tracking.addItem({ user: userA, item: item1 });

await tracking.addItem({ user: userA, item: item2 });

  

const rem1 = await tracking.removeItem({ user: userA, item: item1 });

assertEquals("error" in rem1, false, "Removing Item1 should succeed.");

  

let tracked = await tracking._getItemsTrackedByUser({ user: userA });

if (!("error" in tracked)) {

assertEquals(tracked.items, [item2]);

}

  

const rem2 = await tracking.removeItem({ user: userA, item: item2 });

assertEquals("error" in rem2, false, "Removing Item2 should succeed.");

  

tracked = await tracking._getItemsTrackedByUser({ user: userA });

if (!("error" in tracked)) {

assertEquals(tracked.items.length, 0, "UserA should now track no items.");

}

} finally {

await client.close();

}

});

  

Deno.test("Action: removeItem fails when item not tracked or user missing", async () => {

const [db, client] = await testDb();

const tracking = new ItemTrackingConcept(db);

try {

await tracking.addUserRecord({ user: userA });

  

const notTracked = await tracking.removeItem({ user: userA, item: item3 });

assertEquals("error" in notTracked, true);

assertEquals(

(notTracked as { error: string }).error,

`Item ${item3} is not tracked by user ${userA}.`,

);

  

const noUser = await tracking.removeItem({ user: userB, item: item1 });

assertEquals("error" in noUser, true);

assertEquals(

(noUser as { error: string }).error,

`UserRecord for user ${userB} not found.`,

);

} finally {

await client.close();

}

});

  

Deno.test("Principle: multiple users track items independently", async () => {

const [db, client] = await testDb();

const tracking = new ItemTrackingConcept(db);

try {

await tracking.addUserRecord({ user: userA });

await tracking.addUserRecord({ user: userB });

  

await tracking.addItem({ user: userA, item: item1 });

await tracking.addItem({ user: userA, item: item2 });

await tracking.addItem({ user: userB, item: item1 });

  

let trackedA = await tracking._getItemsTrackedByUser({ user: userA });

let trackedB = await tracking._getItemsTrackedByUser({ user: userB });

if (!("error" in trackedA) && !("error" in trackedB)) {

assertEquals(trackedA.items.sort(), [item1, item2].sort());

assertEquals(trackedB.items, [item1]);

}

  

await tracking.removeItem({ user: userA, item: item1 });

trackedA = await tracking._getItemsTrackedByUser({ user: userA });

trackedB = await tracking._getItemsTrackedByUser({ user: userB });

if (!("error" in trackedA) && !("error" in trackedB)) {

assertEquals(trackedA.items, [item2]);

assertEquals(trackedB.items, [item1], "UserB unaffected.");

}

  

await tracking.addItem({ user: userB, item: item3 });

trackedA = await tracking._getItemsTrackedByUser({ user: userA });

trackedB = await tracking._getItemsTrackedByUser({ user: userB });

if (!("error" in trackedA) && !("error" in trackedB)) {

assertEquals(trackedA.items, [item2]);

assertEquals(trackedB.items.sort(), [item1, item3].sort());

}

} finally {

await client.close();

}

});

  

Deno.test("Query: _getUsersTrackingItem returns correct users", async () => {

const [db, client] = await testDb();

const tracking = new ItemTrackingConcept(db);

try {

await tracking.addUserRecord({ user: userA });

await tracking.addUserRecord({ user: userB });

await tracking.addItem({ user: userA, item: item1 });

await tracking.addItem({ user: userB, item: item1 });

await tracking.addItem({ user: userB, item: item2 });

  

const usersForItem1 = await tracking._getUsersTrackingItem({ item: item1 });

assertEquals(usersForItem1.users.sort(), [userA, userB].sort());

  

const usersForItem2 = await tracking._getUsersTrackingItem({ item: item2 });

assertEquals(usersForItem2.users, [userB]);

  

const usersForItem3 = await tracking._getUsersTrackingItem({ item: item3 });

assertEquals(usersForItem3.users.length, 0, "No users should track Item3.");

} finally {

await client.close();

}

});
```

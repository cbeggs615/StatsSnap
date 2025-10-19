---
timestamp: 'Thu Oct 16 2025 22:15:47 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_221547.585a03db.md]]'
content_id: 3acad87185ad987a06cbac4cb197e764bd5e8e9a40f615d0b54bd1e677a0b97d
---

# src: src/concepts/StreamedEvents/StreamedEventsConcept.test.ts

```typescript
import { assertEquals, assertExists } from "jsr:@std/assert";

import { testDb } from "@utils/database.ts";

import { ID } from "@utils/types.ts";

import StreamedEventsConcept from "./StreamedEventsConcept.ts";

  

const itemA = "item:A" as ID;

const itemB = "item:B" as ID;

const name1 = "Concert";

const name2 = "Livestream";

const date1 = new Date("2025-01-01T10:00:00Z");

const date2 = new Date("2025-01-02T10:00:00Z");

const newDate = new Date("2025-01-03T12:00:00Z");

const link1 = "https://example.com/event1";

const link2 = "https://example.com/event2";

const newLink = "https://example.com/updated";

  

//

// ─────────────────────────────────────────────

// TEST GROUP 1: Add Events

// ─────────────────────────────────────────────

//

Deno.test("Action: addEvent successfully creates unique events", async () => {

const [db, client] = await testDb();

const stream = new StreamedEventsConcept(db);

try {

const res1 = await stream.addEvent({ name: name1, date: date1, accessLink: link1 });

assertEquals("error" in res1, false, "Adding first event should succeed.");

assertExists((res1 as { event: ID }).event);

  

const res2 = await stream.addEvent({ name: name2, date: date2, accessLink: link2 });

assertEquals("error" in res2, false, "Adding second event should succeed.");

  

const { event: eventId } = res1 as { event: ID };

const details = await stream._getEventDetails({ eventId });

assertEquals("error" in details, false, "Newly added event should be queryable.");

} finally {

await client.close();

}

});

  

Deno.test("Action: addEvent fails when duplicate name/date combination exists", async () => {

const [db, client] = await testDb();

const stream = new StreamedEventsConcept(db);

try {

await stream.addEvent({ name: name1, date: date1, accessLink: link1 });

const dup = await stream.addEvent({ name: name1, date: date1, accessLink: link1 });

assertEquals("error" in dup, true, "Duplicate event should fail.");

} finally {

await client.close();

}

});

  

//

// ─────────────────────────────────────────────

// TEST GROUP 2: Add and Associate Items

// ─────────────────────────────────────────────

//

Deno.test("Action: addItem creates new item and prevents duplicates", async () => {

const [db, client] = await testDb();

const stream = new StreamedEventsConcept(db);

try {

const add = await stream.addItem({ item: itemA });

assertEquals("error" in add, false, "Adding new item should succeed.");

  

const dup = await stream.addItem({ item: itemA });

assertEquals("error" in dup, true, "Adding duplicate item should fail.");

} finally {

await client.close();

}

});

  

Deno.test("Action: associateItem links items with existing events", async () => {

const [db, client] = await testDb();

const stream = new StreamedEventsConcept(db);

try {

const ev1 = await stream.addEvent({ name: name1, date: date1, accessLink: link1 });

const ev2 = await stream.addEvent({ name: name2, date: date2, accessLink: link2 });

const event1 = (ev1 as { event: ID }).event;

const event2 = (ev2 as { event: ID }).event;

  

await stream.addItem({ item: itemA });

  

const assoc1 = await stream.associateItem({ item: itemA, event: event1 });

assertEquals("error" in assoc1, false, "Associating first event should succeed.");

  

const assoc2 = await stream.associateItem({ item: itemA, event: event2 });

assertEquals("error" in assoc2, false, "Associating second event should succeed.");

  

const events = await stream._getItemEvents({ item: itemA });

if (!("error" in events)) {

const eventNames = events.map((e) => e.name).sort();

assertEquals(eventNames, [name1, name2].sort(), "ItemA should have two events.");

}

} finally {

await client.close();

}

});

  

Deno.test("Action: associateItem fails when event does not exist", async () => {

const [db, client] = await testDb();

const stream = new StreamedEventsConcept(db);

try {

const result = await stream.associateItem({ item: itemA, event: "event:fake" as ID });

assertEquals("error" in result, true, "Should fail for non-existent event.");

} finally {

await client.close();

}

});

  

//

// ─────────────────────────────────────────────

// TEST GROUP 3: Editing Events

// ─────────────────────────────────────────────

//

Deno.test("Action: editEventTime updates date successfully", async () => {

const [db, client] = await testDb();

const stream = new StreamedEventsConcept(db);

try {

await stream.addEvent({ name: name1, date: date1, accessLink: link1 });

  

const edit = await stream.editEventTime({ name: name1, olddate: date1, newdate: newDate });

assertEquals("error" in edit, false, "Editing event time should succeed.");

  

const updated = await stream._findEventsByNameAndDate({ name: name1, date: newDate });

assertEquals("error" in updated, false, "Updated event should exist with new date.");

} finally {

await client.close();

}

});

  

Deno.test("Action: editEventTime fails for non-existent event", async () => {

const [db, client] = await testDb();

const stream = new StreamedEventsConcept(db);

try {

const result = await stream.editEventTime({

name: "FakeEvent",

olddate: date1,

newdate: newDate,

});

assertEquals("error" in result, true, "Editing non-existent event should fail.");

} finally {

await client.close();

}

});

  

Deno.test("Action: editEventURL successfully updates link", async () => {

const [db, client] = await testDb();

const stream = new StreamedEventsConcept(db);

try {

await stream.addEvent({ name: name2, date: date2, accessLink: link2 });

  

const edit = await stream.editEventURL({

name: name2,

date: date2,

newURL: newLink,

});

assertEquals("error" in edit, false, "Editing event URL should succeed.");

  

const updated = await stream._findEventsByNameAndDate({ name: name2, date: date2 });

if (!("error" in updated)) {

assertEquals(updated.accessLink, newLink, "Access link should be updated.");

}

} finally {

await client.close();

}

});

  

//

// ─────────────────────────────────────────────

// TEST GROUP 4: Removing Events

// ─────────────────────────────────────────────

//

Deno.test("Action: removeEvent deletes event and de-associates items", async () => {

const [db, client] = await testDb();

const stream = new StreamedEventsConcept(db);

try {

const add = await stream.addEvent({ name: name1, date: date1, accessLink: link1 });

const eventId = (add as { event: ID }).event;

  

await stream.associateItem({ item: itemA, event: eventId });

  

const remove = await stream.removeEvent({ name: name1, date: date1 });

assertEquals("error" in remove, false, "Removing event should succeed.");

  

const check = await stream._findEventsByNameAndDate({ name: name1, date: date1 });

assertEquals("error" in check, true, "Removed event should not exist.");

  

const itemEvents = await stream._getItemEvents({ item: itemA });

if (!("error" in itemEvents)) {

assertEquals(itemEvents.length, 0, "ItemA should have no events after deletion.");

}

} finally {

await client.close();

}

});

  

Deno.test("Action: removeEvent fails when event not found", async () => {

const [db, client] = await testDb();

const stream = new StreamedEventsConcept(db);

try {

const result = await stream.removeEvent({

name: "Nonexistent",

date: new Date("2025-01-01T00:00:00Z"),

});

assertEquals("error" in result, true, "Removing nonexistent event should fail.");

} finally {

await client.close();

}

});

  

//

// ─────────────────────────────────────────────

// TEST GROUP 5: Queries and Retrieval

// ─────────────────────────────────────────────

//

Deno.test("Query: _getItemEvents returns full event details", async () => {

const [db, client] = await testDb();

const stream = new StreamedEventsConcept(db);

try {

const ev = await stream.addEvent({ name: name1, date: date1, accessLink: link1 });

const eventId = (ev as { event: ID }).event;

await stream.associateItem({ item: itemA, event: eventId });

  

const res = await stream._getItemEvents({ item: itemA });

assertEquals("error" in res, false, "Query should succeed.");

if (!("error" in res)) {

assertEquals(res[0].name, name1);

assertEquals(res[0].accessLink, link1);

}

} finally {

await client.close();

}

});

  

Deno.test("Query: _getItemEvents and _getEventDetails handle errors", async () => {

const [db, client] = await testDb();

const stream = new StreamedEventsConcept(db);

try {

const ev = await stream.addEvent({ name: name2, date: date2, accessLink: link2 });

const eventId = (ev as { event: ID }).event;

  

const noItem = await stream._getItemEvents({ item: itemB });

assertEquals("error" in noItem, true, "Querying nonexistent item should fail.");

  

const noEvent = await stream._getEventDetails({ eventId: "fake:event" as ID });

assertEquals("error" in noEvent, true, "Querying nonexistent event should fail.");

  

const eventDetails = await stream._getEventDetails({ eventId });

assertEquals("error" in eventDetails, false, "Valid event query should succeed.");

if (!("error" in eventDetails)) {

assertEquals(eventDetails.name, name2);

assertEquals(eventDetails.accessLink, link2);

}

} finally {

await client.close();

}

});
```

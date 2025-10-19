

import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts"; // Assumed utility for test database setup
import { ID } from "@utils/types.ts"; // Assumed utility for branded ID type

import StreamedEventsConcept from "./StreamedEventsConcept.ts";


// Helper type guard for cleaner error handling
function isError<T>(result: T | { error: string }): result is { error: string } {
    return typeof result === 'object' && result !== null && 'error' in result;
}

// Shared test data for consistency and readability
const itemA = "item:blog-post-101" as ID;
const itemB = "item:product-page-beta" as ID;

const eventName1 = "Product Launch Webinar";
const eventName2 = "Monthly Community Q&A";
const eventName3 = "Developer Workshop Series";
const eventName4 = "Annual Keynote";

const date1 = new Date("2024-10-26T14:00:00Z");
const date2 = new Date("2024-11-15T18:00:00Z");
const date3 = new Date("2024-12-01T09:00:00Z");
const date4 = new Date("2025-01-20T10:00:00Z");
const updatedDate1 = new Date("2024-10-27T10:00:00Z"); // For editing date1

const url1 = "https://webinar.example.com/launch";
const url2 = "https://youtube.com/live/community-qa";
const url3 = "https://zoom.us/j/dev-workshop";
const url4 = "https://events.example.com/keynote";
const updatedUrl1 = "https://new-webinar.example.com/launch-recap"; // For editing url1

//
// ────────────────────────────────────────────────────────────────────────────
// TEST 1: Operational Principle - Event Lifecycle and Item Association
//
// This test validates the core principle: users can associate items with events
// and quickly access each event with a URL. It covers event creation, item
// association, and retrieval, along with common error cases for duplicates.
// ────────────────────────────────────────────────────────────────────────────
//
Deno.test("Principle: StreamedEvents 1: allows users to associate items with events and quickly access events via URL", async () => {
  const [db, client] = await testDb();
  const stream = new StreamedEventsConcept(db);

  try {
    // Phase 1: Add multiple unique events and test duplicate event creation
    const event1Res = await stream.addEvent({ name: eventName1, date: date1, accessLink: url1 });
    if (isError(event1Res)) throw new Error(`Expected addEvent for event 1 to succeed, but it failed: ${event1Res.error}`);
    const eventId1 = event1Res.event;
    assertExists(eventId1, "Event ID 1 should be returned upon successful creation.");

    const event2Res = await stream.addEvent({ name: eventName2, date: date2, accessLink: url2 });
    if (isError(event2Res)) throw new Error(`Expected addEvent for event 2 to succeed, but it failed: ${event2Res.error}`);
    const eventId2 = event2Res.event;
    assertExists(eventId2, "Event ID 2 should be returned upon successful creation.");

    // Attempt to add a duplicate event (same name/date) should fail
    const duplicateEventRes = await stream.addEvent({ name: eventName1, date: date1, accessLink: url1 });
    assertNotEquals(isError(duplicateEventRes), false, "Adding a duplicate event (same name/date) should return an error.");
    if (isError(duplicateEventRes)) {
        assertEquals(duplicateEventRes.error, `An event named '${eventName1}' at '${date1.toISOString()}' already exists.`, "Duplicate event error message mismatch.");
    }

    // Phase 2: Add an item and test duplicate item creation
    const addItemARes = await stream.addItem({ item: itemA });
    if (isError(addItemARes)) throw new Error(`Expected addItem for item A to succeed, but it failed: ${addItemARes.error}`);

    // Attempt to add a duplicate item should fail
    const duplicateItemARes = await stream.addItem({ item: itemA });
    assertNotEquals(isError(duplicateItemARes), false, "Adding a duplicate item should return an error.");
    if (isError(duplicateItemARes)) {
        assertEquals(duplicateItemARes.error, `Item '${itemA}' is already associated.`, "Duplicate item error message mismatch.");
    }

    // Phase 3: Associate events with the item and test associating non-existent event
    const assoc1Res = await stream.associateItem({ item: itemA, event: eventId1 });
    if (isError(assoc1Res)) throw new Error(`Expected associateItem for event 1 to item A to succeed, but it failed: ${assoc1Res.error}`);

    const assoc2Res = await stream.associateItem({ item: itemA, event: eventId2 });
    if (isError(assoc2Res)) throw new Error(`Expected associateItem for event 2 to item A to succeed, but it failed: ${assoc2Res.error}`);

    // Attempt to associate a non-existent event should fail
    const nonExistentEventAssocRes = await stream.associateItem({ item: itemA, event: "fake:event" as ID });
    assertNotEquals(isError(nonExistentEventAssocRes), false, "Associating a non-existent event should return an error.");
    if (isError(nonExistentEventAssocRes)) {
        assertEquals(nonExistentEventAssocRes.error, "Event with ID 'fake:event' does not exist.", "Non-existent event association error message mismatch.");
    }

    // Phase 4: Validate the principle by querying associated events and their URLs
    const itemEventsResult = await stream._getItemEvents({ item: itemA });
    if (isError(itemEventsResult)) throw new Error(`Expected _getItemEvents for item A to succeed, but it failed: ${itemEventsResult.error}`);
    const itemEvents = itemEventsResult;

    assertEquals(itemEvents.length, 2, "Item A should have exactly two associated events.");

    const retrievedEventNames = itemEvents.map((e) => e.name).sort();
    const expectedEventNames = [eventName1, eventName2].sort();
    assertEquals(retrievedEventNames, expectedEventNames, "Retrieved event names do not match expected.");

    const retrievedEventUrls = itemEvents.map((e) => e.accessLink).sort();
    const expectedEventUrls = [url1, url2].sort();
    assertEquals(retrievedEventUrls, expectedEventUrls, "Retrieved event URLs do not match expected, ensuring 'quick access'.");

    // Further verification of individual event details via direct query
    const event1DetailsResult = await stream._getEventDetails({ eventId: eventId1 });
    if (isError(event1DetailsResult)) throw new Error(`Expected _getEventDetails for event 1 to succeed, but it failed: ${event1DetailsResult.error}`);
    const event1Details = event1DetailsResult;
    assertEquals(event1Details.name, eventName1, "Event 1 name mismatch.");
    assertEquals(event1Details.date.toISOString(), date1.toISOString(), "Event 1 date mismatch.");
    assertEquals(event1Details.accessLink, url1, "Event 1 URL mismatch.");

  } finally {
    await client.close();
  }
});

//
// ──────────────────────────────────────────────────────────────────
// TEST 2: Event Modification and Error Handling
//
// This test focuses on the `editEventTime` and `editEventURL` actions,
// including verifying updates and handling cases where the event to be
// edited does not exist.
// ──────────────────────────────────────────────────────────────────
//
Deno.test("StreamedEvents 2: allows modification of event time and URL, with proper error handling", async () => {
  const [db, client] = await testDb();
  const stream = new StreamedEventsConcept(db);

  try {
    // Phase 1: Add an event to be modified and verify its initial state
    const eventRes = await stream.addEvent({ name: eventName3, date: date3, accessLink: url3 });
    if (isError(eventRes)) throw new Error(`Expected addEvent for event 3 to succeed, but it failed: ${eventRes.error}`);
    const eventId3 = eventRes.event;
    assertExists(eventId3, "Event ID 3 should be returned.");

    const initialDetailsResult = await stream._getEventDetails({ eventId: eventId3 });
    if (isError(initialDetailsResult)) throw new Error(`Expected _getEventDetails for event 3 to succeed, but it failed: ${initialDetailsResult.error}`);
    const initialDetails = initialDetailsResult;
    assertEquals(initialDetails.name, eventName3);
    assertEquals(initialDetails.date.toISOString(), date3.toISOString());
    assertEquals(initialDetails.accessLink, url3);

    // Phase 2: Edit event time and verify the update
    const editTimeRes = await stream.editEventTime({ name: eventName3, olddate: date3, newdate: updatedDate1 });
    if (isError(editTimeRes)) throw new Error(`Expected editEventTime to succeed, but it failed: ${editTimeRes.error}`);

    // Verify the event now exists with the new date
    const updatedTimeDetailsResult = await stream._findEventsByNameAndDate({ name: eventName3, date: updatedDate1 });
    if (isError(updatedTimeDetailsResult)) throw new Error(`Expected _findEventsByNameAndDate with new date to succeed, but it failed: ${updatedTimeDetailsResult.error}`);
    const updatedTimeDetails  = updatedTimeDetailsResult;
    assertEquals(updatedTimeDetails.date.toISOString(), updatedDate1.toISOString(), "Event date should be updated.");

    // Ensure the old date no longer finds the event
    const oldDateSearch = await stream._findEventsByNameAndDate({ name: eventName3, date: date3 });
    assertNotEquals(isError(oldDateSearch), false, "Event should no longer be found by its old date.");
    if (isError(oldDateSearch)) {
        assertEquals(oldDateSearch.error, `Event named '${eventName3}' at '${date3.toISOString()}' not found.`, "Error message for old date search mismatch.");
    }

    // Phase 3: Edit event URL and verify the update
    const editUrlRes = await stream.editEventURL({ name: eventName3, date: updatedDate1, newURL: updatedUrl1 });
    if (isError(editUrlRes)) throw new Error(`Expected editEventURL to succeed, but it failed: ${editUrlRes.error}`);

    const updatedUrlDetailsResult = await stream._findEventsByNameAndDate({ name: eventName3, date: updatedDate1 });
    if (isError(updatedUrlDetailsResult)) throw new Error(`Expected _findEventsByNameAndDate after URL update to succeed, but it failed: ${updatedUrlDetailsResult.error}`);
    const updatedUrlDetails = updatedUrlDetailsResult;
    assertEquals(updatedUrlDetails.accessLink, updatedUrl1, "Access link should be updated.");

    // Phase 4: Test error handling for editing non-existent events
    const editNonExistentTimeRes = await stream.editEventTime({
      name: "NonExistentEvent",
      olddate: date1,
      newdate: new Date(),
    });
    assertNotEquals(isError(editNonExistentTimeRes), false, "Editing non-existent event time should return an error.");
    if (isError(editNonExistentTimeRes)) {
        assertEquals(editNonExistentTimeRes.error, `Event named 'NonExistentEvent' at '${date1.toISOString()}' not found.`, "Error message for non-existent event time edit mismatch.");
    }

    const editNonExistentUrlRes = await stream.editEventURL({
      name: "NonExistentEvent",
      date: date1,
      newURL: "https://fail.com",
    });
    assertNotEquals(isError(editNonExistentUrlRes), false, "Editing non-existent event URL should return an error.");
    if (isError(editNonExistentUrlRes)) {
        assertEquals(editNonExistentUrlRes.error, `Event named 'NonExistentEvent' at '${date1.toISOString()}' not found.`, "Error message for non-existent event URL edit mismatch.");
    }

  } finally {
    await client.close();
  }
});

//
// ────────────────────────────────────────────────────────────────────────
// TEST 3: Event Removal and Cascading De-association
//
// This test traces the removal of events, ensuring that the event is
// deleted from the events collection and is correctly de-associated from
// any items it was linked to. It also includes error handling for removal.
// ────────────────────────────────────────────────────────────────────────
//
Deno.test("StreamedEvents 3: correctly removes events and de-associates them from items", async () => {
  const [db, client] = await testDb();
  const stream = new StreamedEventsConcept(db);

  try {
    // Phase 1: Setup - Add item and two events, then associate both events with the item
    const itemBAddRes = await stream.addItem({ item: itemB });
    if (isError(itemBAddRes)) throw new Error(`Expected addItem for item B to succeed, but it failed: ${itemBAddRes.error}`);

    const event3Res = await stream.addEvent({ name: eventName3, date: date3, accessLink: url3 });
    if (isError(event3Res)) throw new Error(`Expected addEvent for event 3 to succeed, but it failed: ${event3Res.error}`);
    const eventId3 = event3Res.event;

    const event4Res = await stream.addEvent({ name: eventName4, date: date4, accessLink: url4 });
    if (isError(event4Res)) throw new Error(`Expected addEvent for event 4 to succeed, but it failed: ${event4Res.error}`);
    const eventId4 = event4Res.event;

    const assoc3Res = await stream.associateItem({ item: itemB, event: eventId3 });
    if (isError(assoc3Res)) throw new Error(`Expected associateItem for event 3 to item B to succeed, but it failed: ${assoc3Res.error}`);

    const assoc4Res = await stream.associateItem({ item: itemB, event: eventId4 });
    if (isError(assoc4Res)) throw new Error(`Expected associateItem for event 4 to item B to succeed, but it failed: ${assoc4Res.error}`);

    // Verify initial association for Item B
    const initialItemEventsResult = await stream._getItemEvents({ item: itemB });
    if (isError(initialItemEventsResult)) throw new Error(`Expected _getItemEvents for item B to succeed, but it failed: ${initialItemEventsResult.error}`);
    const initialItemEvents  = initialItemEventsResult;

    assertEquals(initialItemEvents.length, 2, "Item B should initially have two events.");
    const names = initialItemEvents.map(e => e.name).sort();
    assertEquals(names, [eventName3, eventName4].sort(), "Initial event names for Item B mismatch.");

    // Phase 2: Remove Event 3 and verify cascading de-association
    const removeEvent3Res = await stream.removeEvent({ name: eventName3, date: date3 });
    if (isError(removeEvent3Res)) throw new Error(`Expected removeEvent for event 3 to succeed, but it failed: ${removeEvent3Res.error}`);

    // Verify Event 3 is gone from events collection
    const findRemovedEvent3 = await stream._findEventsByNameAndDate({ name: eventName3, date: date3 });
    assertNotEquals(isError(findRemovedEvent3), false, "Removed event 3 should no longer be found.");
    if (isError(findRemovedEvent3)) {
        assertEquals(findRemovedEvent3.error, `Event named '${eventName3}' at '${date3.toISOString()}' not found.`, "Error message for removed event 3 not found mismatch.");
    }

    // Verify Event 3 is de-associated from Item B
    const itemEventsAfterRemove3Result = await stream._getItemEvents({ item: itemB });
    if (isError(itemEventsAfterRemove3Result)) throw new Error(`Expected _getItemEvents for item B after removing event 3 to succeed, but it failed: ${itemEventsAfterRemove3Result.error}`);
    const itemEventsAfterRemove3 = itemEventsAfterRemove3Result;

    assertEquals(itemEventsAfterRemove3.length, 1, "Item B should have one event after removing event 3.");
    assertEquals(itemEventsAfterRemove3[0].name, eventName4, "The remaining event should be event 4.");

    // Phase 3: Remove Event 4 and verify Item B has no events left
    const removeEvent4Res = await stream.removeEvent({ name: eventName4, date: date4 });
    if (isError(removeEvent4Res)) throw new Error(`Expected removeEvent for event 4 to succeed, but it failed: ${removeEvent4Res.error}`);

    const itemEventsAfterRemove4Result = await stream._getItemEvents({ item: itemB });
    if (isError(itemEventsAfterRemove4Result)) throw new Error(`Expected _getItemEvents for item B after removing event 4 to succeed, but it failed: ${itemEventsAfterRemove4Result.error}`);
    const itemEventsAfterRemove4  = itemEventsAfterRemove4Result;

    assertEquals(itemEventsAfterRemove4.length, 0, "Item B should have no events after removing event 4.");

    // Phase 4: Attempt to remove a non-existent event
    const removeNonExistentRes = await stream.removeEvent({
      name: "DefinitelyNotHere",
      date: new Date("2020-01-01T00:00:00Z"),
    });
    assertNotEquals(isError(removeNonExistentRes), false, "Removing a non-existent event should return an error.");
    if (isError(removeNonExistentRes)) {
        assertExists(removeNonExistentRes.error, "Error message should be present for non-existent event removal.");
        assertEquals(removeNonExistentRes.error, `Event named 'DefinitelyNotHere' at '2020-01-01T00:00:00.000Z' not found.`);
    }

  } finally {
    await client.close();
  }
});

//
// ──────────────────────────────────────────────────────────────
// TEST 4: Shared Events Across Multiple Items and Sequential Updates
//
// This test explores a richer scenario: multiple items share events,
// events get edited or removed, and we ensure updates propagate correctly
// without data leakage between items.
// ──────────────────────────────────────────────────────────────
//
Deno.test("StreamedEvents 4: supports shared events across items with consistent updates and isolation", async () => {
  const [db, client] = await testDb();
  const stream = new StreamedEventsConcept(db);

  try {
    // Phase 1: Create two items and one shared event
    const item1 = "item:article-42" as ID;
    const item2 = "item:podcast-episode-9" as ID;

    const addItem1Res = await stream.addItem({ item: item1 });
    const addItem2Res = await stream.addItem({ item: item2 });
    if (isError(addItem1Res) || isError(addItem2Res)) {
      throw new Error("Failed to add test items.");
    }

    const sharedEventRes = await stream.addEvent({
      name: "Launch Recap Stream",
      date: new Date("2025-03-01T15:00:00Z"),
      accessLink: "https://events.example.com/launch-recap",
    });
    if (isError(sharedEventRes)) throw new Error(`Failed to create shared event: ${sharedEventRes.error}`);
    const sharedEventId = sharedEventRes.event;

    // Phase 2: Associate the same event with multiple items
    const assoc1Res = await stream.associateItem({ item: item1, event: sharedEventId });
    const assoc2Res = await stream.associateItem({ item: item2, event: sharedEventId });
    if (isError(assoc1Res) || isError(assoc2Res)) throw new Error("Failed to associate shared event with both items.");

    // Verify both items reference the same single event
    const item1EventsRes = await stream._getItemEvents({ item: item1 });
    const item2EventsRes = await stream._getItemEvents({ item: item2 });
    if (isError(item1EventsRes) || isError(item2EventsRes)) throw new Error("Failed to retrieve item events.");

    assertEquals(item1EventsRes.length, 1);
    assertEquals(item2EventsRes.length, 1);
    assertEquals(item1EventsRes[0]._id, item2EventsRes[0]._id, "Both items should share the exact same event ID.");

    // Phase 3: Edit event URL → verify both items see the update
    const newSharedUrl = "https://events.example.com/launch-recap-updated";
    const editSharedUrlRes = await stream.editEventURL({
      name: "Launch Recap Stream",
      date: new Date("2025-03-01T15:00:00Z"),
      newURL: newSharedUrl,
    });
    if (isError(editSharedUrlRes)) throw new Error(`Editing shared event URL failed: ${editSharedUrlRes.error}`);

    const refreshed1 = await stream._getItemEvents({ item: item1 });
    const refreshed2 = await stream._getItemEvents({ item: item2 });
    if (isError(refreshed1) || isError(refreshed2)) throw new Error("Failed to re-fetch item events after URL edit.");

    assertEquals(refreshed1[0].accessLink, newSharedUrl, "Item 1 should reflect updated shared event URL.");
    assertEquals(refreshed2[0].accessLink, newSharedUrl, "Item 2 should reflect updated shared event URL.");

    // Phase 4: Remove the shared event and verify it disappears from both items
    const removeSharedRes = await stream.removeEvent({
      name: "Launch Recap Stream",
      date: new Date("2025-03-01T15:00:00Z"),
    });
    if (isError(removeSharedRes)) throw new Error(`Removing shared event failed: ${removeSharedRes.error}`);

    const afterRemove1 = await stream._getItemEvents({ item: item1 });
    const afterRemove2 = await stream._getItemEvents({ item: item2 });
    if (isError(afterRemove1) || isError(afterRemove2)) throw new Error("Failed to fetch after shared event removal.");

    assertEquals(afterRemove1.length, 0, "Item 1 should have no events after shared event removal.");
    assertEquals(afterRemove2.length, 0, "Item 2 should have no events after shared event removal.");

    // Phase 5: Sanity check isolation — adding new event for one item shouldn’t affect the other
    const newSoloEventRes = await stream.addEvent({
      name: "Solo Item 2 Event",
      date: new Date("2025-03-15T16:00:00Z"),
      accessLink: "https://solo.example.com",
    });
    if (isError(newSoloEventRes)) throw new Error(`Failed to add solo event: ${newSoloEventRes.error}`);
    const newSoloEventId = newSoloEventRes.event;

    await stream.associateItem({ item: item2, event: newSoloEventId });

    const finalEvents1 = await stream._getItemEvents({ item: item1 });
    const finalEvents2 = await stream._getItemEvents({ item: item2 });
    if (isError(finalEvents1) || isError(finalEvents2)) throw new Error("Failed final item event retrieval.");

    assertEquals(finalEvents1.length, 0, "Item 1 should remain empty (isolation confirmed).");
    assertEquals(finalEvents2.length, 1, "Item 2 should have one new event (isolation confirmed).");

  } finally {
    await client.close();
  }
});

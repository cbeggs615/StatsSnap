[@concept-design-overview](../../background/concept-design-overview.md)

[@concept-specifications](../../background/concept-specifications.md)

[@implementing-concepts](../../background/implementing-concepts.md)

# implement: StreamedEvents

![@StreamedEvents](StreamedEvents.md)
# response:

```typescript
// // file: src/StreamedEvents/StreamedEventsConcept.ts

import { Collection, Db } from "npm:mongodb";

import { Empty, ID } from "@utils/types.ts";

import { freshID } from "@utils/database.ts";

  

// Declare collection prefix, uses the concept name to avoid conflicts

const PREFIX = "StreamedEvents" + ".";

  

/**

* Generic types and their mappings for the StreamedEvents concept.

* Item: An external identifier for an entity to which events are associated.

* EventID: An internal identifier for an event managed by this concept.

* URL: A string representing a Uniform Resource Locator.

* DateTime: A standard JavaScript Date object, stored as ISODate in MongoDB.

*/

type Item = ID;

type EventID = ID;

type URL = string;

type DateTime = Date;

  

/**

* Represents an item document in the database.

* @property _id - The unique identifier for the item (an external ID).

* @property events - A list of EventIDs associated with this item.

*

* Corresponds to: "a set of Items with a set of Events"

*/

interface ItemDoc {

_id: Item;

events: EventID[];

}

  

/**

* Represents an event document in the database.

* @property _id - The unique identifier for the event (an internal ID).

* @property name - The name of the event.

* @property date - The date and time of the event.

* @property accessLink - The URL to access the event.

*

* Corresponds to: "a set of Events with a name String, a DateTime, an accessLink URL"

*/

interface EventDoc {

_id: EventID;

name: string;

date: DateTime;

accessLink: URL;

}

  

/**

* @concept StreamedEvents

* @purpose Stores events associated with an item and a URL to access for the events.

* @principle Users could associate items with events and quickly access each event with a URL.

*/

export default class StreamedEventsConcept {

private itemsCollection: Collection<ItemDoc>;

private eventsCollection: Collection<EventDoc>;

  

constructor(private readonly db: Db) {

this.itemsCollection = this.db.collection(PREFIX + "items");

this.eventsCollection = this.db.collection(PREFIX + "events");

}

  

/**

* @action addItem

* @param {object} args - The arguments for the action.

* @param {Item} args.item - The identifier of the item to add.

* @requires The item is not already associated with a set of events.

* @effects Adds the item with an empty set of events.

* @returns {Promise<Empty | { error: string }>} An empty object on success, or an error object.

*/

async addItem({ item }: { item: Item }): Promise<Empty | { error: string }> {

const existingItem = await this.itemsCollection.findOne({ _id: item });

if (existingItem) {

return { error: `Item '${item}' is already associated.` };

}

await this.itemsCollection.insertOne({ _id: item, events: [] });

return {};

}

  

/**

* @action associateItem

* @param {object} args - The arguments for the action.

* @param {Item} args.item - The identifier of the item.

* @param {EventID} args.event - The identifier of the event to associate.

* @requires The event must exist AND the item must already exist.

* @effects Adds the event to the item's set of Events.

* @returns {Promise<Empty | { error: string }>} An empty object on success, or an error object.

*/

async associateItem(

{ item, event }: { item: Item; event: EventID },

): Promise<Empty | { error: string }> {

// Requires: The event must exist.

const eventExists = await this.eventsCollection.findOne({ _id: event });

if (!eventExists) {

return { error: `Event with ID '${event}' does not exist.` };

}

  

// Requires: The item must already exist.

const itemDoc = await this.itemsCollection.findOne({ _id: item });

if (!itemDoc) {

return { error: `Item with ID '${item}' does not exist. Use 'addItem' first.` };

}

  

// Effects: Adds the event to the item's set of Events.

// Use $addToSet to ensure no duplicate event IDs in the array.

await this.itemsCollection.updateOne(

{ _id: item },

{ $addToSet: { events: event } },

);

return {};

}

  

/**

* @action addEvent

* @param {object} args - The arguments for the action.

* @param {string} args.name - The name of the new event.

* @param {DateTime} args.date - The date and time of the new event.

* @param {URL} args.accessLink - The access link for the new event.

* @requires No event with the same name and date already exists.

* @effects Creates a new event with the given name, date, and access link.

* @returns {Promise<{ event: EventID } | { error: string }>} The ID of the newly created event on success, or an error object.

*/

async addEvent(

{ name, date, accessLink }: { name: string; date: DateTime; accessLink: URL },

): Promise<{ event: EventID } | { error: string }> {

// Check if an event with the same name and date already exists to enforce uniqueness.

const existingEvent = await this.eventsCollection.findOne({ name, date });

if (existingEvent) {

return { error: `An event named '${name}' at '${date.toISOString()}' already exists.` };

}

  

const newEventId = freshID();

await this.eventsCollection.insertOne({

_id: newEventId,

name,

date,

accessLink,

});

return { event: newEventId };

}

  

/**

* @action removeEvent

* @param {object} args - The arguments for the action.

* @param {string} args.name - The name of the event to remove.

* @param {DateTime} args.date - The date and time of the event to remove.

* @requires The event must exist.

* @effects Removes the specified event and de-associates it from all items.

* @returns {Promise<Empty | { error: string }>} An empty object on success, or an error object.

*/

async removeEvent(

{ name, date }: { name: string; date: DateTime },

): Promise<Empty | { error: string }> {

const eventToRemove = await this.eventsCollection.findOne({ name, date });

if (!eventToRemove) {

return { error: `Event named '${name}' at '${date.toISOString()}' not found.` };

}

  

// Remove the event from the events collection.

await this.eventsCollection.deleteOne({ _id: eventToRemove._id });

  

// Remove the event's ID from the 'events' array of all items that reference it.

await this.itemsCollection.updateMany(

{ events: eventToRemove._id },

{ $pull: { events: eventToRemove._id } },

);

return {};

}

  

/**

* @action editEventTime

* @param {object} args - The arguments for the action.

* @param {string} args.name - The name of the event.

* @param {DateTime} args.olddate - The current date and time of the event.

* @param {DateTime} args.newdate - The new date and time for the event.

* @requires An event with the given name and olddate must exist.

* @effects Updates the event's date to the new date.

* @returns {Promise<Empty | { error: string }>} An empty object on success, or an error object.

*/

async editEventTime(

{ name, olddate, newdate }: { name: string; olddate: DateTime; newdate: DateTime },

): Promise<Empty | { error: string }> {

const existingEvent = await this.eventsCollection.findOne({ name, date: olddate });

if (!existingEvent) {

return { error: `Event named '${name}' at '${olddate.toISOString()}' not found.` };

}

  

// Update the event's date.

await this.eventsCollection.updateOne(

{ _id: existingEvent._id },

{ $set: { date: newdate } },

);

return {};

}

  

/**

* @action editEventURL

* @param {object} args - The arguments for the action.

* @param {string} args.name - The name of the event.

* @param {DateTime} args.date - The date and time of the event.

* @param {URL} args.newURL - The new access link for the event.

* @requires An event with the given name and date must exist.

* @effects Updates the event's access link to the new URL.

* @returns {Promise<Empty | { error: string }>} An empty object on success, or an error object.

*/

async editEventURL(

{ name, date, newURL }: { name: string; date: DateTime; newURL: URL },

): Promise<Empty | { error: string }> {

const existingEvent = await this.eventsCollection.findOne({ name, date });

if (!existingEvent) {

return { error: `Event named '${name}' at '${date.toISOString()}' not found.` };

}

  

// Update the event's accessLink.

await this.eventsCollection.updateOne(

{ _id: existingEvent._id },

{ $set: { accessLink: newURL } },

);

return {};

}

  

// --- Queries (for testing and direct state observation) ---

  

/**

* @query _getItemEvents

* @param {object} args - The arguments for the query.

* @param {Item} args.item - The identifier of the item.

* @effects Returns the list of full event details associated with a given item.

* @returns {Promise<EventDoc[] | { error: string }>} An array of event documents, or an error object.

*/

async _getItemEvents({ item }: { item: Item }): Promise<EventDoc[] | { error: string }> {

const itemDoc = await this.itemsCollection.findOne({ _id: item });

if (!itemDoc) {

return { error: `Item '${item}' not found.` };

}

const eventIds = itemDoc.events;

// Find all event documents whose IDs are in the item's events list.

const events = await this.eventsCollection.find({ _id: { $in: eventIds } }).toArray();

return events;

}

  

/**

* @query _getEventDetails

* @param {object} args - The arguments for the query.

* @param {EventID} args.eventId - The identifier of the event.

* @effects Returns the full details of a specific event by its ID.

* @returns {Promise<EventDoc | { error: string }>} An event document, or an error object.

*/

async _getEventDetails({ eventId }: { eventId: EventID }): Promise<EventDoc | { error: string }> {

const eventDoc = await this.eventsCollection.findOne({ _id: eventId });

if (!eventDoc) {

return { error: `Event with ID '${eventId}' not found.` };

}

return eventDoc;

}

  

/**

* @query _findEventsByNameAndDate

* @param {object} args - The arguments for the query.

* @param {string} args.name - The name of the event.

* @param {DateTime} args.date - The date and time of the event.

* @effects Returns an event document matching the given name and date.

* @returns {Promise<EventDoc | { error: string }>} An event document, or an error object.

*/

async _findEventsByNameAndDate({ name, date }: { name: string; date: DateTime }): Promise<EventDoc | { error: string }> {

const eventDoc = await this.eventsCollection.findOne({ name, date });

if (!eventDoc) {

return { error: `Event named '${name}' at '${date.toISOString()}' not found.` };

}

return eventDoc;

}

}
```

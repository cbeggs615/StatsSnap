---
timestamp: 'Mon Oct 20 2025 13:21:42 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_132142.e803f637.md]]'
content_id: 2b6a13b2686a0baada3ee242d486821af73df1e5ba293481f3e912311f808386
---

# API Specification: StreamedEvents Concept

**Purpose:** Stores events associated with an item and a URL to access for the events

***

## API Endpoints

### POST /api/StreamedEvents/addItem

**Description:** Adds an item to the concept's state with an empty set of associated events.

**Requirements:**

* item is not already associated with set of events

**Effects:**

* adds item with empty set of events

**Request Body:**

```json
{
  "item": "string"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/StreamedEvents/associateItem

**Description:** Associates an existing event with a specified item.

**Requirements:**

* event exists

**Effects:**

* adds event to item's set of Events

**Request Body:**

```json
{
  "item": "string",
  "event": "string"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/StreamedEvents/addEvent

**Description:** Creates a new event with a given name, date, and access link.

**Requirements:**

* no event with that name at date already exists

**Effects:**

* creates event with name for date and with accessLink

**Request Body:**

```json
{
  "name": "string",
  "date": "string",
  "accessLink": "string"
}
```

**Success Response Body (Action):**

```json
{
  "event": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/StreamedEvents/removeEvent

**Description:** Removes an event identified by its name and date, and disassociates it from any items.

**Requirements:**

* event exists

**Effects:**

* removes event for date and removes event from any item

**Request Body:**

```json
{
  "name": "string",
  "date": "string"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/StreamedEvents/editEventTime

**Description:** Updates the date of an existing event identified by its name and old date.

**Requirements:**

* event exists with name and olddate

**Effects:**

* updates name's event date to newdate

**Request Body:**

```json
{
  "name": "string",
  "olddate": "string",
  "newdate": "string"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/StreamedEvents/editEventURL

**Description:** Updates the access URL of an existing event identified by its name and date.

**Requirements:**

* event exists with name and date

**Effects:**

* updates name's event accessLink to newURL

**Request Body:**

```json
{
  "name": "string",
  "date": "string",
  "newURL": "string"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

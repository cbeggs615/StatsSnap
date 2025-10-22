[@api-extraction-from-code](../api-extraction-from-code.md)

[@api-extraction-from-spec](../api-extraction-from-spec.md)

[@implementation](../../concepts/ItemTracking/implementation.md)

[@ItemTracking](../../concepts/ItemTracking/ItemTracking.md)
# prompt: Using the concept implementation linked, follow the prompt in api-extraction-from-code .
# response:

# API Specification: ItemTracking Concept

**Purpose:** record which items a user chooses to keep track of

---

## API Endpoints

### POST /api/ItemTracking/addUserRecord

**Description:** Creates a new user tracking record.

**Requirements:**
- no UserRecord already for user already exists

**Effects:**
- creates a new UserRecord for user with an empty set of items

**Request Body:**
```json
{
  "user": "ID"
}
```

**Success Response Body (Action):**
```json
{
  "userRecord": "ID"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/ItemTracking/addItem

**Description:** Adds an item to a user's tracking list.

**Requirements:**
- a UserRecord exists for user
- item is not already in that user's set of items

**Effects:**
- adds item to user's UserRecord's set of items

**Request Body:**
```json
{
  "user": "ID",
  "item": "ID"
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

---

### POST /api/ItemTracking/removeItem

**Description:** Removes an item from a user's tracking list.

**Requirements:**
- a UserRecord exists for user
- item is in user's set of items

**Effects:**
- removes item from user's UserRecord's set of items

**Request Body:**
```json
{
  "user": "ID",
  "item": "ID"
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

---

### POST /api/ItemTracking/_getItemsTrackedByUser

**Description:** Retrieves all items a specific user is tracking.

**Requirements:**
- A UserRecord for the user must exist.

**Effects:**
- returns the list of items tracked by a given user

**Request Body:**
```json
{
  "user": "ID"
}
```

**Success Response Body (Query):**
```json
[
  {
    "items": "ID[]"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/ItemTracking/_getUsersTrackingItem

**Description:** Retrieves all users who are tracking a specific item.

**Requirements:**
- (No specific requirements leading to an error response, an empty list is returned if no users track the item.)

**Effects:**
- returns the list of users tracking a given item

**Request Body:**
```json
{
  "item": "ID"
}
```

**Success Response Body (Query):**
```json
[
  {
    "users": "ID[]"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---
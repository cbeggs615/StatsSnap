---
timestamp: 'Wed Oct 15 2025 10:19:05 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251015_101905.c3ab3c33.md]]'
content_id: 5854b5172177bbc6860962d18e7597cd8158a59446a5a46e075e3b6f23152c90
---

# response:

```typescript
// file: src/ItemTracking/ItemTrackingConcept.ts

import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
// No freshID needed here as User and Item IDs are external, and UserRecord _id is derived from User.

// Declare collection prefix, use concept name
const PREFIX = "ItemTracking" + ".";

// Generic types of this concept, treated polymorphically as IDs
type User = ID;
type Item = ID;

/**
 * Represents a record for a user, containing the items they are tracking.
 * Corresponds to "a set of UserRecords with a User and a set of Items" in the spec.
 * The `_id` of this document is the `User` ID itself.
 */
interface UserRecordDoc {
  _id: User; // The ID of the user whose items are being tracked
  items: Item[]; // A list of item IDs that this user is tracking
}

/**
 * @concept ItemTracking
 * @purpose record which items a user chooses to keep track of
 * @principle a user selects items that they want to follow; system keeps these associated with the user
 */
export default class ItemTrackingConcept {
  private userRecords: Collection<UserRecordDoc>;

  constructor(private readonly db: Db) {
    this.userRecords = this.db.collection(PREFIX + "userRecords");
  }

  /**
   * @action addUserRecord
   * @requires no UserRecord already for user already exists
   * @effects creates a new UserRecord for user with an empty set of items
   * @param {object} args - The arguments for the action.
   * @param {User} args.user - The ID of the user for whom to create a record.
   * @returns {{ userRecord: User } | { error: string }} The ID of the created user record or an error.
   */
  async addUserRecord(
    { user }: { user: User },
  ): Promise<{ userRecord: User } | { error: string }> {
    // Check precondition: no UserRecord already exists for user
    const existingRecord = await this.userRecords.findOne({ _id: user });
    if (existingRecord) {
      return { error: `UserRecord for user ${user} already exists.` };
    }

    // Effect: creates a new UserRecord for user with an empty set of items
    const newUserRecord: UserRecordDoc = {
      _id: user,
      items: [],
    };
    await this.userRecords.insertOne(newUserRecord);

    return { userRecord: user };
  }

  /**
   * @action addItem
   * @requires a UserRecord exists for user, item is not already in that user's set of items
   * @effects adds item to user's UserRecord's set of items
   * @param {object} args - The arguments for the action.
   * @param {User} args.user - The ID of the user.
   * @param {Item} args.item - The ID of the item to add.
   * @returns {Empty | { error: string }} An empty object on success or an error.
   */
  async addItem(
    { user, item }: { user: User; item: Item },
  ): Promise<Empty | { error: string }> {
    // Check precondition: a UserRecord exists for user
    const userRecord = await this.userRecords.findOne({ _id: user });
    if (!userRecord) {
      return { error: `UserRecord for user ${user} not found.` };
    }

    // Check precondition: item is not already in that user's set of items
    if (userRecord.items.includes(item)) {
      return { error: `Item ${item} is already tracked by user ${user}.` };
    }

    // Effect: adds item to user's UserRecord's set of items
    await this.userRecords.updateOne(
      { _id: user },
      { $addToSet: { items: item } }, // $addToSet prevents duplicates, although we pre-check
    );

    return {};
  }

  /**
   * @action removeItem
   * @requires a UserRecord exists for user, item is in user's set of items
   * @effects removes item from user's UserRecord's set of items
   * @param {object} args - The arguments for the action.
   * @param {User} args.user - The ID of the user.
   * @param {Item} args.item - The ID of the item to remove.
   * @returns {Empty | { error: string }} An empty object on success or an error.
   */
  async removeItem(
    { user, item }: { user: User; item: Item },
  ): Promise<Empty | { error: string }> {
    // Check precondition: a UserRecord exists for user
    const userRecord = await this.userRecords.findOne({ _id: user });
    if (!userRecord) {
      return { error: `UserRecord for user ${user} not found.` };
    }

    // Check precondition: item is in user's set of items
    if (!userRecord.items.includes(item)) {
      return { error: `Item ${item} is not tracked by user ${user}.` };
    }

    // Effect: removes item from user's UserRecord's set of items
    await this.userRecords.updateOne(
      { _id: user },
      { $pull: { items: item } },
    );

    return {};
  }

  /**
   * @query _getItemsTrackedByUser
   * @effects returns the list of items tracked by a given user
   * @param {object} args - The arguments for the query.
   * @param {User} args.user - The ID of the user.
   * @returns {{ items: Item[] } | { error: string }} The list of items or an error.
   */
  async _getItemsTrackedByUser(
    { user }: { user: User },
  ): Promise<{ items: Item[] } | { error: string }> {
    const userRecord = await this.userRecords.findOne({ _id: user });
    if (!userRecord) {
      // In a query, it might be more appropriate to return an empty list or specific status
      // rather than an error for "not found", depending on expected behavior.
      // For consistency with action error returns, we'll return an error here.
      return { error: `UserRecord for user ${user} not found.` };
    }
    return { items: userRecord.items };
  }

  /**
   * @query _getUsersTrackingItem
   * @effects returns the list of users tracking a given item
   * @param {object} args - The arguments for the query.
   * @param {Item} args.item - The ID of the item.
   * @returns {{ users: User[] }} The list of users tracking the item.
   */
  async _getUsersTrackingItem(
    { item }: { item: Item },
  ): Promise<{ users: User[] }> {
    const userRecords = await this.userRecords.find({ items: item }).toArray();
    const users = userRecords.map((record) => record._id);
    return { users };
  }
}
```

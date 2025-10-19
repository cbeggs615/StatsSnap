---
timestamp: 'Wed Oct 15 2025 10:24:29 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251015_102429.719d5d42.md]]'
content_id: cf99d9fe69064d5a07ac98eeacd9f203556e3ab6f9e20ea2d1ac8df1decf3137
---

# response:

```python
import unittest

# Define User and Item types for clarity in tests
User = str
Item = str

class ItemTrackingSystem:
    """
    A conceptual implementation of the ItemTracking system for testing.
    The 'state' is represented as a dictionary mapping User to a set of Items.
    """
    def __init__(self):
        self._user_records: dict[User, set[Item]] = {}

    def _get_user_record(self, user: User) -> set[Item]:
        """Helper to get a user's item set, raises error if user not found."""
        if user not in self._user_records:
            raise ValueError(f"UserRecord for '{user}' does not exist.")
        return self._user_records[user]

    def get_state(self) -> dict[User, set[Item]]:
        """Returns a deep copy of the current state for inspection."""
        return {user: current_items.copy() for user, current_items in self._user_records.items()}

    def addUserRecord(self, user: User):
        """
        **requires** no UserRecord already for user already exists
        **effects** creates a new UserRecord for user with an empty set of items
        """
        if user in self._user_records:
            raise ValueError(f"UserRecord for '{user}' already exists.")
        self._user_records[user] = set()
        # Returns the user record as per concept, but for testing, we just modify state
        # In a real system, it might return an ID or the created object.

    def addItem(self, user: User, item: Item):
        """
        **requires** a UserRecord exists for user, item is not already in that user's set of items
        **effects** adds item to user's UserRecord's set of items
        """
        user_items = self._get_user_record(user) # This checks 'UserRecord exists for user'
        if item in user_items:
            raise ValueError(f"Item '{item}' is already tracked by user '{user}'.")
        user_items.add(item)

    def removeItem(self, user: User, item: Item):
        """
        **requires** a UserRecord exists for user, item is in user's set of items
        **effects** removes item to user's UserRecord's set of items
        """
        user_items = self._get_user_record(user) # This checks 'UserRecord exists for user'
        if item not in user_items:
            raise ValueError(f"Item '{item}' is not tracked by user '{user}'.")
        user_items.remove(item)


class TestItemTracking(unittest.TestCase):
    def setUp(self):
        """
        Set up a fresh ItemTrackingSystem for each test.
        """
        self.system = ItemTrackingSystem()

    # --- addUserRecord Tests ---

    def test_addUserRecord_success(self):
        """
        GIVEN an empty system
        WHEN a user record is added
        THEN the system should contain a record for that user with an empty item set.
        """
        self.system.addUserRecord("Alice")
        expected_state = {"Alice": set()}
        self.assertEqual(self.system.get_state(), expected_state)

    def test_addUserRecord_duplicate_user_fails(self):
        """
        GIVEN a system with an existing user record
        WHEN attempting to add the same user again
        THEN it should raise an error, and the state should remain unchanged.
        """
        self.system.addUserRecord("Alice")
        initial_state = self.system.get_state()
        with self.assertRaisesRegex(ValueError, "UserRecord for 'Alice' already exists."):
            self.system.addUserRecord("Alice")
        self.assertEqual(self.system.get_state(), initial_state) # State should not change

    # --- addItem Tests ---

    def test_addItem_success(self):
        """
        GIVEN a system with a user record
        WHEN an item is added to that user
        THEN the item should be associated with the user.
        """
        self.system.addUserRecord("Alice")
        self.system.addItem("Alice", "BookA")
        expected_state = {"Alice": {"BookA"}}
        self.assertEqual(self.system.get_state(), expected_state)

    def test_addItem_to_non_existent_user_fails(self):
        """
        GIVEN an empty system
        WHEN attempting to add an item to a non-existent user
        THEN it should raise an error, and the state should remain unchanged.
        """
        initial_state = self.system.get_state()
        with self.assertRaisesRegex(ValueError, "UserRecord for 'Bob' does not exist."):
            self.system.addItem("Bob", "BookB")
        self.assertEqual(self.system.get_state(), initial_state)

    def test_addItem_duplicate_item_for_user_fails(self):
        """
        GIVEN a system where a user is already tracking an item
        WHEN attempting to add the same item again to that user
        THEN it should raise an error, and the user's item set should remain unchanged.
        """
        self.system.addUserRecord("Alice")
        self.system.addItem("Alice", "BookA")
        initial_user_items = self.system.get_state()["Alice"].copy() # Get copy of set
        with self.assertRaisesRegex(ValueError, "Item 'BookA' is already tracked by user 'Alice'."):
            self.system.addItem("Alice", "BookA")
        self.assertEqual(self.system.get_state()["Alice"], initial_user_items)

    # --- removeItem Tests ---

    def test_removeItem_success(self):
        """
        GIVEN a system where a user is tracking an item
        WHEN that item is removed from the user
        THEN the item should no longer be associated with the user.
        """
        self.system.addUserRecord("Alice")
        self.system.addItem("Alice", "BookA")
        self.system.addItem("Alice", "BookB")
        self.system.removeItem("Alice", "BookA")
        expected_state = {"Alice": {"BookB"}}
        self.assertEqual(self.system.get_state(), expected_state)

    def test_removeItem_from_non_existent_user_fails(self):
        """
        GIVEN an empty system
        WHEN attempting to remove an item from a non-existent user
        THEN it should raise an error, and the state should remain unchanged.
        """
        initial_state = self.system.get_state()
        with self.assertRaisesRegex(ValueError, "UserRecord for 'Bob' does not exist."):
            self.system.removeItem("Bob", "BookA")
        self.assertEqual(self.system.get_state(), initial_state)

    def test_removeItem_not_tracked_by_user_fails(self):
        """
        GIVEN a system where a user exists but is not tracking a specific item
        WHEN attempting to remove that item from the user
        THEN it should raise an error, and the user's item set should remain unchanged.
        """
        self.system.addUserRecord("Alice")
        self.system.addItem("Alice", "BookA")
        initial_user_items = self.system.get_state()["Alice"].copy()
        with self.assertRaisesRegex(ValueError, "Item 'BookB' is not tracked by user 'Alice'."):
            self.system.removeItem("Alice", "BookB")
        self.assertEqual(self.system.get_state()["Alice"], initial_user_items)

    # --- Combination/Integration Tests ---

    def test_multiple_users_and_items(self):
        """
        GIVEN a system
        WHEN multiple users and items are added and removed
        THEN the state should accurately reflect all operations, maintaining user-specific tracking.
        """
        # Add Alice and items
        self.system.addUserRecord("Alice")
        self.system.addItem("Alice", "BookA")
        self.system.addItem("Alice", "BookB")

        # Add Bob and items
        self.system.addUserRecord("Bob")
        self.system.addItem("Bob", "BookC")
        self.system.addItem("Bob", "BookD")

        # Alice removes an item
        self.system.removeItem("Alice", "BookA")

        # Expected final state
        expected_state = {
            "Alice": {"BookB"},
            "Bob": {"BookC", "BookD"}
        }
        self.assertEqual(self.system.get_state(), expected_state)

    def test_empty_item_set_after_removal(self):
        """
        GIVEN a user tracking a single item
        WHEN that item is removed
        THEN the user's item set should become empty.
        """
        self.system.addUserRecord("Charlie")
        self.system.addItem("Charlie", "Pen")
        self.system.removeItem("Charlie", "Pen")
        expected_state = {"Charlie": set()}
        self.assertEqual(self.system.get_state(), expected_state)

# To run the tests, you would typically use:
# if __name__ == '__main__':
#     unittest.main()
```

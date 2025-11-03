# concept ItemTracking
**concept** ItemTracking[User, Item]
**purpose** record which items a user chooses to keep track of
**principle** a user selects items that they want to follow; system keeps these associated with the user
**state**
       a set of UserRecords with ...
             a User
             a set of Items
**actions**
       addUserRecord (user: User): (userRecord: UserRecord)
             **requires** no UserRecord already for user already exists
             **effects** creates a new UserRecord for user with an empty set of items
       deleteUserRecord (user: User):
             **requires** UserRecord already for user already exists
             **effects** deletes the UserRecord for user
       addItem (user: User, item: Item):
             **requires** a UserRecord exists for user, item is not already in that user's set of items
             **effects** adds item to user's UserRecord's set of items
       removeItem (user: User, item: Item):
             **requires** a UserRecord exists for user, item is in user's set of items
             **effects** removes item to user's UserRecord's set of items

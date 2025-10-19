# concept: PasswordAuth
**concept** PasswordAuth

**purpose** enables users to securely identify themselves and manage their access through username and password credentials.

**principle** If a user registers with a unique username and password, then they can later provide those same credentials to be authenticated as that user, thereby gaining access to associated functionality.

**state**
  a set of Users with
    a username String
    a password String

**actions**

  register (username: String, password: String): (user: User)
    **requires** no User currently exists with the given `username`.
    **effects** A new User is created, associated with the provided `username` and `password`. The identifier of this new `User` is returned.

  authenticate (username: String, password: String): 
    **requires** A User exists whose `username` matches the input `username` and whose `password` matches the input `password`

  deleteAccount (username: String, password: String):
    **requires** A User exists whose `username` matches the input `username` and whose `password` matches the input `password`.
    **effects** The User associated with the given `username` is deleted, along with their `username` and `password` association. 

  changePassword (username: String, currentPass: String, newPass: String): 
    **requires** A User exists whose `username` matches the input `username` and whose `password` matches the `currentPass`.
    **effects** The `password` of the User associated with the given `username` is updated to `newPass. 
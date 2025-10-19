### User Profile/Authorization
**concept** PasswordAuth  
**purpose** allows users to create profiles that are secured with a username and password
**principle** each user creates a profile with login credentials  
**state**  
       a set of Users with...  
             a username String  
             a password String  
**actions**  
      register (username: String, password: String): (user: User)  
             **requires** no User exists with that username  
             **effects** creates and returns a new User with username and password  
      authenticate (username: String, password: String): (user: User)  
             **requires** a User with this username exists and its password matches the inputted password
	deleteAccount (username: String, password: String):
	 **requires** a User with this username exists and its password matches the inputted password
	 **effects** User associated with this username is deleted
 changePassword(username: String, currentPass: String, newPass: String):
	**requires** a User with this username exists and its password matches currentPass
	**effects** User associated with this username has password updated to newPass

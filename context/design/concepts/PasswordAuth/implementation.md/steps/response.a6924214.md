---
timestamp: 'Sun Oct 19 2025 10:24:12 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_102412.39798b4d.md]]'
content_id: a6924214b88876f677894e1c3216f7cd51365d705e71ba9a966a613374528072
---

# response:

Yes, it **does matter**, and **removing `[Hash]` from the concept specification would actually improve its alignment** with the principles of concept design and the provided implementation.

Here's why:

1. **Role of Type Parameters in Concept Design:**
   The document explicitly states: "These type parameters are for the types of objects that are created externally to the concept, and must be treated completely polymorphically by the concept (that is, the concept can't assume that they have any properties at all and can only be compared to determine if two instances of the type are the same identifier/reference and thus represent the same object)."

2. **How `PasswordAuth` Handles Passwords:**
   * The `PasswordAuth` concept's actions (`register`, `authenticate`, `changePassword`, `deleteAccount`) all take `password: String` as an input. This is a plaintext string.
   * The concept *then internally* hashes this string using PBKDF2, generates a salt, and stores these details in its own `PasswordAuthUser` state.
   * It does **not** receive an external object of type `Hash` from a caller, nor does it return an opaque `Hash` object. The hashing mechanism is entirely self-contained within the `PasswordAuth` concept.

3. **Implication of `concept PasswordAuth [Hash]`:**
   If `Hash` were a type parameter, it would imply that `PasswordAuth` expects to receive or produce values of an *external, opaque type* called `Hash`, similar to how `Comment [User, Target]` expects `User` and `Target` to be external, opaque identifiers. This is not how the implementation works; the hashing is an *internal detail* of the `PasswordAuth` concept itself.

4. **Improved Alignment Without `[Hash]`:**
   * The concept *does* deal with `User` IDs, which are external and opaque (`type User = ID;` in the implementation). So, `concept PasswordAuth [User]` would be a more accurate and consistent type parameter declaration if you wished to formally declare the external polymorphic types it uses.
   * However, the state description "a set of Users with..." already implies the existence of a `User` type. Given that `User` is returned by `register` (e.g., `(user: User)`), it's already an understood generic identifier.

**Conclusion:**

The implementation implicitly treats the hashing mechanism as an internal responsibility of the `PasswordAuth` concept. Therefore, including `[Hash]` as a generic type parameter in the concept specification is **unnecessary and inconsistent** with the definition of type parameters in concept design. Removing it would make the specification more accurate in reflecting the self-contained nature of its password management.

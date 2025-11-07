import { ItemTracking, Requesting, Sessioning } from "@concepts";
import { actions, Sync } from "@engine";



export const AddItemRequest: Sync = ({ request, session, item, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/ItemTracking/addItem", session, item },
    { request },
  ]),
  where: (frames) => {
    // console.log("🧩 running _getUser for session", session);
    return frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([
    ItemTracking.addItem,
    { user, item },
  ]),
});


// =====================================================
// ✅ Respond to success
// =====================================================

export const AddItemResponseSuccess: Sync = ({ request, item }) => ({
  when: actions(
    [Requesting.request, { path: "/ItemTracking/addItem", item }, { request }],
    [ItemTracking.addItem, {}, {}],
  ),
  then: actions([Requesting.respond, { request, success: true, item }]),
});

// =====================================================
// ❌ Respond to error
// =====================================================

export const AddItemResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/ItemTracking/addItem" }, { request }],
    [ItemTracking.addItem, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});


// remove

export const RemoveItemRequest: Sync = ({ request, session, item, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/ItemTracking/removeItem", session, item },
    { request },
  ]),
  where: (frames) => {
    console.log("🧩 running _getUser for session", session);
    return frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([
    ItemTracking.removeItem,
    { user, item },
  ]),
});


// =====================================================
// ✅ Respond to success
// =====================================================
export const RemoveItemResponseSuccess: Sync = ({ request, item }) => ({
  when: actions(
    [Requesting.request, { path: "/ItemTracking/removeItem", item }, { request }],
    [ItemTracking.removeItem, {}, {}],
  ),
  then: actions([Requesting.respond, { request, success: true, item }]),
});


// =====================================================
// ❌ Respond to error
// =====================================================
export const RemoveItemResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/ItemTracking/removeItem" }, { request }],
    [ItemTracking.removeItem, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});


export const GetItemsTrackedByUserRequest: Sync = (
  { request, session, user, item, results }
) => ({
  when: actions([
    Requesting.request,
    { path: "/ItemTracking/_getItemsTrackedByUser", session },
    { request }
  ]),

  where: async (frames) => {

    // Step 1️⃣: Resolve user from session
    frames = await frames.query(Sessioning._getUser, { session }, { user });

    // Step 2️⃣: Query all items tracked by that user
    frames = await frames.query(ItemTracking._getItemsTrackedByUser, { user }, { item });

    if (frames.length === 0) {
        console.log("⚠️ No tracked items found — injecting empty frame so collectAs works");
        frames.push({ [item]: null }); // add a dummy frame binding
    }

    const collected = frames.collectAs ? frames.collectAs([user, item], results) : frames;
    return collected;
  },

  then: actions([
    Requesting.respond,
    { request, results }
  ])
});

import { ItemTracking, Requesting } from "@concepts";
import { actions, Sync } from "@engine";

export const AddItemRequest: Sync = ({ request, author, itemName }) => ({
  when: actions([
    Requesting.request,
    { path: "/ItemTracking/addItem", author, itemName },
    { request },
  ]),
  then: actions([ItemTracking.addItem, { user: author, itemName }]),
});

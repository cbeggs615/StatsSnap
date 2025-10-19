---
timestamp: 'Thu Oct 16 2025 22:15:47 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_221547.585a03db.md]]'
content_id: ac91dc14e4990dbd6edc1580938a287ddb00182497001c4cabdde22b8852fa2d
---

# concept: StreamedEvents

**concept** StreamedEvents\[Item, URL]\
**purpose** Stores events associated with an item and a URL to access for the events\
**principle** users could associate items with events and quickly access each event with a URL\
**state**\
       a set of Items with ...\
             a set of Events\
       a set of Events with ...\
             a name String\
             a DateTime\
             an accessLink URL

**actions**\
       addItem (item: Item):\
             **requires** item is not already associated with set of events\
             **effects** adds item with empty set of events\
       associateItem (item: Item, event: Event):\
             **requires** event exists\
             **effects** adds event to item's set of Events\
       addEvent (name: String, date: DateTime, accessLink: URL): (event: Event)\
             **requires** no event with that name at date already exists\
             **effects** creates event with name for date and with accessLink\
       removeEvent (name: String, date: DateTime):\
             **requires** event exists\
             **effects** removes event for date and removes event from any item\
       editEventTime (name: String, olddate: DateTime, newdate: DateTime):\
             **requires** event exists with name and olddate\
             **effects** updates name's event date to newdate\
       editEventURL (name: String, date: DateTime, newURL: URL):\
             **requires** event exists with name and date\
             **effects** updates name's event accessLink to newURL

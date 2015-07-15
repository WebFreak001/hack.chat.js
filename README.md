# hack.chat.js
API wrapper for hack.chat using ws package

## Usage

```js
var HackChat = require("hack-chat");
var chat = new HackChat(); // Client group for multiple channels
chat.join("lobby", "TestUser");
var programmingSession = chat.join("programming", "TestUser");

chat.on("onlineSet", function(session, users) {
    // Each event from a group contains a session argument as first argument
    console.log("Users online in ?" + session.channel + ": " + users.join(", "));
});

chat.on("chat", function(session, nick, text) {
    console.log(nick + "@" + session.channel + ": " + text);

    if (session.channel != "programming") {
        programmingSession.sendMessage("Quote from ?" + session.channel + ": " + text);
    }
});
```

## HackChat.Session events

**All HackChat events are the same as the HackChat.Session events with the exception that the session where it got emitted from is the first argument**

### `.on("joining")`

**Description:** Emitted when sending the join request.

**Arguments:** None

### `.on("left")`

**Description:** Emitted when disconnected from WebSocket.

**Arguments:** None

### `.on("chat")`

**Description:** Emitted when someone sends a regular message.

**Arguments:**
* `nick` (String)
* `text` (String)
* `time` (Number, Unix Time)
* `isAdmin` (Boolean)

### `.on("info")`

**Description:** Emitted when some unhandled info event passes through.

**Arguments:**
* `text` (String)
* `time` (Number, Unix Time)

### `.on("infoRaw")`

**Description:** Emitted when any info event occurs. Will also trigger if it gets handled.

**Arguments:**
* `text` (String)
* `time` (Number, Unix Time)

### `.on("warn")`

**Description:** Emitted when some unhandled warn event passes through.

**Arguments:**
* `text` (String)
* `time` (Number, Unix Time)

### `.on("warnRaw")`

**Description:** Emitted when any warn event occurs. Will also trigger if it gets handled.

**Arguments:**
* `text` (String)
* `time` (Number, Unix Time)

### `.on("ratelimit")`

**Description:** Emitted when server is sending IP ratelimit warning. Will cancel regular warn event.

**Arguments:**
* `time` (Number, Unix Time)

### `.on("banned")`

**Description:** Emitted when admin is banning the user. Will cancel regular warn event.

**Arguments:**
* `time` (Number, Unix Time)

### `.on("nicknameInvalid")`

**Description:** Emitted when nickname trying to join with is invalid ("!", "$", "?", etc.) Will cancel regular warn event.

**Arguments:**
* `time` (Number, Unix Time)

### `.on("nicknameTaken")`

**Description:** Emitted when nickname trying to join with is already taken. Will cancel regular warn event.

**Arguments:**
* `time` (Number, Unix Time)

### `.on("invited")`

**Description:** Emitted when WebSocket successfully invited someone. Will cancel regular info event.

**Arguments:**
* `nick` (String)
* `channel` (String)
* `time` (Number, Unix Time)

### `.on("invitation")`

**Description:** Emitted when someone invited WebSocket. Will cancel regular info event.

**Arguments:**
* `nick` (String)
* `channel` (String)
* `time` (Number, Unix Time)

### `.on("onlineSet")`

**Description:** Emitted when successfully joined. Will contain an array of users.

**Arguments:**
* `nicks` (String[])
* `time` (Number, Unix Time)

### `.on("onlineAdd")`

**Description:** Emitted when someone joins the channel.

**Arguments:**
* `nick` (String)
* `time` (Number, Unix Time)

### `.on("onlineRemove")`

**Description:** Emitted when someone leaves the channel.

**Arguments:**
* `nick` (String)
* `time` (Number, Unix Time)

### `.on("error")`

**Description:** Emitted when receiving invalid JSON or if WebSocket fails to send.

**Arguments:**
* `exception` (any)

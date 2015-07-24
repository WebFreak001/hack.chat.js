/// <reference path="typings/node/node.d.ts" />
/// <reference path="typings/ws/ws.d.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var WebSocket = require("ws");
var events = require('events');
var inviteRegex = / invited you to \?[a-z0-9]{8}$/;
var HackChatSession = (function (_super) {
    __extends(HackChatSession, _super);
    function HackChatSession(channel, username, password, options) {
        if (options === void 0) { options = { server: "wss://hack.chat/chat-ws" }; }
        _super.call(this);
        this.channel = channel;
        if (password !== undefined)
            username += "#" + password;
        this.username = username;
        this.ws = new WebSocket(options.server || "wss://hack.chat/chat-ws");
        this.ws.on("open", function () {
            this.sendRaw({
                cmd: "join",
                channel: channel,
                nick: username
            });
            this.emit("joining");
        }.bind(this));
        this.ws.on("message", function (data) {
            try {
                var json = JSON.parse(data);
                switch (String(json.cmd)) {
                    case "chat":
                        return this.emit("chat", String(json.nick), String(json.text), json.time || 0, !!json.admin, String(json.trip));
                    case "info":
                        this.emit("infoRaw", String(json.text), json.time || 0);
                        if (inviteRegex.test(json.text))
                            return this.emit("invitation", String(json.text).substr(0, String(json.text).length - 25), String(json.text).substr(-8), json.time || 0);
                        if (json.text.indexOf("You invited") == 0)
                            return this.emit("invited", String(json.text).substr(12, String(json.text).length - 25), String(json.text).substr(-8), json.time || 0);
                        return this.emit("info", String(json.text), json.time || 0);
                    case "warn":
                        this.emit("warnRaw", String(json.text), json.time || 0);
                        if (json.text.indexOf("IP is") != -1)
                            return this.emit("ratelimit", json.time || 0);
                        if (json.text === "Nickname invalid")
                            return this.emit("nicknameInvalid", json.time || 0);
                        if (json.text === "Nickname taken")
                            return this.emit("nicknameTaken", json.time || 0);
                        if (json.text === "You have been banned. :(")
                            return this.emit("banned", json.time || 0);
                        return this.emit("warn", String(json.text), json.time || 0);
                    case "onlineSet":
                        return this.emit(String(json.cmd), json.nicks || [], json.time || 0);
                    case "onlineAdd":
                    case "onlineRemove":
                        return this.emit(String(json.cmd), String(json.nick), json.time || 0);
                }
            }
            catch (e) {
                return this.emit("error", e);
            }
        }.bind(this));
        this.ws.on("close", function () {
            this.emit("left");
        }.bind(this));
    }
    HackChatSession.prototype.sendRaw = function (json) {
        try {
            if (this.ws.readyState == 1) {
                this.ws.send(JSON.stringify(json));
            }
            else {
                this.emit("error", "Not connected.");
            }
        }
        catch (e) {
            this.emit("error", e);
        }
    };
    HackChatSession.prototype.sendMessage = function (msg) {
        this.sendRaw({
            cmd: "chat",
            text: msg
        });
    };
    HackChatSession.prototype.invite = function (user) {
        this.sendRaw({
            cmd: "invite",
            nick: user
        });
    };
    HackChatSession.prototype.ping = function () {
        this.sendRaw({
            cmd: "ping"
        });
    };
    HackChatSession.prototype.leave = function () {
        this.ws.close();
    };
    return HackChatSession;
})(events.EventEmitter);
var HackChat = (function (_super) {
    __extends(HackChat, _super);
    function HackChat() {
        _super.apply(this, arguments);
        this.sessions = [];
    }
    HackChat.prototype.join = function (channel, username, password, options) {
        if (options === void 0) { options = { server: "wss://hack.chat/chat-ws" }; }
        var session = new HackChatSession(channel, username, password, options);
        session.on("joining", function () {
            this.emit("joining", session);
        }.bind(this));
        session.on("left", function () {
            this.emit("left", session);
        }.bind(this));
        session.on("ratelimit", function (time) {
            this.emit("ratelimit", session, time);
        }.bind(this));
        session.on("banned", function (time) {
            this.emit("banned", session, time);
        }.bind(this));
        session.on("nicknameInvalid", function (time) {
            this.emit("nicknameInvalid", session, time);
        }.bind(this));
        session.on("nicknameTaken", function (time) {
            this.emit("nicknameTaken", session, time);
        }.bind(this));
        session.on("invited", function (nick, channel, time) {
            this.emit("invited", session, nick, channel, time);
        }.bind(this));
        session.on("invitation", function (nick, channel, time) {
            this.emit("invitation", session, nick, channel, time);
        }.bind(this));
        session.on("chat", function (nick, text, time, isAdmin, trip) {
            this.emit("chat", session, nick, text, time, isAdmin, trip);
        }.bind(this));
        session.on("info", function (text, time) {
            this.emit("info", session, text, time);
        }.bind(this));
        session.on("warn", function (text, time) {
            this.emit("warn", session, text, time);
        }.bind(this));
        session.on("infoRaw", function (text, time) {
            this.emit("infoRaw", session, text, time);
        }.bind(this));
        session.on("warnRaw", function (text, time) {
            this.emit("warnRaw", session, text, time);
        }.bind(this));
        session.on("onlineSet", function (nicks, time) {
            this.emit("onlineSet", session, nicks, time);
        }.bind(this));
        session.on("onlineAdd", function (nick, time) {
            this.emit("onlineAdd", session, nick, time);
        }.bind(this));
        session.on("onlineRemove", function (nick, time) {
            this.emit("onlineRemove", session, nick, time);
        }.bind(this));
        session.on("error", function (err) {
            this.emit("error", session, err);
        }.bind(this));
        this.sessions.push(session);
        return session;
    };
    HackChat.Session = HackChatSession;
    return HackChat;
})(events.EventEmitter);
module.exports = HackChat;

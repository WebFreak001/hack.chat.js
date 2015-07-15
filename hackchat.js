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
    function HackChatSession(channel, username) {
        _super.call(this);
        this.channel = channel;
        this.username = username;
        var that = this;
        this.ws = new WebSocket("wss://hack.chat/chat-ws");
        this.ws.on("open", function () {
            that.sendRaw({
                cmd: "join",
                channel: channel,
                nick: username
            });
            that.emit("joining");
        });
        this.ws.on("message", function (data) {
            try {
                var json = JSON.parse(data);
                switch (String(json.cmd)) {
                    case "chat":
                        return that.emit("chat", String(json.nick), String(json.text), json.time || 0, !!json.admin);
                    case "info":
                        that.emit("infoRaw", String(json.text), json.time || 0);
                        if (inviteRegex.test(json.text))
                            return that.emit("invitation", String(json.text).substr(0, String(json.text).length - 25), String(json.text).substr(-8), json.time || 0);
                        if (json.text.indexOf("You invited") == 0)
                            return that.emit("invited", String(json.text).substr(12, String(json.text).length - 25), String(json.text).substr(-8), json.time || 0);
                        return that.emit("info", String(json.text), json.time || 0);
                    case "warn":
                        that.emit("warnRaw", String(json.text), json.time || 0);
                        if (json.text.indexOf("IP is") != -1)
                            return that.emit("ratelimit", json.time || 0);
                        if (json.text === "Nickname invalid")
                            return that.emit("nicknameInvalid", json.time || 0);
                        if (json.text === "Nickname taken")
                            return that.emit("nicknameTaken", json.time || 0);
                        if (json.text === "You have been banned. :(")
                            return that.emit("banned", json.time || 0);
                        return that.emit("warn", String(json.text), json.time || 0);
                    case "onlineSet":
                        return that.emit(String(json.cmd), json.nicks || [], json.time || 0);
                    case "onlineAdd":
                    case "onlineRemove":
                        return that.emit(String(json.cmd), String(json.nick), json.time || 0);
                }
            }
            catch (e) {
                return that.emit("error", e);
            }
        });
        this.ws.on("close", function () {
            that.emit("left");
        });
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
    HackChat.prototype.join = function (channel, username) {
        var session = new HackChatSession(channel, username);
        var that = this;
        session.on("joining", function () {
            that.emit("joining", session);
        });
        session.on("left", function () {
            that.emit("left", session);
        });
        session.on("ratelimit", function (time) {
            that.emit("ratelimit", session, time);
        });
        session.on("banned", function (time) {
            that.emit("banned", session, time);
        });
        session.on("nicknameInvalid", function (time) {
            that.emit("nicknameInvalid", session, time);
        });
        session.on("nicknameTaken", function (time) {
            that.emit("nicknameTaken", session, time);
        });
        session.on("invited", function (nick, channel, time) {
            that.emit("invited", session, nick, channel, time);
        });
        session.on("invitation", function (nick, channel, time) {
            that.emit("invitation", session, nick, channel, time);
        });
        session.on("chat", function (nick, text, time, isAdmin) {
            that.emit("chat", session, nick, text, time, isAdmin);
        });
        session.on("info", function (text, time) {
            that.emit("info", session, text, time);
        });
        session.on("warn", function (text, time) {
            that.emit("warn", session, text, time);
        });
        session.on("infoRaw", function (text, time) {
            that.emit("infoRaw", session, text, time);
        });
        session.on("warnRaw", function (text, time) {
            that.emit("warnRaw", session, text, time);
        });
        session.on("onlineSet", function (nicks, time) {
            that.emit("onlineSet", session, nicks, time);
        });
        session.on("onlineAdd", function (nick, time) {
            that.emit("onlineAdd", session, nick, time);
        });
        session.on("onlineRemove", function (nick, time) {
            that.emit("onlineRemove", session, nick, time);
        });
        session.on("error", function (err) {
            that.emit("error", session, err);
        });
        this.sessions.push(session);
        return session;
    };
    HackChat.Session = HackChatSession;
    return HackChat;
})(events.EventEmitter);
module.exports = HackChat;

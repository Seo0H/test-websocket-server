"use strict";

import session from "express-session";
import express from "express";
import http from "http";
import crypto from "crypto";
import { WebSocketServer } from "ws";
import cors from "cors";

function onSocketError(err) {
  console.error(err);
}

const app = express();
const clientMap: Map<string, WebSocket> = new Map();

//
// We need the same instance of the session parser in express and
// WebSocket server.
//
const sessionParser = session({
  saveUninitialized: false,
  secret: "$eCuRiTy",
  resave: false,
  cookie: { httpOnly: true },
});

//
// Serve static files from the 'public' folder.
//
app.use(express.static("public"));
app.use(sessionParser);
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.post("/login", function (req, res) {
  //
  // "Log in" user and set userId to session.s
  //
  const id = crypto.randomUUID();

  console.log(`Updating session for user ${id}`);
  req.session.userId = id;
  res.send({ result: "OK", message: "Session updatsed" });
});

app.delete("/logout", function (request, response) {
  const ws = map.get(request.session.userId);

  console.log("Destroying session");
  request.session.destroy(function () {
    if (ws) ws.close();

    response.send({ result: "OK", message: "Session destroyed" });
  });
});

//
// Create an HTTP server.
//
const server = http.createServer(app);

//
// Create a WebSocket server completely detached from the HTTP server.
//
const wss = new WebSocketServer({ clientTracking: false, noServer: true });

// 클라이언트 인증
server.on("upgrade", function (request, socket, head) {
  socket.on("error", onSocketError);

  console.log("Parsing session from request...");

  sessionParser(request, {}, () => {
    if (!request.session.userId) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    console.log("Session is parsed!");

    socket.removeListener("error", onSocketError);

    wss.handleUpgrade(request, socket, head, function (ws) {
      wss.emit("connection", ws, request);
    });
  });
});

wss.on("connection", function (ws, request) {
  const userId = request.session.userId;

  clientMap.set(userId, ws);

  ws.on("error", console.error);

  ws.on("message", function (message) {
    //
    // Here we can now use session parameters.
    //
    console.log(`Received message ${message} from user ${userId}`);
    clientMap.forEach((client) => client);
  });

  ws.on("close", function () {
    clientMap.delete(userId);
  });
});

//
// Start the server.
//
server.listen(3000, function () {
  console.log("Listening on http://localhost:3000");
});

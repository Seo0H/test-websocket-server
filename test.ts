import * as http from "http";
import express from "express";
import { WebSocketServer } from "ws";

const app = express();
const port = 3000;

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let sockets: string[] = [];

wss.on("connection", function connection(ws, req) {
  ws.on("error", console.error);

  console.log(`socket.remoteAddress :${req.socket.remoteAddress}`);
  console.log(
    `req.headers["sec-websocket-key"]  :${req.headers["sec-websocket-key"]}`
  );

  if (typeof req.headers["sec-websocket-key"] === "string")
    sockets.push(req.headers["sec-websocket-key"]);

  console.log(`connections counts : ${sockets.length}`);

  ws.on("close", (code, reson) => {
    console.log("connection closed");
    sockets = sockets.filter(
      (socketKey) => req.headers["sec-websocket-key"] !== socketKey
    );
    console.log(`connections counts : ${sockets.length}`);
  });

  ws.on("message", function message(data) {
    console.log(String(data));
    // switch(type) {
    //   case ''
    // }
  });
});

server.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});

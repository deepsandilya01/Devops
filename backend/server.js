import app from "./src/app.js";
import config from "./src/config/config.js";
import connectToDB from "./src/config/db.js";
import http from "http";
import initSocket from "./src/socket/logs.socket.js";
const server = http.createServer(app);

connectToDB();

const port = config.PORT;

initSocket(server);

server.timeout = 600000; // 10 minutes to allow AI generation

server.listen(port, () => {
  console.log(`server is running on port ${port}`);
});

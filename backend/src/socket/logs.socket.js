import { Server } from "socket.io";
import { spawn } from "child_process";
import Project from "../model/project.model.js";
import fs from "fs";



export default function initSocket(server) {
    const io = new Server(server, {
        cors: { origin: "*" }
    })
    console.log("server socket is running...")
    io.on("connection", (socket) => {
        console.log("Client connected: ", socket.id)

        socket.on("join-logs", async (data) => {
            const parsedData = JSON.parse(data)
            const { appId } = parsedData;
            console.log("joining logs for: ", appId);

            const app = await Project.findOne({ appId })


            if (!app) {
                socket.emit("error", "App not found")
                return;
            }

            const { containerID } = app;

            socket.join(appId);

            const logProcess = spawn("docker", ["logs", "-f", containerID])

            const logFile = fs.createWriteStream(`logs/${appId}.log`, {
                flags: "a" // append mode
            });

            logProcess.stdout.on("data", (data) => {
                const log = data.toString();
                logFile.write(log);
                io.to(appId).emit("log", log);
            })

            logProcess.stderr.on("data", (data) => {
                const log = data.toString();
                logFile.write(log);
                io.to(appId).emit("log", log);
            })

            socket.on("disconnect", () => {
                logProcess.kill();
                console.log("Client disconnected: ", socket.id)
            })
        })
    })
}

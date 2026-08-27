import { createClient } from "redis";
import config from "./config.js";

const redisClient = createClient({
  socket: {
    host: config.REDIS_HOST || "localhost",
    port: parseInt(config.REDIS_PORT) || 6379,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error("❌ Max Redis connection retries exceeded");
        return new Error("Max retries exceeded");
      }
      return retries * 100;
    },
  },
  password: config.REDIS_PASSWORD,
});

redisClient.on("error", (error) => {
  console.error("❌ Redis Client Error:", error);
});

redisClient.on("connect", () => {
  console.log("✅ Redis connected successfully");
});

redisClient.on("ready", () => {
  console.log("✅ Redis is ready");
});

redisClient.on("reconnecting", () => {
  console.log("🔄 Redis is reconnecting...");
});

// Connect to Redis
await redisClient.connect();

export default redisClient;

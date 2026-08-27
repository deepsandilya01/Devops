import dotenv from "dotenv";
dotenv.config();

if (!process.env.PORT) {
  throw Error("Port is not provided");
}
if (!process.env.REDIS_HOST) {
  throw Error("Redis Host is not provided");
}
if (!process.env.REDIS_PORT) {
  throw Error("Redis Port is not provided");
}
if (!process.env.REDIS_PASSWORD) {
  throw Error("Redis Password is not provided");
}
if (!process.env.JWT_SECRET) {
  throw Error("Jwt Secret is not provided");
}
if (!process.env.MONGO_URI) {
  throw Error("MongoDB Uri is not provided");
}
if (!process.env.GITHUB_CALLBACK) {
  throw Error("Github Callback is not provided");
}
if (!process.env.GITHUB_CLIENT_ID) {
  throw Error("Github Client ID is not provided");
}
if (!process.env.GITHUB_CLIENT_SECRET) {
  throw Error("Github Client Secret is not provided");
}

// Mistral API Key is optional - will use fallback summary if not provided
if (!process.env.MISTRAL_API_KEY) {
  console.warn(
    "⚠️  MISTRAL_API_KEY is not set. AI-powered summaries will be disabled. Set it in .env to enable beginner-friendly project analysis.",
  );
}

if(!process.env.BASE_DOMAIN){
  throw Error("Base Domain is not provided");
}

const config = {
  PORT: process.env.PORT || 5000,
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: process.env.REDIS_PORT,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  NODE_ENV: process.env.NODE_ENV,
  JWT_SECRET: process.env.JWT_SECRET,
  MONGO_URI: process.env.MONGO_URI,
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
  GITHUB_CALLBACK: process.env.GITHUB_CALLBACK,
  MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
  BASE_DOMAIN : process.env.BASE_DOMAIN,
};

export default config;

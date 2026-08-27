import mongoose from "mongoose";
import config from "./config.js";

async function connectToDB() {
  try {
    await mongoose.connect(config.MONGO_URI);

    console.log("Database Connected succesfully");
  } catch (err) {
    throw Error(err.message);
  }
}

export default connectToDB;

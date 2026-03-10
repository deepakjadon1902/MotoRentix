import mongoose from "mongoose";

const connectDb = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGO_URI is not set");
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri, {
    dbName: process.env.MONGO_DB || "motorentix",
  });

  console.log("MongoDB connected");
};

export default connectDb;

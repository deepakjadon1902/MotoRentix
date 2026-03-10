import dotenv from "dotenv";
import app from "./app.js";
import connectDb from "./config/db.js";
import seedAdmin from "./utils/seedAdmin.js";

dotenv.config();

const port = process.env.PORT || 5000;

const start = async () => {
  await connectDb();
  await seedAdmin();
  app.listen(port, () => {
    console.log(`MotoRentix API listening on port ${port}`);
  });
};

start();

import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true },
    module: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("Permission", permissionSchema);

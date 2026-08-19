import mongoose from "mongoose";

const cmsPageSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
    content: { type: String, default: "" },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
  },
  { timestamps: true }
);

export default mongoose.model("CMSPage", cmsPageSchema);

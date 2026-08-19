import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    excerpt: { type: String, trim: true },
    content: { type: String, default: "" },
    coverImage: { type: String },
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Blog", blogSchema);

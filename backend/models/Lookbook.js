import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    heroImage: { type: String, required: true },
    // Editorial copy lives with the look; product facts are resolved at read time.
    editorial: { type: mongoose.Schema.Types.Mixed, default: {} },
    published: { type: Boolean, default: true },
    revision: { type: Number, default: 0 },
    items: [
      {
        _id: false,
        productId: { type: String, required: true },
        color: { type: String, default: "" },
        x: { type: Number, min: 0, max: 100 },
        y: { type: Number, min: 0, max: 100 },
      },
    ],
  },
  { timestamps: true },
);

const Lookbook = mongoose.models.Lookbook || mongoose.model("Lookbook", schema);

export default Lookbook;
export { Lookbook };

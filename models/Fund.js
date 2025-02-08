import mongoose from "mongoose";

const FundSchema = new mongoose.Schema({
  fundFamily: { type: String, required: true },
  schemeName: { type: String, required: true },
  nav: { type: Number, required: true },
  lastUpdated: { type: Date, default: Date.now }
});

const Fund = mongoose.model("Fund", FundSchema);
export default Fund;

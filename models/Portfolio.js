import mongoose from "mongoose";

const InvestmentSchema = new mongoose.Schema({
  scheme_code :  { type: String, required: true },
  scheme: { type: String, required: true },
  units: { type: Number, required: true },
  purchasePrice: { type: Number, required: true },
  currentPrice: { type: Number, default: 0 }, // Add current price tracking
  createdAt: { type: Date, default: Date.now },
});

const PortfolioSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  investments: [InvestmentSchema], // Array of investments per user
  updatedAt: { type: Date, default: Date.now }
});

const Portfolio = mongoose.model("Portfolio", PortfolioSchema);
export default Portfolio;

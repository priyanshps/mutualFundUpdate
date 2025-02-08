import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import fundsRoutes from "./routes/funds.js";
import portfolioRoutes from "./routes/portfolio.js";
import { updatePortfolioPrices } from "./helpers/updatedPorfolioHelper.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


// Routes
app.use("/api/auth", authRoutes);
app.use("/api/funds", fundsRoutes);
app.use("/api/portfolio", portfolioRoutes);

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("DB Error:", err));



const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
export default app;

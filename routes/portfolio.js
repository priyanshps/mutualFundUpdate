import express from "express";
import Portfolio from "../models/Portfolio.js";
import authMiddleware from "../middleware/authMiddleware.js";
import _ from "lodash";
import { updatePortfolioPrices } from "../helpers/updatedPorfolioHelper.js";
import NodeCache from "node-cache";
const cache = new NodeCache({ stdTTL: 86400 });

const router = express.Router();
const activeTimers = new Map();


// Add Investment
router.post("/add", authMiddleware, async (req, res) => {
  try {
    const { scheme, units, purchasePrice, scheme_code } = req.body;

    let portfolio = await Portfolio.findOne({ userId: req.user.userId });
    if (!portfolio) {
      portfolio = new Portfolio({ userId: req.user.userId, investments: [] });
    }

    // Use lodash to find the existing investment by scheme_code
    let existingInvestment = _.find(portfolio.investments, { scheme_code });

    if (existingInvestment) {
      // Update existing investment using lodash's cloneDeep for safety (to avoid mutation)
      existingInvestment = _.cloneDeep(existingInvestment);
      existingInvestment.units += units;
      existingInvestment.purchasePrice =
        (existingInvestment.purchasePrice * existingInvestment.units +
          purchasePrice * units) /
        (existingInvestment.units + units);

      // Update the investments array
      portfolio.investments = portfolio.investments.map((investment) =>
        investment.scheme_code === scheme_code ? existingInvestment : investment
      );
    } else {
      // Add new investment
      portfolio.investments.push({
        scheme,
        units,
        purchasePrice,
        currentPrice: purchasePrice,
        scheme_code,
      });
    }

    await portfolio.save();

    return res
      .status(200)
      .json({ message: "Investment added successfully", portfolio });
  } catch (error) {
    return res.status(500).json({ error: "Error adding investment" });
  }
});

//View Investmenst and Also start tracking of investments
router.get("/get", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    await updatePricesHourly(userId);

    if (cache.has(`latestPortfolioData${userId}`)) {
      return res.status(200).json(cache.get(`latestPortfolioData${userId}`));
    } else {
      let latestPortfolioData = await updatePortfolioPrices(userId);
      cache.set(`latestPortfolioData${userId}`, latestPortfolioData);

      return res.status(200).json(latestPortfolioData);
    }
  } catch (error) {
    return res.status(500).json({ error: "Error fetching portfolio" });
  }
});

async function updatePricesHourly(userId) {
  try {
    await invokeHourlyUpdate(userId);
  } catch (error) {
    throw new Error("Error updating portfolio : updatePricesHourly");
  }
}

async function invokeHourlyUpdate(userId) {
  if (activeTimers.has(userId)) return;
  const interval = setInterval(async () => {
    try {
      let latestPortfolioData = await updatePortfolioPrices(userId);
      cache.set(`latestPortfolioData${userId}`, latestPortfolioData);
    } catch (error) {
      throw new Error("Error updating portfolio : invokeHourlyUpdate");
    }
  },  60 * 60 * 1000);

  activeTimers.set(userId, interval);
}


export default router;

import cron from "node-cron";
import axios from "axios";
import Portfolio from "../models/Portfolio.js";
import mongoose from "mongoose";
import _ from "lodash";

// Function to fetch latest NAV price
const fetchLatestPrice = async (scheme_code) => {
  try {

    const schemeString = scheme_code.join(",");
    const response = await axios.get(
      `https://latest-mutual-fund-nav.p.rapidapi.com/latest?Scheme_Type=Open`,
      {
        headers: {
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
          "x-rapidapi-host": process.env.RAPIDAPI_HOST,
        },
        params: {
          Scheme_Code: schemeString,
        },
      }
    );

    // Ensure we get a valid response
    if (!response.data || !Array.isArray(response.data)) {
      throw new Error("Invalid API response format");
    }
    return response.data;
  } catch (error) {
    return null; // Return null on failure
  }
};

export const updatePortfolioPrices = async (userId) => {
  try {
    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid userId provided.");
    }

    const objectId = new mongoose.Types.ObjectId(userId);

    // Fetch Portfolio investments
    const portfolios = await Portfolio.aggregate([
      { $match: { userId: objectId } },
      { $project: { _id: 0, investments: 1 } },
    ]);

    const investments = _.get(portfolios, "[0].investments", []);
    if (_.isEmpty(investments)) {
      return { message: `No investments found for userId: ${userId}` };
    }

    // Extract Scheme Codes
    const schemeCodes = _.map(investments, "scheme_code");
    if (_.isEmpty(schemeCodes)) {
      return { message: `No scheme codes found for userId: ${userId}` };
    }

    // Fetch latest prices
    const currentPortfoliosUpdates = await fetchLatestPrice(schemeCodes);
    if (_.isEmpty(currentPortfoliosUpdates)) {
      return { message: `No latest prices found for userId: ${userId}` };
    }

    // Convert price updates into a lookup object
    const fundMap = _.keyBy(
      currentPortfoliosUpdates,
      (item) => `${item.Scheme_Code}`
    );

    // Update portfolio investments with latest prices
    _.forEach(investments, (portfolio) => {
      portfolio.currentPrice = _.get(
        fundMap,
        `${portfolio.scheme_code}.Net_Asset_Value`,
        0
      );
    });

    // Save updated portfolio investments
    const updatedPortfolio = await Portfolio.findOneAndUpdate(
      { userId: objectId },
      { $set: { investments } },
      { new: true, runValidators: true }
    );

    return (
      updatedPortfolio || {
        message: `Failed to update investments for userId: ${userId}`,
      }
    );
  } catch (error) {
    return {
      message: `Error updating portfolio prices for userId: ${userId}`,
      error: error.message,
    };
  }
};

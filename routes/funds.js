import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import _ from "lodash";

dotenv.config();
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const fundFamily = _.get(req, "params.fundFamily", ""); // Use lodash to safely get the fundFamily parameter

    const response = await axios.get(
      `https://latest-mutual-fund-nav.p.rapidapi.com/latest?Scheme_Type=Open`,
      {
        headers: {
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
          "x-rapidapi-host": process.env.RAPIDAPI_HOST,
        },
      }
    );

    const uniqueFunds = _.uniqBy(response.data, "Scheme_Code"); // Use lodash to remove duplicate funds based on "Scheme_Code"

    return res.json(uniqueFunds);
  } catch (err) {
    return res.status(500).json({ error: "Error fetching mutual fund data" });
  }
});

export default router;

import express from "express";
import * as sc from "../controllers/search";

import { escapeRegExp } from "../utils";

const router = express.Router();

const parseQuery = (req, res, next) => {
  const { query, category } = req.query;
  const safeQuery = (query ? escapeRegExp(query) : "").trim();
  const safeCategory = !category
    ? []
    : !Array.isArray(category)
    ? [category]
    : category;
  if (!safeQuery && !safeCategory.length) {
    return res.status(400).send({
      error: "Search Keyword Required",
    });
  }
  req.safeQuery = safeQuery;
  req.safeCategory = safeCategory;
  return next();
};

router.get("/", parseQuery, sc.getSearch);
router.get("/simple", parseQuery, sc.getSimpleSearch);
router.get("/user", parseQuery, sc.getUserSearch);
router.get(
  "/zabo/list",
  parseQuery,
  sc.listSearchZabos,
  sc.listNextSearchZabos,
);

export default router;

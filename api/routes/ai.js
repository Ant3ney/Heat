const express = require("express");
const router = express.Router();
const { query } = require("../controllers/aiController");

router.post("/query", query);

module.exports = router;

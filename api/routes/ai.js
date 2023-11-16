const express = require("express");
const router = express.Router();
const { query } = require("../controllers/ai");

router.post("/query", query);

module.exports = router;

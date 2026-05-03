const express = require("express");

const { parseFlowlyCommand } = require("../controllers/aiController");
const requireSupabaseUser = require("../middleware/requireSupabaseUser");

const router = express.Router();

router.use(requireSupabaseUser);

router.post("/parse", parseFlowlyCommand);

module.exports = router;

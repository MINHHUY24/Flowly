const express = require("express");
const requireSupabaseUser = require("../middleware/requireSupabaseUser");
const scheduleController = require("../controllers/scheduleController");

const router = express.Router();

router.use(requireSupabaseUser);

router.get("/", scheduleController.getSchedules);
router.post("/", scheduleController.createSchedule);
router.put("/:id", scheduleController.updateSchedule);
router.delete("/:id", scheduleController.deleteSchedule);

module.exports = router;

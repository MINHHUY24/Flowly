const express = require("express");
const requireSupabaseUser = require("../middleware/requireSupabaseUser");
const taskController = require("../controllers/taskController");

const router = express.Router();

router.use(requireSupabaseUser);

router.get("/", taskController.getTasks);
router.post("/", taskController.createTask);
router.put("/:id", taskController.updateTask);
router.delete("/:id", taskController.deleteTask);
router.patch("/:id/status", taskController.updateTaskStatus);

module.exports = router;

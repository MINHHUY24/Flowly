require("dotenv").config();

const express = require("express");
const path = require("path");

const taskRoutes = require("./routes/taskRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const aiRoutes = require("./routes/aiRoutes");

const { getHolidayMap } = require("./utils/holidays");

const app = express();
const PORT = process.env.PORT || 3000;
const clientDistPath = path.join(__dirname, "../client/dist");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/api/config", (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL,
    supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
  });
});

app.get("/api/holidays/:year", (req, res) => {
  const year = Number(req.params.year);

  if (!Number.isInteger(year)) {
    return res.status(400).json({
      error: "Invalid year",
    });
  }

  return res.json(getHolidayMap(year));
});

app.use("/api/tasks", taskRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/ai", aiRoutes);

app.use(express.static(clientDistPath));

app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"), (error) => {
    if (error) {
      res.status(404).send("React build not found. Run npm run build first.");
    }
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: "Không tìm thấy API",
  });
});

app.listen(PORT, () => {
  console.log(`Flowly API server is running at http://localhost:${PORT}`);
});

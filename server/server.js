require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const express = require("express");
const path    = require("path");
const cors = require("cors");
const authRoutes = require("./src/routes/authRoutes");
const taskRoutes = require("./src/routes/taskRoutes");
const enterpriseRoutes = require("./src/routes/enterpriseRoutes");
const contactRoutes    = require("./src/routes/contactRoutes");
const noteRoutes       = require("./src/routes/noteRoutes");
const archiveRoutes       = require("./src/routes/archiveRoutes");
const notificationRoutes  = require("./src/routes/notificationRoutes");
const tagRoutes           = require("./src/routes/tagRoutes");
const sseRoutes           = require("./src/routes/sseRoutes");
const helpRoutes          = require("./src/routes/helpRoutes");
const searchRoutes        = require("./src/routes/searchRoutes");
const analyticsRoutes     = require("./src/routes/analyticsRoutes");
const initDb = require("./src/config/initDb");

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/enterprises", enterpriseRoutes);
app.use("/api/contacts",   contactRoutes);
app.use("/api/notes",      noteRoutes);
app.use("/api/archive",        archiveRoutes);
app.use("/api/notifications",  notificationRoutes);
app.use("/api/tags",           tagRoutes);
app.use("/api/events",        sseRoutes);
app.use("/api/help",          helpRoutes);
app.use("/api/search",        searchRoutes);
app.use("/api/analytics",     analyticsRoutes);

const PORT = process.env.PORT || 3000;

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Сервер запущен на порту ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Ошибка инициализации БД:", err);
    process.exit(1);
  });

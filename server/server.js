require("dotenv").config();
const express = require("express");
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
const initDb = require("./src/config/initDb");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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

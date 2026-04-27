require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./src/routes/authRoutes");
const taskRoutes = require("./src/routes/taskRoutes");
const enterpriseRoutes = require("./src/routes/enterpriseRoutes");
const contactRoutes    = require("./src/routes/contactRoutes");
const initDb = require("./src/config/initDb");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/enterprises", enterpriseRoutes);
app.use("/api/contacts",   contactRoutes);

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

const express = require("express");
const authRoutes = require("./src/routes/authRoutes");

const app = express();

const cors = require("cors");

app.use(
  cors({
    origin: "http://localhost:5173", // Указание точного адреса твоего фронтенда (Vite)
    credentials: true, // Разрешение для сервера принимать и отправлять куки
  }),
);
app.use(express.json()); // Для парсинга JSON тела запроса

// Routes
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});

const Employee = require("../models/employeeModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

console.log("Проверка импорта Employee:", Employee);

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (typeof Employee.findByEmail !== "function") {
      console.error(
        "КРИТИЧЕСКАЯ ОШИБКА: findByEmail не найден в объекте:",
        Employee,
      );
      return res
        .status(500)
        .json({ message: "Ошибка структуры модели на сервере" });
    }

    const userExists = await Employee.findByEmail(email);
    if (userExists) {
      return res.status(400).json({ message: "Email уже занят" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const created = await Employee.create(name, email, hashedPassword);
    const userId = created.insertId;

    const token = jwt.sign(
      { id: userId, email },
      process.env.JWT_SECRET || "secret_key",
      { expiresIn: "24h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.status(201).json({
      message: "Регистрация успешна",
      user: { id: userId, name, email },
    });
  } catch (error) {
    console.error("Ошибка в authController:", error);
    res.status(500).json({ message: "Ошибка сервера", error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, remember } = req.body;

    const user = await Employee.findByEmail(email);

    if (!user) {
      return res.status(404).json({ message: "Пользователь с таким email не зарегистрирован" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Неверный пароль" });
    }

    const expiresIn = remember ? "30d" : "24h";

    const token = jwt.sign(
      { id: user.id, email: user.email }, // Зашивка id пользователя в токен
      process.env.JWT_SECRET || "secret_key",
      { expiresIn },
    );

    // Сохранение токена в HttpOnly Cookie
    const cookieMaxAge = remember
      ? 30 * 24 * 60 * 60 * 1000
      : 24 * 60 * 60 * 1000;

    res.cookie("token", token, {
      httpOnly: true, // Защита от кражи токена
      secure: process.env.NODE_ENV === "production",
      maxAge: cookieMaxAge,
    });

    res.status(200).json({
      message: "Успешный вход",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        position: user.position,
      },
    });
  } catch (error) {
    console.error("Ошибка в authController.login:", error);
    res.status(500).json({ message: "Ошибка сервера при авторизации" });
  }
};

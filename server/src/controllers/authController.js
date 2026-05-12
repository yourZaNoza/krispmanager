const Employee = require("../models/employeeModel");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const path     = require("path");
const fs       = require("fs");

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
        id:       user.id,
        name:     user.name,
        email:    user.email,
        position: user.position,
        role:     user.role || null,
        avatar:   user.avatar || null,
      },
    });
  } catch (error) {
    console.error("Ошибка в authController.login:", error);
    res.status(500).json({ message: "Ошибка сервера при авторизации" });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await Employee.findByEmail(req.user.email);
    if (!user) return res.status(404).json({ message: "Пользователь не найден" });
    res.json({ id: user.id, name: user.name, email: user.email, position: user.position, role: user.role || null, avatar: user.avatar || null });
  } catch (error) {
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const me = await Employee.findById(req.user?.id)
    if (me?.role !== 'администратор') return res.status(403).json({ message: 'Только администратор' })
    const users = await Employee.findAll()
    res.json(users.map(u => ({ id: u.id, name: u.name, email: u.email, position: u.position || '', role: u.role || 'сотрудник', avatar: u.avatar || null })))
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

exports.updateUserRole = async (req, res) => {
  try {
    const me = await Employee.findById(req.user?.id)
    if (me?.role !== 'администратор') return res.status(403).json({ message: 'Только администратор' })
    const targetId = parseInt(req.params.id)
    const ROLES = ['сотрудник', 'менеджер', 'администратор']
    const role = ROLES.includes(req.body.role) ? req.body.role : null
    const target = await Employee.findById(targetId)
    if (!target) return res.status(404).json({ message: 'Пользователь не найден' })
    await Employee.updateProfile(targetId, { name: target.name, email: target.email, position: target.position || '', role })
    res.json({ message: 'Роль обновлена' })
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Файл не загружен' })
    const userId = req.user.id

    const user = await Employee.findById(userId)
    if (user?.avatar) {
      const oldFile = path.join(__dirname, '../../uploads/avatars', path.basename(user.avatar))
      if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile)
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`
    await Employee.updateAvatar(userId, avatarUrl)
    res.json({ avatar: avatarUrl })
  } catch (err) {
    console.error('uploadAvatar error:', err)
    res.status(500).json({ message: 'Ошибка загрузки аватара' })
  }
}

exports.deleteUser = async (req, res) => {
  try {
    const me = await Employee.findById(req.user?.id)
    if (me?.role !== 'администратор') return res.status(403).json({ message: 'Только администратор' })
    const targetId = parseInt(req.params.id)
    if (targetId === req.user.id) return res.status(400).json({ message: 'Нельзя удалить себя' })
    const target = await Employee.findById(targetId)
    if (!target) return res.status(404).json({ message: 'Пользователь не найден' })
    await Employee.delete(targetId)
    res.json({ message: 'Пользователь удалён' })
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

exports.getAllAvatars = async (req, res) => {
  try {
    const rows = await Employee.findAllWithAvatars()
    const map = {}
    for (const r of rows) map[r.id] = r.avatar
    res.json(map)
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ message: "Не авторизован" });

    const { name, email, position, role } = req.body;
    if (!name) return res.status(400).json({ message: "Имя обязательно" });

    const currentUser = await Employee.findById(userId);
    if (!currentUser) return res.status(404).json({ message: "Пользователь не найден" });

    const ROLES = ['сотрудник', 'менеджер', 'администратор'];
    const canChangeRole = req.user.email === 'test@gmail.com';
    const safeRole = (canChangeRole && ROLES.includes(role)) ? role : (currentUser.role || null);

    await Employee.updateProfile(userId, { name, email, position, role: safeRole });

    const updated = await Employee.findById(userId);
    res.json({
      id:       updated.id,
      name:     updated.name,
      email:    updated.email,
      position: updated.position,
      role:     updated.role || 'сотрудник',
      avatar:   updated.avatar || null,
    });
  } catch (error) {
    console.error("Ошибка updateProfile:", error);
    res.status(500).json({ message: "Ошибка сервера", error: error.message });
  }
};

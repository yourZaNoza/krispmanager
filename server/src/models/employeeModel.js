const db = require("../config/db");

class Employee {
  // Статический метод, чтобы вызывать его как Employee.findByEmail
  static async findByEmail(email) {
    const [rows] = await db.execute("SELECT * FROM employees WHERE email = ?", [
      email,
    ]);
    return rows[0];
  }

  static async create(name, email, password) {
    // ВНИМАНИЕ: Если в таблице есть поле position и оно NOT NULL,
    // добавь его сюда или сделай его NULL в базе данных
    const [result] = await db.execute(
      "INSERT INTO employees (name, email, password) VALUES (?, ?, ?)",
      [name, email, password],
    );
    return result;
  }
}

// ЭТО САМАЯ ВАЖНАЯ СТРОКА
module.exports = Employee;

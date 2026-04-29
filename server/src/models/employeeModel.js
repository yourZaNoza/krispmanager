const db = require("../config/db");

class Employee {
  static async findByEmail(email) {
    const [rows] = await db.execute("SELECT * FROM employees WHERE email = ?", [email]);
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await db.execute("SELECT * FROM employees WHERE id = ?", [id]);
    return rows[0];
  }

  static async create(name, email, password) {
    const [result] = await db.execute(
      "INSERT INTO employees (name, email, password) VALUES (?, ?, ?)",
      [name, email, password],
    );
    return result;
  }

  static async updateProfile(id, { name, email, position, role }) {
    await db.execute(
      "UPDATE employees SET name = ?, email = ?, position = ?, role = ? WHERE id = ?",
      [name, email, position || '', role || 'сотрудник', id],
    );
  }
}

module.exports = Employee;

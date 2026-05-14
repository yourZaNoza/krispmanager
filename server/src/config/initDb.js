const db = require('./db')

async function addColumnSafe(table, column, definition) {
  try {
    await db.execute(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`)
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') return
    throw err
  }
}

async function modifyColumnSafe(table, column, definition) {
  try {
    await db.execute(`ALTER TABLE \`${table}\` MODIFY COLUMN \`${column}\` ${definition}`)
  } catch (err) {
    if (err.code === 'ER_BAD_FIELD_ERROR') return
    throw err
  }
}

async function dropColumnSafe(table, column) {
  try {
    await db.execute(`ALTER TABLE \`${table}\` DROP COLUMN \`${column}\``)
  } catch (err) {
    if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY' || err.code === 'ER_BAD_FIELD_ERROR') return
    throw err
  }
}

async function renameColumnSafe(table, oldName, newName, definition) {
  try {
    await db.execute(`ALTER TABLE \`${table}\` CHANGE \`${oldName}\` \`${newName}\` ${definition}`)
  } catch (err) {
    if (err.code === 'ER_BAD_FIELD_ERROR') return  // старой колонки нет — уже переименована
    throw err
  }
}

async function initDb() {
  // ── Создаём все таблицы если не существуют (для чистой БД / Docker) ──────

  await db.execute(`
    CREATE TABLE IF NOT EXISTS roles (
      id   INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) NOT NULL UNIQUE
    )
  `)

  const [[{ rolesCnt }]] = await db.execute('SELECT COUNT(*) AS rolesCnt FROM roles')
  if (Number(rolesCnt) === 0) {
    await db.execute(`
      INSERT INTO roles (id, name) VALUES
        (1, 'администратор'),
        (2, 'сотрудник'),
        (3, 'менеджер'),
        (4, 'нет роли')
    `)
  }

  await db.execute(`
    CREATE TABLE IF NOT EXISTS employees (
      id       INT AUTO_INCREMENT PRIMARY KEY,
      name     VARCHAR(255) NOT NULL,
      email    VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      position VARCHAR(255) DEFAULT '',
      id_role  INT DEFAULT NULL,
      avatar   VARCHAR(500) DEFAULT NULL,
      FOREIGN KEY (id_role) REFERENCES roles(id)
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tasks_category (
      id_category INT AUTO_INCREMENT PRIMARY KEY,
      user_id     INT DEFAULT NULL,
      title       VARCHAR(255) NOT NULL,
      color       VARCHAR(50)  DEFAULT '#037247'
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      user_id       INT DEFAULT NULL,
      id_category   INT DEFAULT NULL,
      id_enterprise INT DEFAULT NULL,
      date          DATE,
      title         VARCHAR(500) DEFAULT '',
      description   TEXT,
      deadline      DATE,
      date_from     DATE,
      enterprise    VARCHAR(255),
      tags          JSON,
      lists         JSON,
      participants  JSON,
      attachments   JSON,
      comments      JSON,
      history       JSON,
      completed     TINYINT(1) DEFAULT 0,
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS enterprises (
      id             INT AUTO_INCREMENT PRIMARY KEY,
      user_id        INT DEFAULT NULL,
      category_id    INT DEFAULT NULL,
      name           VARCHAR(255) NOT NULL,
      address        VARCHAR(500) DEFAULT NULL,
      contact_person VARCHAR(255) DEFAULT NULL,
      contact_id     INT DEFAULT NULL,
      phone_number   VARCHAR(50)  DEFAULT NULL,
      description    TEXT,
      city           VARCHAR(255) DEFAULT NULL,
      phone          VARCHAR(50)  DEFAULT NULL,
      created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS notes (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      user_id     INT DEFAULT NULL,
      title       VARCHAR(500) DEFAULT '',
      date        DATE,
      time        VARCHAR(10)  DEFAULT NULL,
      tags        JSON,
      lists       JSON,
      comments    JSON,
      history     JSON,
      attachments JSON,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS contacts (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      user_id     INT DEFAULT NULL,
      category_id INT DEFAULT NULL,
      name        VARCHAR(255) NOT NULL,
      city        VARCHAR(255) DEFAULT NULL,
      email       VARCHAR(255) DEFAULT NULL,
      phone       VARCHAR(50)  DEFAULT NULL,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS enterprise_categories (
      id      INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT DEFAULT NULL,
      title   VARCHAR(255) NOT NULL,
      color   VARCHAR(50)  DEFAULT '#037247'
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS contact_categories (
      id      INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT DEFAULT NULL,
      title   VARCHAR(255) NOT NULL,
      color   VARCHAR(50)  DEFAULT '#037247'
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS global_tags (
      id    INT AUTO_INCREMENT PRIMARY KEY,
      scope VARCHAR(10)  NOT NULL,
      label VARCHAR(100) NOT NULL,
      bg    VARCHAR(50)  DEFAULT '#f5f5f5',
      color VARCHAR(50)  DEFAULT '#616161'
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      user_id    INT NOT NULL,
      actor_id   INT DEFAULT NULL,
      actor_name VARCHAR(255) DEFAULT NULL,
      type       VARCHAR(50)  DEFAULT 'task_updated',
      task_id    INT DEFAULT NULL,
      task_title VARCHAR(500) DEFAULT NULL,
      message    TEXT,
      is_read    TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_notif_user    (user_id),
      INDEX idx_notif_created (created_at)
    )
  `)

  // ── Миграции для существующих БД (пропускаются если колонка уже есть) ────

  await addColumnSafe('tasks_category', 'user_id', 'INT DEFAULT NULL')

  await modifyColumnSafe('tasks', 'id_enterprise', 'INT DEFAULT NULL')
  await addColumnSafe('tasks', 'user_id',      'INT DEFAULT NULL')
  await addColumnSafe('tasks', 'title',        'VARCHAR(500) DEFAULT ""')
  await addColumnSafe('tasks', 'description',  'TEXT')
  await addColumnSafe('tasks', 'deadline',     'DATE')
  await addColumnSafe('tasks', 'enterprise',   'VARCHAR(255)')
  await addColumnSafe('tasks', 'tags',         'JSON')
  await addColumnSafe('tasks', 'lists',        'JSON')
  await addColumnSafe('tasks', 'participants', 'JSON')
  await addColumnSafe('tasks', 'attachments',  'JSON')
  await addColumnSafe('tasks', 'comments',     'JSON')
  await addColumnSafe('tasks', 'history',      'JSON')
  await addColumnSafe('tasks', 'completed',    'TINYINT(1) DEFAULT 0')
  await addColumnSafe('tasks', 'date_from',    'DATE')
  await addColumnSafe('tasks', 'deleted_at',   'DATETIME DEFAULT NULL')

  await addColumnSafe('enterprises', 'user_id',        'INT DEFAULT NULL')
  await addColumnSafe('enterprises', 'category_id',    'INT DEFAULT NULL')
  await addColumnSafe('enterprises', 'city',           'VARCHAR(255) DEFAULT NULL')
  await addColumnSafe('enterprises', 'phone',          'VARCHAR(50) DEFAULT NULL')
  await addColumnSafe('enterprises', 'contact_person', 'VARCHAR(255) DEFAULT NULL')
  await addColumnSafe('enterprises', 'contact_id',     'INT DEFAULT NULL')
  // Переименование director → contact_person для существующих БД
  await renameColumnSafe('enterprises', 'director', 'contact_person', 'VARCHAR(255) DEFAULT NULL')

  await modifyColumnSafe('notes', 'id_employee', 'INT DEFAULT NULL')
  await modifyColumnSafe('notes', 'description', 'TEXT DEFAULT NULL')
  await addColumnSafe('notes', 'user_id',     'INT DEFAULT NULL')
  await addColumnSafe('notes', 'title',       'VARCHAR(500) DEFAULT ""')
  await addColumnSafe('notes', 'time',        'VARCHAR(10) DEFAULT NULL')
  await addColumnSafe('notes', 'tags',        'JSON')
  await addColumnSafe('notes', 'lists',       'JSON')
  await addColumnSafe('notes', 'comments',    'JSON')
  await addColumnSafe('notes', 'history',     'JSON')
  await addColumnSafe('notes', 'attachments', 'JSON')
  await addColumnSafe('notes', 'deleted_at', 'DATETIME DEFAULT NULL')

  await modifyColumnSafe('contacts', 'id_employee', 'INT DEFAULT NULL')
  await addColumnSafe('contacts', 'user_id',     'INT DEFAULT NULL')
  await addColumnSafe('contacts', 'category_id', 'INT DEFAULT NULL')
  await addColumnSafe('contacts', 'city',        'VARCHAR(255) DEFAULT NULL')
  await addColumnSafe('contacts', 'email',       'VARCHAR(255) DEFAULT NULL')
  await addColumnSafe('contacts', 'phone',       'VARCHAR(50)  DEFAULT NULL')

  await addColumnSafe('employees', 'avatar',   'VARCHAR(500) DEFAULT NULL')
  await addColumnSafe('employees', 'position', "VARCHAR(255) DEFAULT ''")
  await addColumnSafe('employees', 'id_role',  'INT DEFAULT NULL')

  // Мигрируем данные из старого role (varchar) в id_role, если старая колонка ещё существует
  try {
    await db.execute(`
      UPDATE employees e
      JOIN roles r ON e.role = r.name
      SET e.id_role = r.id
      WHERE e.id_role IS NULL AND e.role IS NOT NULL
    `)
  } catch (_) {}

  // Удаляем старый varchar-столбец role
  await dropColumnSafe('employees', 'role')

  // Добавляем внешний ключ если ещё не существует
  try {
    await db.execute(`
      ALTER TABLE employees
      ADD CONSTRAINT fk_employees_role FOREIGN KEY (id_role) REFERENCES roles(id)
    `)
  } catch (err) {
    if (err.code !== 'ER_DUP_KEY' && err.errno !== 1826 && err.errno !== 1215) throw err
  }

  // ── Дефолтные глобальные категории задач ─────────────────────────────────

  const [[{ cnt }]] = await db.execute(
    'SELECT COUNT(*) AS cnt FROM tasks_category WHERE user_id IS NULL'
  )
  if (Number(cnt) === 0) {
    await db.execute(`
      INSERT INTO tasks_category (user_id, title, color) VALUES
        (NULL, 'Планы',      '#2196F3'),
        (NULL, 'В процессе', '#FF9800'),
        (NULL, 'Готово',     '#4CAF50')
    `)
  }

  const [userCats] = await db.execute(
    'SELECT id_category FROM tasks_category WHERE user_id IS NOT NULL'
  )
  if (userCats.length > 0) {
    const ids = userCats.map(c => c.id_category).join(',')
    await db.execute(`DELETE FROM tasks WHERE id_category IN (${ids})`)
    await db.execute('DELETE FROM tasks_category WHERE user_id IS NOT NULL')
  }

  // ── Дефолтные глобальные теги ─────────────────────────────────────────────

  const [[{ tagCnt }]] = await db.execute('SELECT COUNT(*) AS tagCnt FROM global_tags')
  if (Number(tagCnt) === 0) {
    await db.execute(`
      INSERT INTO global_tags (scope, label, bg, color) VALUES
        ('task', 'Срочная',     '#FFF0F0', '#D32F2F'),
        ('task', 'Мероприятие', '#E8F5E9', '#388E3C'),
        ('task', 'Отчет',       '#F3E5F5', '#7B1FA2'),
        ('task', 'Документы',   '#E8EAF6', '#3949AB'),
        ('task', 'Отдел',       '#FFF8E1', '#F57F17'),
        ('note', 'Ежемесячное', '#E8F5E9', '#2E7D32'),
        ('note', 'Личное',      '#FFF3E0', '#E65100'),
        ('note', 'Важное',      '#FFFDE7', '#F57F17'),
        ('note', 'Проект',      '#E3F2FD', '#1565C0'),
        ('note', 'Срочное',     '#FFEBEE', '#C62828'),
        ('note', 'Рабочее',     '#F3E5F5', '#6A1B9A')
    `)
  }

  console.log('Схема БД обновлена')
}

module.exports = initDb

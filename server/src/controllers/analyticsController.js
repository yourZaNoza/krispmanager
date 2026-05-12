const db = require('../config/db')

// GET /api/analytics/summary
exports.getSummary = async (req, res) => {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ message: 'Не авторизован' })
  try {
    const [[{ tasks }]] = await db.execute(
      `SELECT COUNT(*) AS tasks FROM tasks
       WHERE (user_id = ? OR JSON_CONTAINS(participants, JSON_OBJECT('id', ?)))
         AND deleted_at IS NULL`,
      [userId, userId]
    )
    const [[{ notes }]]       = await db.execute('SELECT COUNT(*) AS notes       FROM notes       WHERE user_id = ?', [userId])
    const [[{ contacts }]]    = await db.execute('SELECT COUNT(*) AS contacts    FROM contacts    WHERE user_id = ?', [userId])
    const [[{ enterprises }]] = await db.execute('SELECT COUNT(*) AS enterprises FROM enterprises WHERE user_id = ?', [userId])

    res.json({
      tasks:       Number(tasks),
      notes:       Number(notes),
      contacts:    Number(contacts),
      enterprises: Number(enterprises),
    })
  } catch (err) {
    console.error('getSummary error:', err)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

// GET /api/analytics/participating
exports.getParticipating = async (req, res) => {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ message: 'Не авторизован' })
  try {
    const [rows] = await db.execute(
      `SELECT t.id, t.title, t.deadline, tc.color AS catColor, e.name AS ownerName
       FROM tasks t
       LEFT JOIN tasks_category tc ON t.id_category = tc.id_category
       LEFT JOIN employees e ON e.id = t.user_id
       WHERE JSON_CONTAINS(t.participants, JSON_OBJECT('id', ?))
         AND t.deleted_at IS NULL
       ORDER BY t.deadline IS NULL, t.deadline ASC, t.created_at DESC`,
      [userId]
    )
    res.json(rows.map(r => ({
      id:        r.id,
      title:     r.title,
      deadline:  r.deadline ? r.deadline.toISOString().split('T')[0] : null,
      catColor:  r.catColor || '#037247',
      ownerName: r.ownerName || '',
    })))
  } catch (err) {
    console.error('getParticipating error:', err)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

// GET /api/analytics/enterprises
exports.getEnterprises = async (req, res) => {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ message: 'Не авторизован' })
  try {
    const [rows] = await db.execute(
      `SELECT e.id, e.name, e.city,
              ec.title AS catTitle, ec.color AS catColor,
              COUNT(t.id) AS taskCount
       FROM enterprises e
       LEFT JOIN enterprise_categories ec ON e.category_id = ec.id
       LEFT JOIN tasks t ON t.enterprise = e.name
         AND (t.user_id = ? OR JSON_CONTAINS(t.participants, JSON_OBJECT('id', ?)))
         AND t.deleted_at IS NULL
       WHERE e.user_id = ?
       GROUP BY e.id, e.name, e.city, ec.title, ec.color
       ORDER BY taskCount DESC`,
      [userId, userId, userId]
    )

    const catMap = {}
    for (const row of rows) {
      const key = row.catTitle || 'Без категории'
      if (!catMap[key]) catMap[key] = { title: key, color: row.catColor || '#9e9e9e', count: 0 }
      catMap[key].count++
    }

    res.json({
      enterprises: rows.map(r => ({
        id:        r.id,
        name:      r.name || '',
        city:      r.city || '',
        catTitle:  r.catTitle || '',
        catColor:  r.catColor || '#9e9e9e',
        taskCount: Number(r.taskCount),
      })),
      categories: Object.values(catMap),
      total: rows.length,
    })
  } catch (err) {
    console.error('getEnterprises error:', err)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

// GET /api/analytics/task-stats?year=YYYY
exports.getTaskStats = async (req, res) => {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ message: 'Не авторизован' })

  const year = parseInt(req.query.year) || new Date().getFullYear()

  try {
    // Per-month stats: tasks grouped by deadline month
    const [rows] = await db.execute(
      `SELECT
         MONTH(t.deadline)                                             AS month,
         COUNT(*)                                                      AS total,
         SUM(CASE WHEN tc.title = 'Готово' THEN 1 ELSE 0 END)        AS done
       FROM tasks t
       LEFT JOIN tasks_category tc ON t.id_category = tc.id_category
       WHERE (t.user_id = ? OR JSON_CONTAINS(t.participants, JSON_OBJECT('id', ?)))
         AND t.deadline IS NOT NULL
         AND YEAR(t.deadline) = ?
       GROUP BY MONTH(t.deadline)
       ORDER BY month`,
      [userId, userId, year]
    )

    const months = Array.from({ length: 12 }, (_, i) => {
      const m   = i + 1
      const row = rows.find(r => Number(r.month) === m)
      const total = row ? Number(row.total) : 0
      const done  = row ? Number(row.done)  : 0
      const pct   = total > 0 ? Math.round((done / total) * 100) : 0
      return { month: m, total, done, pct }
    })

    // Current month %
    const now      = new Date()
    const curMonth = now.getMonth() + 1
    const curYear  = now.getFullYear()
    const curPct   = year === curYear ? months[curMonth - 1].pct : 0

    // Previous month %
    let prevPct = 0
    if (year === curYear) {
      if (curMonth === 1) {
        // December of previous year
        const [[prevRow]] = await db.execute(
          `SELECT COUNT(*) AS total,
                  SUM(CASE WHEN tc.title = 'Готово' THEN 1 ELSE 0 END) AS done
           FROM tasks t
           LEFT JOIN tasks_category tc ON t.id_category = tc.id_category
           WHERE (t.user_id = ? OR JSON_CONTAINS(t.participants, JSON_OBJECT('id', ?)))
             AND t.deadline IS NOT NULL
             AND YEAR(t.deadline) = ? AND MONTH(t.deadline) = 12`,
          [userId, userId, curYear - 1]
        )
        const t = Number(prevRow.total), d = Number(prevRow.done)
        prevPct = t > 0 ? Math.round((d / t) * 100) : 0
      } else {
        prevPct = months[curMonth - 2].pct
      }
    }

    const delta = curPct - prevPct

    // Available years (earliest deadline year → current)
    const [[{ minYear }]] = await db.execute(
      `SELECT COALESCE(MIN(YEAR(deadline)), ?) AS minYear FROM tasks
       WHERE deadline IS NOT NULL
         AND (user_id = ? OR JSON_CONTAINS(participants, JSON_OBJECT('id', ?)))`,
      [curYear, userId, userId]
    )
    const years = []
    for (let y = Number(minYear); y <= curYear; y++) years.push(y)

    res.json({ year, months, curPct, delta, years })
  } catch (err) {
    console.error('getTaskStats error:', err)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

// GET /api/analytics/task-report?year=YYYY[&month=M]
exports.getTaskReport = async (req, res) => {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ message: 'Не авторизован' })

  const year  = parseInt(req.query.year)  || new Date().getFullYear()
  const month = parseInt(req.query.month) || null

  const MONTHS_RU = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']

  function safeJSON(val, fb) {
    if (Array.isArray(val)) return val
    try { return JSON.parse(val || '[]') } catch { return fb }
  }

  function fmtDate(d) {
    if (!d) return '—'
    const dt = new Date(d)
    if (isNaN(dt)) return '—'
    return `${String(dt.getDate()).padStart(2,'0')}.${String(dt.getMonth()+1).padStart(2,'0')}.${dt.getFullYear()}`
  }

  try {
    const params = [userId, userId, year]
    const monthFilter = month ? 'AND MONTH(t.deadline) = ?' : ''
    if (month) params.push(month)

    const [rows] = await db.execute(
      `SELECT
         t.id, t.title, t.description, t.lists, t.participants, t.enterprise, t.deadline,
         MONTH(t.deadline) AS month,
         tc.title AS catTitle
       FROM tasks t
       LEFT JOIN tasks_category tc ON t.id_category = tc.id_category
       WHERE (t.user_id = ? OR JSON_CONTAINS(t.participants, JSON_OBJECT('id', ?)))
         AND t.deadline IS NOT NULL
         AND YEAR(t.deadline) = ?
         ${monthFilter}
       ORDER BY t.deadline ASC`,
      params
    )

    const monthMap = {}
    for (const row of rows) {
      const m = Number(row.month)
      if (!monthMap[m]) monthMap[m] = { month: m, tasks: [] }
      monthMap[m].tasks.push({
        id:           row.id,
        title:        row.title || '',
        description:  row.description || '',
        lists:        safeJSON(row.lists, []),
        participants: safeJSON(row.participants, []),
        enterprise:   row.enterprise || '',
        deadline:     fmtDate(row.deadline),
        isCompleted:  row.catTitle === 'Готово',
      })
    }

    const months = Object.values(monthMap).sort((a, b) => a.month - b.month)
    for (const m of months) {
      m.total     = m.tasks.length
      m.done      = m.tasks.filter(t => t.isCompleted).length
      m.pct       = m.total > 0 ? Math.round((m.done / m.total) * 100) : 0
      m.monthName = MONTHS_RU[m.month - 1]
      for (const t of m.tasks) {
        t.contribution = (t.isCompleted && m.done > 0) ? Math.round(m.pct / m.done) : 0
      }
    }

    const period = month ? `${MONTHS_RU[month - 1]} ${year}` : `${year}`
    res.json({ year, month: month || null, period, months })
  } catch (err) {
    console.error('getTaskReport error:', err)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

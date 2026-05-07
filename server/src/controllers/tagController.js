const GlobalTag = require('../models/globalTagModel')
const Employee  = require('../models/employeeModel')

async function requireAdmin(req, res) {
  const user = await Employee.findById(req.user?.id)
  if (user?.role !== 'администратор') {
    res.status(403).json({ message: 'Только администратор' })
    return false
  }
  return true
}

// GET /api/tags?scope=task|note
exports.getByScope = async (req, res) => {
  try {
    const scope = req.query.scope
    if (!scope) return res.status(400).json({ message: 'scope обязателен' })
    const tags = await GlobalTag.findByScope(scope)
    res.json(tags)
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}

// POST /api/tags
exports.create = async (req, res) => {
  try {
    if (!await requireAdmin(req, res)) return
    const { scope, label, bg, color } = req.body
    if (!scope || !label) return res.status(400).json({ message: 'scope и label обязательны' })
    const tag = await GlobalTag.create(scope, label, bg, color)
    res.status(201).json(tag)
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}

// PUT /api/tags/:id
exports.update = async (req, res) => {
  try {
    if (!await requireAdmin(req, res)) return
    const { label, bg, color } = req.body
    if (!label) return res.status(400).json({ message: 'label обязателен' })
    await GlobalTag.update(parseInt(req.params.id), label, bg, color)
    res.json({ message: 'Тег обновлён' })
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}

// DELETE /api/tags/:id
exports.remove = async (req, res) => {
  try {
    if (!await requireAdmin(req, res)) return
    await GlobalTag.delete(parseInt(req.params.id))
    res.json({ message: 'Тег удалён' })
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера', error: err.message })
  }
}

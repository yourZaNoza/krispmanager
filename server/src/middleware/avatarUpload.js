const multer = require('multer')
const path   = require('path')
const fs     = require('fs')

const UPLOADS_DIR = path.join(__dirname, '../../uploads/avatars')
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg'
    cb(null, `${req.user.id}-${Date.now()}${ext}`)
  },
})

module.exports = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.mimetype)
    cb(ok ? null : new Error('Недопустимый тип файла'), ok)
  },
})

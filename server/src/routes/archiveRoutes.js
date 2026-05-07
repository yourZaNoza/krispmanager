const express = require('express')
const router = express.Router()
const auth = require('../middleware/authMiddleware')
const ctrl = require('../controllers/archiveController')

router.get('/employees',          auth, ctrl.getEmployees)
router.get('/users/:id/tasks',    auth, ctrl.getUserTasks)
router.get('/users/:id/notes',    auth, ctrl.getUserNotes)

module.exports = router

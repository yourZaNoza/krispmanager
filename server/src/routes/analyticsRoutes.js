const router = require('express').Router()
const auth   = require('../middleware/authMiddleware')
const ctrl   = require('../controllers/analyticsController')

router.get('/summary',       auth, ctrl.getSummary)
router.get('/participating', auth, ctrl.getParticipating)
router.get('/task-stats',    auth, ctrl.getTaskStats)
router.get('/task-report',   auth, ctrl.getTaskReport)
router.get('/enterprises',   auth, ctrl.getEnterprises)

module.exports = router

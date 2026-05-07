const router = require('express').Router()
const ctrl   = require('../controllers/helpController')

router.post('/', ctrl.sendHelp)

module.exports = router

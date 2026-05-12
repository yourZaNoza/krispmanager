const express      = require("express");
const router       = express.Router();
const authController = require("../controllers/authController");
const auth         = require("../middleware/authMiddleware");
const avatarUpload = require("../middleware/avatarUpload");

router.post("/register",      authController.register);
router.post("/login",         authController.login);
router.get("/me",             auth, authController.me);
router.put("/profile",        auth, authController.updateProfile);
router.get("/users",          auth, authController.getAllUsers);
router.put("/users/:id/role",   auth, authController.updateUserRole);
router.delete("/users/:id",     auth, authController.deleteUser);
router.post("/avatar",        auth, avatarUpload.single("avatar"), authController.uploadAvatar);
router.get("/avatars",        auth, authController.getAllAvatars);

module.exports = router;

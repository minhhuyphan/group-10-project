const express = require('express');
const router = express.Router();
const userController = require('../controllers/usercontroller');
const authController = require('../controllers/authController');

router.get('/users', userController.getUsers);
router.post('/users', userController.createUser);
router.put('/users/:id', userController.updateUser);   // PUT
router.delete('/users/:id', userController.deleteUser); // DELETE

// Authentication routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);

module.exports = router;

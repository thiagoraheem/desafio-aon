const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const multer = require('multer');

// Configurar upload de arquivos CSV
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// Rotas CRUD + CSV
router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.post('/upload', upload.single('file'), userController.batchUploadUsers);

module.exports = router;

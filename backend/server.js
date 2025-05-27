require('dotenv').config();
const app = require('./app');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3001;

// Garante que a pasta 'uploads' existe
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}
);


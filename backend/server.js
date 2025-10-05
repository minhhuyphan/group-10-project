const express = require('express');
const app = express();
app.use(express.json());
const userRoutes = require('./routes/user');
app.use('/', userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

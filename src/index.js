require('dotenv').config();
require('./db/connect');
const cors = require('cors');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

// Routes
const routes = require('./routes/index.js');

app.use(cors());
app.use(express.json())

// Loading all The routes
app.use("/api/v1/", routes);

// Starting the app
app.listen(PORT, () => console.log('Server is listening to port =>', PORT))
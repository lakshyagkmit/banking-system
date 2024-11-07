const express = require('express');
const cors = require('cors');
const process = require('process');
const { sequelize } = require('./models');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

const dbConnect = async function () {
  try {
    await sequelize.authenticate();
    console.log('Database connected Successfully');
  } catch (err) {
    console.log('Error generated while connected to database', err);
  }
};

dbConnect();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.send({ message: 'health ok !' });
});

app.listen(PORT, () => {
  console.log(`server is running on port:${PORT}`);
});

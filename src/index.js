const express = require('express');
const cors = require('cors');
const process = require('process');
const { sequelize } = require('./models');
const router = require('./routes');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

const dbConnect = async function () {
  try {
    await sequelize.authenticate();
    console.log('Database connected Successfully');
    require('./schedulers');
  } catch (err) {
    console.log('Error generated while connected to database', err);
  }
};

dbConnect();

const app = express();

const swaggerDocument = YAML.load(path.join(__dirname, './swagger/swagger.yaml'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.send({ message: 'health ok !' });
});

router.registerRoutes(app);

app.listen(PORT, () => {
  console.log(`server is running on port:${PORT}`);
});

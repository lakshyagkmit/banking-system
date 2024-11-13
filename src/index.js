const express = require('express');
const cors = require('cors');
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const app = express();

app.use(cors());
app.use(express.json());


app.get('/health', (req, res) => {
	res.send({message: 'health ok !'});
})

app.listen(PORT, () => {
	console.log(`server is running on port:${PORT}`);
})
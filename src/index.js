require('dotenv').config();
const express = require("express");
const cors = require('cors');
const app = express();
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerAutogen = require('swagger-autogen')();
require('../src/services/common-services/listen-common.service.js');
require('../src/services/common-services/transaction-common.service.js');
require('../src/services/common-services/cron-job.service.js');

const outputFile = './swagger_output.json';
const endpointsFiles = ['./routes/*.js'];

const doc = {
    info: {
        title: 'Richie Rich API',
        description: 'Richie Rich API Develop in Nodejs + MySQL',
    },
    host: '',
    schemes: '',
};

swaggerAutogen(outputFile, endpointsFiles, doc);

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 min
    limit: 2000,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many requests from this IP, please try again after some time'
        });
    }
});
app.use(limiter);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(require('./swagger_output.json')));

app.use(require("./routes/tier.route.js"));
app.use(require("./routes/transaction.route.js"));

app.use((req, res, next) => {
    res.status(404).json({ success: false, message: "Route not found!" });
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`SERVER IS RUNNING ON PORT ${PORT}`);
});
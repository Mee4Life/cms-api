require('dotenv').config()
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const upload = require('express-fileupload');

//body parser middleware
app.use(bodyParser.json());
app.use(upload());

//Routes :
const usersRoute = require('./routes/users');
app.use('/users', usersRoute);

app.listen(3000, () => {
    console.log("Server working on Port: 3000");
});
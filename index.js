require('dotenv').config()
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

//body parser middleware
app.use(bodyParser.json())

//Routes :
const usersRoute = require('./routes/users');
app.use('/users', usersRoute);

app.listen(3000, () => {
    console.log("Server working on Port: 3000");
});
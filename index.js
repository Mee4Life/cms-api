require('dotenv').config()
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const upload = require('express-fileupload');

// connect to the database :
const mongoose = require('mongoose');
mongoose.set({ 'useFindAndModify': false });
mongoose.set('useCreateIndex', true);
mongoose.connect(process.env.DB_HOST,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
// check if the we connected to db or not 
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log('connected to the mongo db !!');
});

//body parser middleware
app.use(bodyParser.json());
app.use(upload());

//Routes :
const usersRoute = require('./routes/users');
app.use('/users', usersRoute);
// get profile images : 
const userProfileImgRoute = require('./routes/getUserImg');
app.use('/', userProfileImgRoute);
//categories:
const categoryRouter = require('./routes/categories');
app.use('/categories', categoryRouter);
//posts:
const postRouter = require('./routes/posts');
app.use('/posts', postRouter);
//tags:
const tags = require('./routes/tags');
app.use('/tags', tags);
//search:
const searchRoute = require('./routes/search');
app.use('/search', searchRoute);
//file:
const fileRoute = require('./routes/getFiles');
app.use('/file', fileRoute);

app.listen(3000, () => {
    console.log("Server working on Port: 3000");
});
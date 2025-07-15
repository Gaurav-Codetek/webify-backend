const express = require("express");
const session = require("express-session");
const passport = require('passport');
require('./passport-config');
// const redisClient = require('./redis');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const mongoose = require("mongoose");
const mongo = require('./db/conn')
const bodyParser = require("body-parser");
const PORT = 8333;
const useRoute = require('./routes/router');
const authRouter = require('./routes/authRouter');
const app = express();
app.use(express.json());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
mongo();

app.use(session({
    secret: `${process.env.SECRET_KEY}`,
    resave: false,
    saveUninitialized:false,
    cookie:{
        maxAge:30*24*60*30*1000, // 30 days
        sameSite: 'none',
        secure: true  //set true if in production
    }
}))
app.use(passport.initialize());
app.use(passport.session());

// redisClient.connect(console.log("Redis connected")).catch(console.error);
app.use('/', useRoute);
app.use('/auth', authRouter);

app.listen(PORT, ()=>{
    console.log("Server running at port", PORT);
})
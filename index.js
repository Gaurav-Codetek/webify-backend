const express = require("express");
const session = require("express-session");
const passport = require('passport');
require('./passport-config');
// const redisClient = require('./redis');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const mongoose = require("mongoose");
const MongoStore = require('connect-mongo');
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
app.set('trust proxy', 1);
app.use(session({
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.DB_CONN }),
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    sameSite: 'lax',
    secure: true
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// redisClient.connect(console.log("Redis connected")).catch(console.error);
app.use('/', useRoute);
app.use('/auth', authRouter);

app.listen(PORT, ()=>{
    console.log("Server running at port", PORT);
})
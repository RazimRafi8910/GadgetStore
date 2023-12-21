const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const flash = require("express-flash");
const errorHandler = require('./middleware/errorMiddleware');
const initializePassport = require('./config/passport');
const passport = require('passport');
const dbConnection = require("./config/dbConnection");
const userRouter = require("./routes/user");
const adminRouter = require('./routes/admin');
const dotenv = require("dotenv")
const app = express();
dotenv.config();

const PORT = process.env.PORT || 3000;

//view engine
app.set("view engine", "ejs");

//middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(session({ secret: process.env.SESSIONKEY, resave: false, saveUninitialized: false, }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash())

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache,no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

//initalizing passport 
initializePassport(passport);

//database connection
dbConnection();

//routers
app.use("/", userRouter);
app.use('/admin', adminRouter);

//404 page not found error
app.all('*', (req, res,next) => {
  const error = new Error(`404 page not found ${req.path}`)
  next(error);
})
//error handler
app.use(errorHandler)

app.listen(PORT, () => {
  console.log("server is running on " + PORT);
});

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
//
var hbs = require('express-handlebars')
// Require handlebars and just-handlebars-helpers
const Handlebars = require('handlebars');
const H = require('just-handlebars-helpers');
H.registerHelpers(Handlebars);
var db = require('./config/connection');
var session = require('express-session');
var usersRouter = require('./routes/users');
//var driveRouter = require('./routes/drive')

var app = express();
var MongoStore=require('connect-mongo')(session);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs',hbs({extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layout/',partialsDir:__dirname+'/views/partials'}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

db.connect((err)=>{

  if(err)
  console.log("Db Connection error"+err);
  else
  console.log("Db connected");
});
app.use(session({secret:'Key',
cookie:{maxAge:600000},
resave: true,
saveUninitialized: true,
store:new MongoStore({url:'mongodb://localhost:27017/shopping'}),
}))


app.use('/', usersRouter);
//app.use('/drive',driveRouter);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

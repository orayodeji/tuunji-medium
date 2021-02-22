const express = require('express');
const path = require('path')
const dotenv = require('dotenv');
const morgan = require('morgan');
const exphbs = require('express-handlebars');
const connectDB = require('./config/db')
const passport = require('passport')
const session = require('express-session');
const Mongoose  = require('mongoose');
const MongoStore = require('connect-mongo')(session);
const methodOverride = require('method-override')


//load config
dotenv.config({path: './config/config.env'})

//express app
const app = express();

//body parser
app.use(express.urlencoded({extended: false}))
app.use(express.json())

//method override
app.use(methodOverride(function (req, res){
    if(req.body && typeof req.body === 'object' && '_method' in req.body){
        //look in the urlencoded Post bodies and delete it 
        let method = req.body._method
        delete req.body._method
        return method
    }
}))

//static folder
app.use(express.static(path.join(__dirname, 'public')))

//connect db
connectDB()

//passport config
require('./config/passport')(passport)

//logging 
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'))
}


///handlerbas helpers
const { formatDate, stripTags, truncate, editIcon, select } = require('./helpers/hbs')
//handlebars
app.engine('.hbs', exphbs({helpers: {formatDate, stripTags, truncate, editIcon, select}, defaultLayout: 'main', extname: '.hbs'}));
app.set('view engine', '.hbs');


//express session middleware
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({mongooseConnection: Mongoose.connection})
}))

//passport middleware
app.use(passport.initialize());
app.use(passport.session())

//set global variable
app.use(function(req, res, next){
    res.locals.user = req.user  || null
    next()
})

//routers
app.use('/', require('./routes/index'))
app.use('/auth', require('./routes/auth'))
app.use('/stories', require('./routes/stories'))

const PORT = process.env.PORT || 5000;
app.listen(PORT, console.log(`server running in ${process.env.NODE_ENV} mode on port ${PORT}`))
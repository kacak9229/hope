/* THIRD PARTY LIBRARIES */
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const expressHbs = require('express-handlebars');
const nunjucks = require('nunjucks');
const socketioJwt   = require("socketio-jwt");

const config = require('./config/secret');
global.config = config;

const app = express();
const server = require('http').Server(app);

//Initialize twilio
//const blinkTwilio = require('./modules/blink-twilio');

const io = require('./modules/socketio')(server);

io.use(socketioJwt.authorize({
  secret: config.secret,
  handshake: true
}));

/* Connecting to the MongoDB database */
mongoose.connect(config.database, { useMongoClient: true }, (err) => {
  if (err) console.log(err);
  console.log("Connected to the database");
});

app.use(helmet());
/* Middlewares for setting up templates and static folders - SPECIFICALLY FOR BUILDING WEB PAGES LATER ON */
nunjucks.configure('views', {
    autoescape: true,
    express: app,
    watch: true,
    noCache: true
});

app.set('view engine', 'html');
app.use(express.static(__dirname + '/public'));
/* END */

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/* APIS'S URL */
const accountRoutes = require('./routes/account');
const passengerRoutes = require('./routes/passenger');
const driverRoutes = require('./routes/driver');
const jobRoutes = require('./routes/job');
const webRoutes = require('./routes/web');
//const twilioRoutes = require('./routes/twilio');
const reviewRoutes = require('./routes/review');

app.use('/api/accounts', accountRoutes);
app.use('/api/passengers', passengerRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/jobs', jobRoutes);
//app.use('/api/pin', twilioRoutes);
app.use('/api/review', reviewRoutes);
app.use(webRoutes);
/* END APIS'S URL */

server.listen(config.port, (err) => {
  if (err) console.log(err);
  console.log(`Running on port ${config.port}`);
});

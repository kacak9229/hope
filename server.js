/* THIRD PARTY LIBRARIES */
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const expressHbs = require('express-handlebars');

const config = require('./config/secret');
global.config = config;

const app = express();

/* Connecting to the MongoDB database */
mongoose.connect(config.database, { useMongoClient: true }, (err) => {
  if (err) console.log(err);
  console.log("Connected to the database");
});

app.use(helmet());
/* Middlewares for setting up templates and static folders - SPECIFICALLY FOR BUILDING WEB PAGES LATER ON */
app.engine('.hbs', expressHbs({ defaultLayout: 'layout', extname: '.hbs' }));
app.set('view engine', '.hbs');
app.use(express.static(__dirname + '/public'));
/* END */

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/* Middleware for checking verifying web token */
/*
app.use((req, res, next) => {
  // check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token || req.headers['x-access-token'];
  // decode token
  if (token) {
    // verifies secret and checks exp
    jwt.verify(token, config.secret, function(err, decoded) {
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' });
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;
        next();
      }
    });
  } else {
    // if there is no token
    // return an error
    return res.status(403).send({
        success: false,
        message: 'No token provided.'
    });
  }
});
*/

/* APIS'S URL */
const accountRoutes = require('./routes/account');
const passengerRoutes = require('./routes/passenger');
const driverRoutes = require('./routes/driver');
const jobRoutes = require('./routes/job');
const webRoutes = require('./routes/web');

app.use('/api/accounts', accountRoutes);
app.use('/api/passengers', passengerRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/jobs', jobRoutes);
app.use(webRoutes);
/* END APIS'S URL */

app.listen(config.port, (err) => {
  if (err) console.log(err);
  console.log(`Running on port ${config.port}`);
});

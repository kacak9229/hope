const router = require('express').Router()
const User = require('../models/user');

const jwt = require('jsonwebtoken');
const config = require('../config/secret');
const JWT_EXPIRE = 3600 * 24 * 365;

/* Router for facebook-login - Most of the OAUTH stuff is done by the frontend */
//TODO: have different end points for different user types
//Or send the role from the mobile
router.post('/facebook-login', (req, res, next) => {
  User.findOne({ facebookId: req.body.facebookId }, function(err, user) {

    // If user does exist then create a jsonwebtoken then send to the client
    if (user) {
      var token = jwt.sign(user, config.secret, {
       expiresIn: JWT_EXPIRE
     });
     return res.json({
       status: 201,
       token: token
     });
    } else {
      // If user doesn't exist then simply create a new user object
      var user = new User()
      user.email = req.body.email
      user.firstName = req.body.first_name
      user.lastName = req.body.last_name
      user.facebookId = req.body.facebookId
      user.photo = req.body.pictureURL
      user.save(function(err) {
        var token = jwt.sign(user, config.secret, {
          expiresIn: JWT_EXPIRE
        });

       return res.json({
         status: 201,
         token: token
       });
     });
    }
  });
});

// Driver route
// router.post()

module.exports = router;

const router = require('express').Router()
const User = require('../models/user');

const jwt = require('jsonwebtoken');
const config = require('../config/secret');


/* Router for facebook-login - Most of the OAUTH stuff is done by the frontend */
router.post('/facebook-login', (req, res, next) => {

  console.log(req.body)
  User.findOne({ facebookId: req.body.facebookId }, function(err, user) {

    // If user does exist then create a jsonwebtoken then send to the client
    if (user) {
      var token = jwt.sign(user, config.secret, {
       expiresIn: 1440 // expires in 24 hours
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
          expiresIn: 1440 // expires in 24 hours
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
router.post()

module.exports = router;

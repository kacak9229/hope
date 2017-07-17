const router = require('express').Router();
const User = require('../models/user');
const Job = require('../models/job');

/* BOOK ME A DRIVER - Haven't completed */
router.post('/book', (req, res, next) => {
  let job = new Job();
  job.passenger_id = req.decoded._id;
  // Current User's
  job.source_location.address = req.body.source_formatted_address;
  job.source_location.coordinates.lat = req.body.source_lat;
  job.source_location.coordinates.long = req.body.source_long;
  // Where to -> location
  job.to_location.address = req.body.dest_formatted_address;
  job.to_location.coordinates.lat = req.body.dest_lat;
  job.to_location.coordinates.long = req.body.source_long;

  job.save();
  // EventEmitter.emit('findDriver', job);
  res.json(job);

});

/* GET USER'S PROFILE */
router.get('/profile', (req, res, next) => {
  User.findOne({ _id: req.decoded._id }, (err, user) => {
      if (user) {
        res.json(user);
      } else {
        res.json("User doesn't exist");
      }
  });
});

module.exports = router;

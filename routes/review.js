const router = require('express').Router();
const Review = require('../models/review');
const checkJWT = require('../middlewares/checking-jwt');


router.post('/', checkJWT, (req, res, next) => {
  const jobId = req.body.jobId;
  const star = req.body.star;
  const comment = req.body.comment;

  let review = new Review();
  review.job = jobId;
  review.comment = comment;
  review.star = parseInt(star);

  review.save();

  res.json({
      status: 'OK'
  });
});

module.exports = router;

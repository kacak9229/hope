const router = require('express').Router();

// HTTP post for jobs
router.post('/jobs/reserve', function(req, res, next) {
  job = req.body.job;
  driver_id = req.body.driver_id;

  //Add to FIFO queue - BEANSTALKD
  // reserveJobQueue.add('reserveJob' {job: job, driver_id: driver_id});
});

module.exports = router;

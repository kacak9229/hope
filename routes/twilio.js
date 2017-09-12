const logger = require('./../modules/logger');
const router = require('express').Router();
const checkJWT = require('../middlewares/checking-jwt');
const blinkTwilio = require('./../modules/blink-twilio');


router.post('/', checkJWT, (req, res, next) => {
    let phoneNumber = req.body.phoneNumber;

    blinkTwilio.sendPIN(phoneNumber, function(result) {
      logger.info(result);

      //TODO: Handle errors here when needed
      res.json({
          status: 'OK'
      });
    })
});

router.post('/verify', checkJWT, (req, res, next) => {
    let phoneNumber = req.body.phoneNumber;
    let pin = req.body.pin;

    blinkTwilio.verifyPIN(phoneNumber, pin, function(err, matched) {
        logger.error(err);

        if(err) {
          res.json({
              status: 'Error'
          })
        }
        else {
          res.json({
             status: matched === true ? 'OK' : 'INVALID'
          });
        }
    })
});

module.exports = router;

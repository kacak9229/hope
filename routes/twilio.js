const logger = require('./../modules/logger');
const router = require('express').Router();
const checkJWT = require('../middlewares/checking-jwt');
const blinkTwilio = require('./../modules/blink-twilio');

const customerManager = require('./../modules/customer-manager');


router.post('/', checkJWT, (req, res, next) => {
    logger.debug('Req for sending pin to: ', req.body.phoneNumber);
    let phoneNumber = req.body.phoneNumber;

    //TODO: validate phone number
    if(!phoneNumber) {
        logger.warn('Invalid phone number: ', req.body.phoneNumber);
        return res.status(400).json({
            status: 'Invalid',
        });
    }

    blinkTwilio.sendPIN(phoneNumber, (err, result) => {
      logger.info(err, result);

      //TODO: Handle errors here when needed
      res.json({
          status: 'OK'
      });
    })
});

router.post('/verify', checkJWT, (req, res, next) => {
    logger.debug('Verify pin for: ', req.body.phoneNumber);

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

          if(matched) {
              //get fb id
              const fbid = req.decoded.facebookId;
              customerManager.findByFacebookId(fbid)
                  .then(u => {
                      u.phone = phoneNumber;
                      u.save();
                      logger.info('Saved verified phone number!', u);
                  })
                  .catch(err => {
                      logger.error(err);
                  });
          }
        }
    })
});

module.exports = router;

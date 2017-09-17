const redisClient = require('./redis').client;
const logger = require('./logger');

//TODO: decouple redis from twilio. Redis should communicate using events

const client = require('twilio')(
    global.config.twilio.TWILIO_ACCOUNT_SID,
    global.config.twilio.TWILIO_AUTH_TOKEN
);

//IN SECS
const PIN_VALID_FOR = 5 * 60;

function sendSMS(phoneNumber, body, cb) {
    client.messages.create({
        from: global.config.twilio.TWILIO_PHONE_NUMBER,
        to: phoneNumber,
        body: body
    })
        .then(msg => cb(null, msg))
        .catch((err) => {
            cb(err);
        });
}

function sendPIN(phoneNumber, cb) {
    const pin = Math.floor(1000 + Math.random() * 9000);
    sendSMS(phoneNumber, pin, function(msg) {
        redisClient.set(phoneNumber, pin);
        redisClient.expire(phoneNumber, PIN_VALID_FOR);

        cb(msg);
    });
}

function verifyPIN(phoneNumber, pin, cb) {
    redisClient.get(phoneNumber, function(err, savedPIN) {
        if(err) cb(new Error(err));
        else {
            cb(null, pin === savedPIN);

            //remove the key from redis if pin matched
            if(pin === savedPIN) {
                redisClient.del(phoneNumber);
            }
        }
    });
}

module.exports = {
    sendPIN: sendPIN,
    verifyPIN: verifyPIN
};
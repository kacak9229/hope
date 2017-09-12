const redisClient = require('./redis').client;

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
    }).then(msg => cb(msg));
}

function sendPIN(phoneNumber, cb) {
    const pin = Math.floor(1000 + Math.random() * 9000);
    sendSMS(phoneNumber, pin, function(msg) {
        console.info('TWILIO: SMS result: ', msg);

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
        }
    });
}

module.exports = {
    sendPIN: sendPIN,
    verifyPIN: verifyPIN
};
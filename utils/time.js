const { toZonedTime } = require('date-fns-tz');

const SCHOOL_TZ = 'Europe/Sarajevo';

function now() {
    return toZonedTime(new Date(), SCHOOL_TZ);
}

module.exports = { now };

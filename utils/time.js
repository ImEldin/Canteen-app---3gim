const { toZonedTime } = require('date-fns-tz');

const SCHOOL_TZ = 'Europe/Sarajevo';

function getNow() {
    return toZonedTime(new Date(), SCHOOL_TZ);
}

module.exports = { getNow };

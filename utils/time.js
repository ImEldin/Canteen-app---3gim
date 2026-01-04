const { utcToZonedTime } = require('date-fns-tz');

const SCHOOL_TZ = 'Europe/Sarajevo';

function now() {
    return utcToZonedTime(new Date(), SCHOOL_TZ);
}

module.exports = { now };

const sse = require("../realtime/sse");

module.exports = {
    connect(req, res) {
        try {
            return sse.register(req, res);
        } catch (err) {
            console.error("SSE error:", err);
            res.sendStatus(500);
        }
    }
};

const canteenClients = new Set();
const userClients = new Map();

function register(req, res) {
    const user = req.session.user;
    if (!user) return res.sendStatus(401);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    if (user.role === "kantina") {
        canteenClients.add(res);
    } else {
        if (!userClients.has(user.id)) {
            userClients.set(user.id, new Set());
        }
        userClients.get(user.id).add(res);
    }

    req.on("close", () => {
        canteenClients.delete(res);
        userClients.get(user.id)?.delete(res);
    });
}

function notifyCanteen() {
    canteenClients.forEach(res => {
        res.write(`event: orders_changed\n\n`);
    });
}

function notifyUser(userId) {
    const set = userClients.get(userId);
    if (!set) return;

    set.forEach(res => {
        res.write(`event: orders_changed\n\n`);
    });
}

module.exports = { register, notifyCanteen, notifyUser };

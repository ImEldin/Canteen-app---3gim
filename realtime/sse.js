const canteenClients = new Set();
const userClients = new Map();

function register(req, res) {
    const user = req.session.user;
    if (!user) return res.sendStatus(401);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    res.write(`event: connected\ndata: {}\n\n`);

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
        res.write(`event: orders_changed\ndata: {}\n\n`);
    });
}

function notifyUser(userId) {
    const set = userClients.get(userId);
    if (!set) return;

    set.forEach(res => {
        res.write(`event: orders_changed\ndata: {}\n\n`);
    });
}

setInterval(() => {
    const ping = `event: ping\ndata: {}\n\n`;
    canteenClients.forEach(res => res.write(ping));
    userClients.forEach(set => set.forEach(res => res.write(ping)));
}, 15000);

module.exports = { register, notifyCanteen, notifyUser };

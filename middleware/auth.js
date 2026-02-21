const jwt = require("jsonwebtoken");

exports.isLoggedIn = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.redirect("/login");

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        res.redirect("/login");
    }
};
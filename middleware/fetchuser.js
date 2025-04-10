var jwt = require('jsonwebtoken');
const JWT_SECRET = 'discountify';

const fetchuser = (req, res, next) => {
    // Get the user from the jwt token and add id to req object
    const token = req.header('auth-token');
    if (!token) {
        return res.status(401).send({ error: "Please authenticate using a valid token" }); // ✅ return here
    }

    try {
        const data = jwt.verify(token, JWT_SECRET);
        req.user = data.user;
        next(); // ✅ Only call next when no error
    } catch (error) {
        return res.status(401).send({ error: "Please authenticate using a valid token" }); // ✅ return here too
    }

}


module.exports = fetchuser;

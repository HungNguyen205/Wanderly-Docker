const { verifyAccessToken } = require("../utils/token");
const ROLES = require("../config/roles");

// Middleware bắt buộc đăng nhập
const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access token not found or invalid format"
            });
        }

        const token = authHeader.split(" ")[1];
        const decoded = verifyAccessToken(token);

        req.user = decoded;

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: "Token expired" });
        }
        return res.status(403).json({ success: false, message: "Invalid token" });
    }
};

// Middleware KHÔNG bắt buộc đăng nhập - chỉ parse token nếu có
const optionalToken = (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];

        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            const decoded = verifyAccessToken(token);
            req.user = decoded;
        } else {
            req.user = null;
        }

        next();
    } catch (error) {
        // Token không hợp lệ hoặc hết hạn -> bỏ qua, tiếp tục như guest
        req.user = null;
        next();
    }
};
const authorize = (allowedRoles = []) => {
    return (req, res, next) => {
        const userRoleId = parseInt(req.user.roleId, 10);
        if (!req.user || !userRoleId) {
            return res.status(403).json({
                success: false,
                message: "User role not found"
            });
        }

        if (allowedRoles.includes(userRoleId)) {
            next();
        } else {
            return res.status(403).json({
                success: false,
                message: "Forbidden: You do not have permission to access this resource"
            });
        }
    };
};

module.exports = {
    verifyToken,
    optionalToken,
    authorize
};
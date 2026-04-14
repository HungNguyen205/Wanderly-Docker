const authService = require("../services/authService");
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require("../utils/token");
const register = async (req, res) => {
    try {
        const result = await authService.registerUser(req.body);

        if (!result.success) {
            return res.status(result.code || 400).json({
                success: false,
                message: result.message,
            });
        }

        return res.status(result.code || 200).json({
            success: true,
            message: result.message,
        });

    } catch (err) {
        console.error("[Register Controller] Error:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}

const login = async (req, res) => {
    try {
        const result = await authService.loginUser(req.body);

        if (!result.success) {
            return res.status(result.code || 401).json({
                success: false,
                message: result.message,
            });
        }

        const payload = {
            id: result.data.id,
            roleId: result.data.RoleId
        };

        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false /*process.env.NODE_ENV === "production"*/,
            sameSite: "lax",
            path: "/api/auth/refresh"
        });

        return res.status(result.code || 200).json({
            success: true,
            message: result.message,
            user: result.data,
            accessToken,
        });

    } catch (err) {
        console.error("[Login Controller] Error:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required to request password reset." });
        }

        const result = await authService.forgotPassword({ email });

        if (result.success) {
            return res.status(200).json({
                success: true,
                message: "Nếu email tồn tại trong hệ thống, mã OTP đã được gửi đến hộp thư của bạn."
            });
        }

        return res.status(result.code || 500).json({
            success: false,
            message: result.message,
        });

    } catch (error) {
        console.error("[ForgotPassword Controller] Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during password reset request.",
        });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ success: false, message: "Email, OTP, and new password are required." });
        }

        const result = await authService.resetPassword({ email, otp, newPassword });

        if (!result.success) {
            return res.status(result.code || 400).json({
                success: false,
                message: result.message,
            });
        }

        return res.status(result.code || 200).json({
            success: true,
            message: result.message
        });

    } catch (error) {
        console.error("[ResetPassword Controller] Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during password reset.",
        });
    }
};

const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required." });
        }

        const serviceResult = await authService.loginAdmin(email, password);

        if (!serviceResult.success) {
            return res.status(serviceResult.code || 401).json({
                success: false,
                message: serviceResult.message,
            });
        }

        const user = serviceResult.data.user;

        const payload = {
            id: user.id,
            roleId: user.RoleId
        };

        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        // res.cookie("refreshToken", refreshToken, {
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === "production",
        //     sameSite: "Lax", 
        //     path: "/api/auth/refresh"
        // });

        return res.status(serviceResult.code || 200).json({
            success: true,
            message: serviceResult.message,
            user: user,
            accessToken,
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}
module.exports = {
    register,
    login,
    forgotPassword,
    resetPassword,
    adminLogin
}
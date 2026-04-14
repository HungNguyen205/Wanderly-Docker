const { sql, poolPromise } = require("../config/dbConfig");
const emailUtils = require('../utils/emailUtils');

/* ----------------------------
   ĐĂNG KÝ NGƯỜI DÙNG
---------------------------- */
const registerUser = async ({ fullName, email, password }) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .input("FullName", sql.NVarChar(100), fullName)
            .input("Email", sql.NVarChar(255), email)
            .input("Password", sql.NVarChar(255), password)
            .output("Result", sql.Int)
            .execute("sp_User_Register");

        const code = result.output.Result;

        if (code === -1) {
            return {
                success: false,
                code: 400,
                message: "This email is already taken."
            };
        }

        if (code === -99) {
            return {
                success: false,
                code: 500,
                message: "Database error during registration."
            };
        }

        return {
            success: true,
            code: 200,
            message: "Registration successful! Please log in to continue."
        };

    } catch (error) {
        console.error("[registerUser] Error:", error);
        return {
            success: false,
            code: 500,
            message: "System error during registration.",
            error: error.message
        };
    }
};

/* ----------------------------
   ĐĂNG NHẬP NGƯỜI DÙNG
---------------------------- */
const loginUser = async ({ email, password }) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .input("Email", sql.NVarChar(255), email)
            .input("Password", sql.NVarChar(255), password)
            .output("Result", sql.Int)
            .execute("sp_User_Login");

        const code = result.output.Result;

        switch (code) {
            case 1: {
                // Lấy thông tin user từ recordset trả về bởi Stored Procedure
                const user = result.recordset[0];
                if (!user) throw new Error("User data not found in result set.");

                const name = user.FullName ? user.FullName.trim().split(" ").at(-1) : "User";

                return {
                    success: true,
                    code: 200,
                    message: `Welcome back, ${name}!`,
                    data: {
                        id: user.UserId,
                        fullName: user.FullName,
                        email: user.Email,
                        roleId: user.RoleId
                    }
                };
            }
            case 0:  // SAI MẬT KHẨU (Result = 0 trong SQL)
            case -1: // KHÔNG TÌM THẤY EMAIL
                return {
                    success: false,
                    code: 401,
                    message: "Incorrect email or password. Please try again."
                };
            case -2:
                return {
                    success: false,
                    code: 403,
                    message: "Your account is inactive or locked.",
                };
            case -3:
                return {
                    success: false,
                    code: 410,
                    message: "This account has been deleted.",
                };
            default:
                return {
                    success: false,
                    code: 500,
                    message: "Unexpected error during login.",
                };
        }
    } catch (error) {
        console.error("[loginUser] Critical Error:", error);
        return {
            success: false,
            code: 500,
            message: "System error during login process.",
            error: error.message
        };
    }
};

/* ----------------------------
   QUÊN MẬT KHẨU & OTP
---------------------------- */
const forgotPassword = async ({ email }) => {
    try {
        const pool = await poolPromise;
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

        const result = await pool.request()
            .input("Email", sql.NVarChar(255), email)
            .input("Otp", sql.NVarChar(255), otpCode)
            .input("ExpiresAt", sql.DateTime2, expiresAt)
            .output("Result", sql.Int)
            .execute("sp_User_CreateOtp");

        const code = result.output.Result;

        if (code === 1) {
            const emailResult = await emailUtils.sendOtpEmail(email, otpCode, expiresAt);
            if (emailResult.success) {
                return {
                    success: true,
                    code: 200,
                    message: "OTP has been sent to your email. Please check your inbox.",
                };
            }
            return {
                success: false,
                code: 500,
                message: "System error: OTP created but failed to send email.",
            };
        }

        return {
            success: false,
            code: 500,
            message: "Database error during OTP creation."
        };

    } catch (error) {
        console.error("[forgotPassword] Error:", error);
        return {
            success: false,
            code: 500,
            message: "System error during password recovery request.",
            error: error.message
        };
    }
};

/* ----------------------------
   RESET MẬT KHẨU
---------------------------- */
const resetPassword = async ({ email, otp, newPassword }) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .input("Email", sql.NVarChar(255), email)
            .input("Otp", sql.NVarChar(255), otp)
            .input("NewPassword", sql.NVarChar(255), newPassword)
            .output("Result", sql.Int)
            .execute("sp_User_ResetPasswordByOtp");

        const code = result.output.Result;

        switch (code) {
            case 1:
                return {
                    success: true,
                    code: 200,
                    message: "Password has been successfully reset. Please log in again."
                };
            case -1:
                return {
                    success: false,
                    code: 400,
                    message: "Invalid or expired OTP code."
                };
            case -2:
                return {
                    success: false,
                    code: 404,
                    message: "Email address not found."
                };
            default:
                return {
                    success: false,
                    code: 500,
                    message: "Database error during password reset."
                };
        }
    } catch (error) {
        console.error("[resetPassword] Error:", error);
        return {
            success: false,
            code: 500,
            message: "System error during password reset."
        };
    }
};

/* ----------------------------
   ĐĂNG NHẬP ADMIN
---------------------------- */
const loginAdmin = async (email, password) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .input("Email", sql.NVarChar(255), email)
            .input("Password", sql.NVarChar(255), password)
            .output("Result", sql.Int)
            .execute("sp_Admin_Login");

        const code = result.output.Result;

        switch (code) {
            case 1: {
                const user = result.recordset[0];
                const name = user.FullName ? user.FullName.trim().split(" ").at(-1) : "Admin";

                return {
                    success: true,
                    code: 200,
                    message: `Welcome back, Admin ${name}!`,
                    data: {
                        id: user.UserId,
                        fullName: user.FullName,
                        email: user.Email,
                        roleId: user.RoleId
                    }
                };
            }
            case 0:
            case -1:
                return {
                    success: false,
                    code: 401,
                    message: "Incorrect admin email or password."
                };
            case -2:
                return {
                    success: false,
                    code: 403,
                    message: "Admin account is locked."
                };
            default:
                return {
                    success: false,
                    code: 500,
                    message: "Unexpected error during admin login.",
                };
        }
    } catch (error) {
        console.error("[loginAdmin] Error:", error);
        return {
            success: false,
            code: 500,
            message: "System error during admin login.",
            error: error.message
        };
    }
};

module.exports = {
    registerUser,
    loginUser,
    forgotPassword,
    resetPassword,
    loginAdmin
};
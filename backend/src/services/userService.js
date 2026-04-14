const { sql, poolPromise } = require("../config/dbConfig");

const getUserById = async (id) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("UserId", sql.Int, id)
            .output("Result", sql.Int)
            .execute("sp_Users_GetById");

        const code = result.output.Result;

        if (code === -1) {
            return {
                success: false,
                code: 404,
                message: "User not found or has been deleted.",
            };
        }

        if (code === -99) {
            return {
                success: false,
                code: 500,
                message: "System error while retrieving user.",
            };
        }

        const user = result.recordset?.[0];
        return {
            success: true,
            code: 200,
            message: "User retrieved successfully.",
            data: user,
        };
    } catch (error) {
        console.error("[getUserById] Error", error);
        return {
            success: false,
            code: 500,
            message: "System error during registration.",
            error: error.message
        };
    }
};

const updateUserById = async (userId, FullName, PhoneNumber, ProfilePictureUrl, Bio) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("UserId", sql.Int, userId)
            .input("FullName", sql.NVarChar(100), FullName)
            .input("PhoneNumber", sql.NVarChar(20), PhoneNumber)
            .input("ProfilePictureUrl", sql.NVarChar(500), ProfilePictureUrl)
            .input("Bio", sql.NVarChar(1000), Bio)
            .output("Result", sql.Int)
            .execute("sp_Users_UpdateProfile");

        const code = result.output.Result;

        switch (code) {
            case 1:
                return {
                    success: true,
                    message: "Update successfull."
                };
            case -1:
                return {
                    success: false,
                    code: 400,
                    message: "Phone number already in use.",
                };
            case -2:
                return {
                    success: false,
                    code: 404,
                    message: "User not found.",
                };
            default:
                return {
                    success: false,
                    code: 500,
                    message: "System error.",
                };
        }
    } catch (error) {
        console.error("[updateUserById] Error", error);
        return {
            success: false,
            code: 500,
            message: "System error during registration.",
            error: error.message
        };
    }
};

const changePassword = async ({ userId, oldPassword, newPassword }) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .input("UserId", sql.Int, userId)
            .input("OldPassword", sql.NVarChar(255), oldPassword)
            .input("NewPassword", sql.NVarChar(255), newPassword)
            .output("Result", sql.Int)
            .execute("sp_Users_ChangePassword");

        const code = result.output.Result;

        switch (code) {
            case 1:
                return {
                    success: true,
                    code: 200,
                    message: "Password changed successfully."
                };
            case -1:
                return {
                    success: false,
                    code: 404,
                    message: "User not found or account is deactivated/deleted."
                };
            case -2:
                return {
                    success: false,
                    code: 400,
                    message: "Incorrect old password."
                };
            case -99:
                return {
                    success: false,
                    code: 500,
                    message: "Database error during password change."
                };
            default:
                return {
                    success: false,
                    code: 500,
                    message: "An unknown error occurred."
                };
        }

    } catch (error) {
        console.error("[changePassword] Error", error);
        return {
            success: false,
            code: 500,
            message: "System error during password change.",
            error: error.message
        };
    }
};

const followUser = async ({ followerId, followingId }) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .input("FollowerId", sql.Int, followerId)
            .input("FollowingId", sql.Int, followingId)
            .output("Result", sql.Int)
            .execute("sp_Users_Follow");

        const code = result.output.Result;

        switch (code) {
            case 1:
                return {
                    success: true,
                    code: 200,
                    message: "User followed successfully."
                };
            case -1:
                return {
                    success: false,
                    code: 400,
                    message: "Cannot follow yourself."
                };
            case -2:
                return {
                    success: false,
                    code: 409,
                    message: "You are already following this user."
                };
            case -99:
                return {
                    success: false,
                    code: 500,
                    message: "Database error during follow operation."
                };
            default:
                return {
                    success: false,
                    code: 500,
                    message: "An unknown error occurred."
                };
        }
    } catch (error) {
        console.error("[followUser] Error", error);
        return {
            success: false,
            code: 500,
            message: "System error during follow operation.",
            error: error.message
        };
    }
};

const unfollowUser = async ({ followerId, followingId }) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .input("FollowerId", sql.Int, followerId)
            .input("FollowingId", sql.Int, followingId)
            .output("Result", sql.Int)
            .execute("sp_Users_Unfollow");

        const code = result.output.Result;

        switch (code) {
            case 1:
                return {
                    success: true,
                    code: 200,
                    message: "User unfollowed successfully."
                };

            case 0:
                return {
                    success: false,
                    code: 400,
                    message: "Cannot unfollow yourself."
                };

            case -1:
                return {
                    success: false,
                    code: 404,
                    message: "You are not following this user."
                };

            case -99:
                return {
                    success: false,
                    code: 500,
                    message: "Database error during unfollow operation."
                };

            default:
                return {
                    success: false,
                    code: 500,
                    message: "An unknown error occurred."
                };
        }

    } catch (error) {
        console.error("[unfollowUser] System Error:", error.message);
        return {
            success: false,
            code: 500,
            message: "System error during unfollow operation.",
            error: error.message
        };
    }
};

const getFollowers = async (userId, page = 1, limit = 20) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("UserId", sql.Int, userId)
            .input("PageNumber", sql.Int, page)
            .input("PageSize", sql.Int, limit)
            .output("Result", sql.Int);

        const result = await request.execute("sp_Users_GetFollowers");
        const code = result.output.Result;

        if (code === 1) {
            const totalCount = result.recordsets[0]?.[0]?.TotalCount || 0;
            const followers = result.recordsets[1] || [];

            return {
                success: true,
                code: 200,
                data: {
                    followers: followers,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: totalCount,
                        totalPages: Math.ceil(totalCount / limit) || 0
                    }
                },
                message: "Followers retrieved successfully."
            };
        }

        return { success: false, code: 500, message: "System error." };
    } catch (error) {
        console.error("[getFollowers] Error", error);
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

const getFollowing = async (userId, page = 1, limit = 20) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("UserId", sql.Int, userId)
            .input("PageNumber", sql.Int, page)
            .input("PageSize", sql.Int, limit)
            .output("Result", sql.Int);

        const result = await request.execute("sp_Users_GetFollowing");
        const code = result.output.Result;

        if (code === 1) {
            const totalCount = result.recordsets[0]?.[0]?.TotalCount || 0;
            const following = result.recordsets[1] || [];

            return {
                success: true,
                code: 200,
                data: {
                    following: following,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: totalCount,
                        totalPages: Math.ceil(totalCount / limit) || 0
                    }
                },
                message: "Following retrieved successfully."
            };
        }

        return { success: false, code: 500, message: "System error." };
    } catch (error) {
        console.error("[getFollowing] Error", error);
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

const checkFollowStatus = async (followerId, followingId) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("FollowerId", sql.Int, followerId)
            .input("FollowingId", sql.Int, followingId)
            .output("IsFollowing", sql.Bit)
            .output("Result", sql.Int);

        const result = await request.execute("sp_Users_CheckFollowStatus");
        const code = result.output.Result;
        const isFollowing = result.output.IsFollowing === 1;

        if (code === 1) {
            return {
                success: true,
                code: 200,
                data: { isFollowing: isFollowing },
                message: "Follow status retrieved successfully."
            };
        }

        return { success: false, code: 500, message: "System error." };
    } catch (error) {
        console.error("[checkFollowStatus] Error", error);
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

module.exports = {
    getUserById,
    updateUserById,
    changePassword,
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    checkFollowStatus
};
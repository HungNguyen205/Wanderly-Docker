const { sql, poolPromise } = require('../config/dbConfig');

const toggleLike = async (postId, userId) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("PostId", sql.Int, postId)
            .input("UserId", sql.Int, userId)
            .output("IsLiked", sql.Bit)
            .output("Result", sql.Int);

        const result = await request.execute("sp_PostLikes_Toggle");
        const code = result.output.Result;
        const isLiked = result.output.IsLiked === 1;
        const likeCount = result.recordsets[0]?.[0]?.LikeCount || 0;

        if (code === 1) {
            return {
                success: true,
                code: 200,
                data: {
                    isLiked: isLiked,
                    likeCount: likeCount
                },
                message: isLiked ? "Post liked successfully." : "Post unliked successfully."
            };
        } else if (code === -1) {
            return { success: false, code: 404, message: "Post not found." };
        }

        return { success: false, code: 500, message: "Database error." };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

const getUsersWhoLiked = async (postId, page = 1, limit = 50) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("PostId", sql.Int, postId)
            .input("PageNumber", sql.Int, page)
            .input("PageSize", sql.Int, limit)
            .output("Result", sql.Int);

        const result = await request.execute("sp_PostLikes_GetByPostId");
        const code = result.output.Result;

        if (code === -1) {
            return { success: false, code: 404, message: "Post not found." };
        }

        const totalCount = result.recordsets[0]?.[0]?.TotalCount || 0;
        const users = result.recordsets[1] || [];

        return {
            success: true,
            code: 200,
            data: {
                users: users,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalCount,
                    totalPages: Math.ceil(totalCount / limit) || 0
                }
            },
            message: "Users retrieved successfully."
        };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

const checkUserLiked = async (postId, userId) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("PostId", sql.Int, postId)
            .input("UserId", sql.Int, userId)
            .output("IsLiked", sql.Bit)
            .output("Result", sql.Int);

        const result = await request.execute("sp_PostLikes_CheckUserLiked");
        const code = result.output.Result;
        const isLiked = result.output.IsLiked === 1;

        if (code === 1) {
            return {
                success: true,
                code: 200,
                data: { isLiked: isLiked },
                message: "Status retrieved successfully."
            };
        }

        return { success: false, code: 500, message: "Database error." };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

const getLikeCount = async (postId) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("PostId", sql.Int, postId)
            .output("LikeCount", sql.Int)
            .output("Result", sql.Int);

        const result = await request.execute("sp_PostLikes_GetCount");
        const code = result.output.Result;
        const likeCount = result.output.LikeCount || 0;

        if (code === 1) {
            return {
                success: true,
                code: 200,
                data: { likeCount: likeCount },
                message: "Like count retrieved successfully."
            };
        }

        return { success: false, code: 500, message: "Database error." };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

module.exports = {
    toggleLike,
    getUsersWhoLiked,
    checkUserLiked,
    getLikeCount
};


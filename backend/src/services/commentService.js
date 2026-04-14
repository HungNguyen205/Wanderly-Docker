const { sql, poolPromise } = require('../config/dbConfig');

const getCommentsByPostId = async (postId, currentUserId = null, page = 1, limit = 50) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("PostId", sql.Int, postId)
            .input("PageNumber", sql.Int, page)
            .input("PageSize", sql.Int, limit)
            .output("Result", sql.Int);

        if (currentUserId) {
            request.input("CurrentUserId", sql.Int, currentUserId);
        } else {
            request.input("CurrentUserId", sql.Int, null);
        }

        const result = await request.execute("sp_Comments_GetByPostId");

        const code = result.output.Result;

        if (code === -1) {
            return { success: false, code: 404, message: "Post not found." };
        }

        const totalCount = result.recordsets[0]?.[0]?.TotalCount || 0;
        const comments = result.recordsets[1] || [];

        return {
            success: true,
            code: 200,
            data: {
                comments: comments,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalCount,
                    totalPages: Math.ceil(totalCount / limit) || 0
                }
            },
            message: "Comments retrieved successfully."
        };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

const createComment = async (postId, userId, data) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("PostId", sql.Int, postId)
            .input("UserId", sql.Int, userId)
            .input("Content", sql.NVarChar(2000), data.Content)
            .input("ImageUrl", sql.NVarChar(500), data.ImageUrl || null)
            .input("ParentCommentId", sql.Int, data.ParentCommentId || null)
            .output("NewCommentId", sql.Int)
            .output("Result", sql.Int);

        const result = await request.execute("sp_Comments_Create");
        const code = result.output.Result;

        if (code === 1) {
            const comment = result.recordsets[0]?.[0];
            return {
                success: true,
                code: 201,
                data: comment,
                message: "Comment created successfully."
            };
        } else if (code === -1) {
            return { success: false, code: 404, message: "Post not found." };
        } else if (code === -2) {
            return { success: false, code: 404, message: "Parent comment not found." };
        }

        return { success: false, code: 500, message: "Database error during creation." };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

const updateComment = async (commentId, userId, data) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("CommentId", sql.Int, commentId)
            .input("UserId", sql.Int, userId)
            .input("Content", sql.NVarChar(2000), data.Content)
            .input("ImageUrl", sql.NVarChar(500), data.ImageUrl || null)
            .output("Result", sql.Int);

        const result = await request.execute("sp_Comments_Update");
        const code = result.output.Result;

        if (code === 1) {
            const comment = result.recordsets[0]?.[0];
            return {
                success: true,
                code: 200,
                data: comment,
                message: "Comment updated successfully."
            };
        } else if (code === -1) {
            return { success: false, code: 403, message: "Comment not found or you are not the author." };
        }

        return { success: false, code: 500, message: "Database error during update." };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

const deleteComment = async (commentId, userId) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("CommentId", sql.Int, commentId)
            .input("UserId", sql.Int, userId)
            .output("Result", sql.Int);

        const result = await request.execute("sp_Comments_Delete");
        const code = result.output.Result;

        if (code === 1) {
            return { success: true, code: 200, message: "Comment deleted successfully." };
        } else if (code === -1) {
            return { success: false, code: 403, message: "Comment not found or you are not the author." };
        }

        return { success: false, code: 500, message: "Database error during deletion." };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

const getReplies = async (commentId, currentUserId = null, page = 1, limit = 20) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("CommentId", sql.Int, commentId)
            .input("PageNumber", sql.Int, page)
            .input("PageSize", sql.Int, limit)
            .output("Result", sql.Int);

        if (currentUserId) {
            request.input("CurrentUserId", sql.Int, currentUserId);
        } else {
            request.input("CurrentUserId", sql.Int, null);
        }

        const result = await request.execute("sp_Comments_GetReplies");
        const code = result.output.Result;

        if (code === -1) {
            return { success: false, code: 404, message: "Comment not found." };
        }

        const totalCount = result.recordsets[0]?.[0]?.TotalCount || 0;
        const replies = result.recordsets[1] || [];

        return {
            success: true,
            code: 200,
            data: {
                replies: replies,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalCount,
                    totalPages: Math.ceil(totalCount / limit) || 0
                }
            },
            message: "Replies retrieved successfully."
        };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

module.exports = {
    getCommentsByPostId,
    createComment,
    updateComment,
    deleteComment,
    getReplies
};


const { sql, poolPromise } = require('../config/dbConfig');

const getPosts = async (page = 1, limit = 5, keyword, tagId, currentUserId = null) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("PageNumber", sql.Int, page)
            .input("PageSize", sql.Int, limit);

        if (keyword) request.input("Keyword", sql.NVarChar(300), keyword);
        if (tagId) request.input("TagId", sql.Int, tagId);
        if (currentUserId) request.input("CurrentUserId", sql.Int, currentUserId);
        else request.input("CurrentUserId", sql.Int, null);

        const result = await request.output("Result", sql.Int).execute("sp_Posts_GetList");

        // --- PHẦN SỬA ĐỔI ---
        // SP trả về 2 bảng: 
        // Bảng 0: Chứa 1 dòng TotalCount
        // Bảng 1: Chứa danh sách Posts

        const totalCount = result.recordsets[0][0]?.TotalCount || 0;
        const posts = result.recordsets[1] || [];

        return {
            success: true,
            code: 200,
            data: {
                posts: posts,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalCount,
                    totalPages: Math.ceil(totalCount / limit) || 0
                }
            },
            message: "Posts retrieved successfully."
        };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

const getPostById = async (id) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("PostId", sql.Int, id)
            .output("Result", sql.Int)
            .execute("sp_Posts_GetById");

        const code = result.output.Result;

        if (code === -1) {
            return { success: false, code: 404, message: "Post not found." };
        }

        // SP trả về 2 bảng: [0] là info bài viết, [1] là danh sách tags
        const postData = result.recordsets[0][0];
        const tagsData = result.recordsets[1];

        postData.Tags = tagsData;

        return {
            success: true,
            code: 200,
            data: postData,
            message: "Post retrieved successfully."
        };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

const createPost = async (userId, data) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("UserId", sql.Int, userId)
            .input("Title", sql.NVarChar(300), data.Title)
            .input("Content", sql.NVarChar(sql.MAX), data.Content)
            .input("ImageUrl", sql.NVarChar(500), data.ImageUrl)
            .input("Status", sql.NVarChar(20), data.Status || 'draft')
            .output("NewPostId", sql.Int)
            .output("Result", sql.Int);

        // Chuyển mảng TagIds thành chuỗi JSON: [1, 2] -> "[1, 2]"
        if (data.TagIds && Array.isArray(data.TagIds)) {
            request.input("TagIds", sql.NVarChar(sql.MAX), JSON.stringify(data.TagIds));
        }

        const result = await request.execute("sp_Posts_Create");
        const code = result.output.Result;

        if (code === 1) {
            return {
                success: true,
                code: 201,
                data: { PostId: result.output.NewPostId },
                message: "Post created successfully."
            };
        }

        return { success: false, code: 500, message: "Database error during creation." };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

const updatePost = async (postId, userId, data) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("PostId", sql.Int, postId)
            .input("UserId", sql.Int, userId)
            .input("Title", sql.NVarChar(300), data.Title)
            .input("Content", sql.NVarChar(sql.MAX), data.Content)
            .input("ImageUrl", sql.NVarChar(500), data.ImageUrl)
            .input("Status", sql.NVarChar(20), data.Status)
            .output("Result", sql.Int);

        if (data.TagIds && Array.isArray(data.TagIds)) {
            request.input("TagIds", sql.NVarChar(sql.MAX), JSON.stringify(data.TagIds));
        }

        const result = await request.execute("sp_Posts_Update");
        const code = result.output.Result;

        if (code === 1) {
            return { success: true, code: 200, message: "Post updated successfully." };
        } else if (code === -1) {
            return { success: false, code: 403, message: "Post not found or you are not the author." };
        }

        return { success: false, code: 500, message: "Database error during update." };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

const deletePost = async (postId, userId) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("PostId", sql.Int, postId)
            .input("UserId", sql.Int, userId)
            .output("Result", sql.Int);

        const result = await request.execute("sp_Posts_Delete");
        const code = result.output.Result;

        if (code === 1) {
            return { success: true, code: 200, message: "Post deleted successfully." };
        } else if (code === -1) {
            return { success: false, code: 403, message: "Post not found or you are not the author." };
        }

        return { success: false, code: 500, message: "Database error during deletion." };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

const getPostsByUserId = async (userId, currentUserId = null, page = 1, limit = 10, includeDrafts = false) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("UserId", sql.Int, userId)
            .input("PageNumber", sql.Int, page)
            .input("PageSize", sql.Int, limit)
            .input("IncludeDrafts", sql.Bit, includeDrafts ? 1 : 0)
            .output("Result", sql.Int);

        if (currentUserId) {
            request.input("CurrentUserId", sql.Int, currentUserId);
        } else {
            request.input("CurrentUserId", sql.Int, null);
        }

        const result = await request.execute("sp_Posts_GetByUserId");
        const code = result.output.Result;

        if (code === 1) {
            const totalCount = result.recordsets[0]?.[0]?.TotalCount || 0;
            const posts = result.recordsets[1] || [];

            return {
                success: true,
                code: 200,
                data: {
                    posts: posts,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: totalCount,
                        totalPages: Math.ceil(totalCount / limit) || 0
                    }
                },
                message: "Posts retrieved successfully."
            };
        }

        return { success: false, code: 500, message: "System error." };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

const getDraftsByUserId = async (userId, page = 1, limit = 10) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("UserId", sql.Int, userId)
            .input("PageNumber", sql.Int, page)
            .input("PageSize", sql.Int, limit)
            .output("Result", sql.Int);

        const result = await request.execute("sp_Posts_GetDraftsByUserId");
        const code = result.output.Result;

        if (code === 1) {
            const totalCount = result.recordsets[0]?.[0]?.TotalCount || 0;
            const drafts = result.recordsets[1] || [];

            return {
                success: true,
                code: 200,
                data: {
                    drafts: drafts,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: totalCount,
                        totalPages: Math.ceil(totalCount / limit) || 0
                    }
                },
                message: "Drafts retrieved successfully."
            };
        }

        return { success: false, code: 500, message: "System error." };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

module.exports = {
    getPosts,
    getPostById,
    createPost,
    updatePost,
    deletePost,
    getPostsByUserId,
    getDraftsByUserId
};

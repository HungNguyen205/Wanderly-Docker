const { sql, poolPromise } = require('../config/dbConfig');

const getAllTags = async () => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .execute("sp_Tags_GetAll");

        return {
            success: true,
            code: 200,
            data: result.recordset,
            message: "Tags retrieved successfully."
        };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

const getTagById = async (id) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("TagId", sql.Int, id)
            .execute("sp_Tags_GetById");

        if (result.recordset.length === 0) {
            return { success: false, code: 404, message: "Tag not found." };
        }

        return {
            success: true,
            code: 200,
            data: result.recordset[0],
            message: "Tag retrieved successfully."
        };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

const createTag = async (data) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("TagName", sql.NVarChar(100), data.TagName)
            .output("NewId", sql.Int)
            .output("Result", sql.Int);

        const result = await request.execute("sp_Tags_Create");
        const code = result.output.Result;

        if (code === 1) {
            return {
                success: true,
                code: 201,
                data: { TagId: result.output.NewId },
                message: "Tag created successfully."
            };
        } else if (code === -1) {
            return {
                success: false,
                code: 400,
                message: "Tag name already exists."
            };
        }

        return { success: false, code: 500, message: "Database error during creation." };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

const updateTag = async (id, data) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("TagId", sql.Int, id)
            .input("TagName", sql.NVarChar(100), data.TagName)
            .output("Result", sql.Int);

        const result = await request.execute("sp_Tags_Update");
        const code = result.output.Result;

        if (code === 1) {
            return { success: true, code: 200, message: "Tag updated successfully." };
        } else if (code === 0) {
            return { success: false, code: 404, message: "Tag not found." };
        } else if (code === -1) {
            return { success: false, code: 400, message: "Tag name duplicated." };
        }

        return { success: false, code: 500, message: "Database error during update." };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

const deleteTag = async (id) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("TagId", sql.Int, id)
            .output("Result", sql.Int);

        const result = await request.execute("sp_Tags_Delete");
        const code = result.output.Result;

        if (code === 1) {
            return { success: true, code: 200, message: "Tag deleted successfully." };
        } else {
            return { success: false, code: 404, message: "Tag not found." };
        }
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

module.exports = {
    getAllTags,
    getTagById,
    createTag,
    updateTag,
    deleteTag
};
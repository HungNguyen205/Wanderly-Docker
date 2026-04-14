const { sql, poolPromise } = require('../config/dbConfig');

const getAllCategories = async () => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .execute("sp_Categories_GetAll");

        return {
            success: true,
            code: 200,
            data: result.recordset,
            message: "Categories retrieved successfully."
        };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

const getCategoryById = async (id) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("CategoryId", sql.Int, id)
            .execute("sp_Categories_GetById");

        if (result.recordset.length === 0) {
            return { success: false, code: 404, message: "Category not found." };
        }

        return {
            success: true,
            code: 200,
            data: result.recordset[0],
            message: "Category retrieved successfully."
        };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

const createCategory = async (data) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("ServiceTypeName", sql.NVarChar(50), data.ServiceTypeName)
            .input("Description", sql.NVarChar(500), data.Description)
            .output("NewId", sql.Int)
            .output("Result", sql.Int);

        const result = await request.execute("sp_Categories_Create");
        const code = result.output.Result;

        if (code === 1) {
            return {
                success: true,
                code: 201,
                data: { CategoryID: result.output.NewId },
                message: "Category created successfully."
            };
        } else if (code === -1) {
            return {
                success: false,
                code: 400,
                message: "Category name already exists."
            };
        }

        return { success: false, code: 500, message: "Database error during creation." };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

const updateCategory = async (id, data) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("CategoryId", sql.Int, id)
            .input("ServiceTypeName", sql.NVarChar(50), data.ServiceTypeName)
            .input("Description", sql.NVarChar(500), data.Description)
            .output("Result", sql.Int);

        const result = await request.execute("sp_Categories_Update");
        const code = result.output.Result;

        if (code === 1) {
            return { success: true, code: 200, message: "Category updated successfully." };
        } else if (code === 0) {
            return { success: false, code: 404, message: "Category not found." };
        } else if (code === -1) {
            return { success: false, code: 400, message: "Category name duplicated." };
        }

        return { success: false, code: 500, message: "Database error during update." };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

const deleteCategory = async (id) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("CategoryId", sql.Int, id)
            .output("Result", sql.Int);

        const result = await request.execute("sp_Categories_Delete");
        const code = result.output.Result;

        if (code === 1) {
            return { success: true, code: 200, message: "Category deleted successfully." };
        } else {
            return { success: false, code: 404, message: "Category not found." };
        }
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};
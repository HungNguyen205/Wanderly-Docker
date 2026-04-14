const { sql, poolPromise } = require('../config/dbConfig');

const getAllFeatures = async () => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .execute("sp_Features_GetAll");

        return {
            success: true,
            code: 200,
            data: result.recordset,
            message: "Features retrieved successfully."
        };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

const getFeatureById = async (id) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("FeatureId", sql.Int, id)
            .execute("sp_Features_GetById");

        if (result.recordset.length === 0) {
            return { success: false, code: 404, message: "Feature not found." };
        }

        return {
            success: true,
            code: 200,
            data: result.recordset[0],
            message: "Feature retrieved successfully."
        };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

const createFeature = async (data) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("Name", sql.NVarChar(100), data.Name)
            .input("Description", sql.NVarChar(500), data.Description)
            .output("NewId", sql.Int)
            .output("Result", sql.Int);

        const result = await request.execute("sp_Features_Create");
        const code = result.output.Result;

        if (code === 1) {
            return {
                success: true,
                code: 201,
                data: { FeatureId: result.output.NewId },
                message: "Feature created successfully."
            };
        } else if (code === -1) {
            return {
                success: false,
                code: 400,
                message: "Feature name already exists."
            };
        }

        return { success: false, code: 500, message: "Database error during creation." };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

const updateFeature = async (id, data) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("FeatureId", sql.Int, id)
            .input("Name", sql.NVarChar(100), data.Name)
            .input("Description", sql.NVarChar(500), data.Description)
            .output("Result", sql.Int);

        const result = await request.execute("sp_Features_Update");
        const code = result.output.Result;

        if (code === 1) {
            return { success: true, code: 200, message: "Feature updated successfully." };
        } else if (code === 0) {
            return { success: false, code: 404, message: "Feature not found." };
        } else if (code === -1) {
            return { success: false, code: 400, message: "Feature name duplicated." };
        }

        return { success: false, code: 500, message: "Database error during update." };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

const deleteFeature = async (id) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("FeatureId", sql.Int, id)
            .output("Result", sql.Int);

        const result = await request.execute("sp_Features_Delete");
        const code = result.output.Result;

        if (code === 1) {
            return { success: true, code: 200, message: "Feature deleted successfully." };
        } else {
            return { success: false, code: 404, message: "Feature not found." };
        }
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

module.exports = {
    getAllFeatures,
    getFeatureById,
    createFeature,
    updateFeature,
    deleteFeature
};
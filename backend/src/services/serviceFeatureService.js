const { sql, poolPromise } = require('../config/dbConfig');

// ======================================================
// 1. GET FEATURES BY SERVICE ID
// ======================================================
const getFeaturesByServiceId = async (serviceId) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .input("ServiceId", sql.Int, serviceId)
            .output("Result", sql.Int)
            .execute("sp_ServiceFeatures_GetByServiceId");

        const code = result.output.Result;

        if (code === -1) {
            return {
                success: false,
                code: 404,
                message: "No features found for this service."
            };
        }

        return {
            success: true,
            code: 200,
            data: result.recordset || [],
            message: "Features retrieved successfully."
        };

    } catch (error) {
        return {
            success: false,
            code: 500,
            message: "System error.",
            error: error.message
        };
    }
};

module.exports = {
    getFeaturesByServiceId
};

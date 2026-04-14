const { sql, poolPromise } = require('../config/dbConfig');

// ===========================================
// 1. GET LIST (Search, Filter, Pagination)
// ===========================================
const getServices = async (page = 1, limit = 10, keyword, locationId, categoryId) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("PageNumber", sql.Int, page)
            .input("PageSize", sql.Int, limit);

        if (keyword) request.input("Keyword", sql.NVarChar(200), keyword);
        if (locationId) request.input("LocationId", sql.Int, locationId);
        if (categoryId) request.input("CategoryID", sql.Int, categoryId);

        const result = await request.output("Result", sql.Int).execute("sp_Services_GetList");
        const services = result.recordset || [];
        const totalCount = services.length > 0 ? services[0].TotalCount : 0;

        const cleanServices = services.map(s => {
            const { TotalCount, ...rest } = s;
            return rest;
        });

        return {
            success: true,
            code: 200,
            data: {
                services: cleanServices,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalCount,
                    totalPages: Math.ceil(totalCount / limit) || 0
                }
            },
            message: "Services retrieved successfully."
        };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

// ===========================================
// 2. GET BY ID (Detail)
// ===========================================
const getServiceById = async (id) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("ServiceId", sql.Int, id)
            .output("Result", sql.Int)
            .execute("sp_Services_GetById");

        const code = result.output.Result;

        if (code === -1) {
            return { success: false, code: 404, message: "Service not found." };
        }

        // RS 0: Thông tin Service (Core + Vị trí + Provider)
        const serviceInfo = result.recordsets[0][0];
        // RS 1: Features
        const features = result.recordsets[1] || [];

        const responseData = {
            ...serviceInfo,
            features: features
        };

        return {
            success: true,
            code: 200,
            data: responseData,
            message: "Service detail retrieved successfully."
        };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

const getServicesByOwnerUserId = async (ownerUserId, page = 1, limit = 10, keyword, locationId, categoryId) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("OwnerUserId", sql.Int, ownerUserId)
            .input("PageNumber", sql.Int, page)
            .input("PageSize", sql.Int, limit);

        if (keyword) request.input("Keyword", sql.NVarChar(200), keyword);
        if (locationId) request.input("LocationId", sql.Int, locationId);
        if (categoryId) request.input("CategoryID", sql.Int, categoryId);

        const result = await request.output("Result", sql.Int).execute("sp_Services_GetAllByOwnerUserId");
        const services = result.recordset || [];
        const totalCount = services.length > 0 ? services[0].TotalCount : 0;

        const cleanServices = services.map(s => {
            const { TotalCount, ...rest } = s;
            return rest;
        });

        return {
            success: true,
            code: 200,
            data: {
                services: cleanServices,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalCount,
                    totalPages: Math.ceil(totalCount / limit) || 0
                }
            },
            message: "Services retrieved successfully."
        };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

// ===========================================
// 3. CREATE (Transaction)
// ===========================================
const createService = async (ownerUserId, data) => {
    try {
        const pool = await poolPromise;
        const request = pool.request();
        // --- INPUTS CHUNG (Đúng theo định nghĩa SP) ---
        request.input("OwnerUserId", sql.Int, ownerUserId);
        request.input("LocationId", sql.Int, data.LocationId);
        request.input("CategoryID", sql.Int, data.CategoryID);
        request.input("Name", sql.NVarChar(200), data.Name);
        request.input("Description", sql.NVarChar(sql.MAX), data.Description);
        request.input("Address", sql.NVarChar(500), data.Address);
        request.input("Status", sql.NVarChar(20), data.Status || 'draft');

        if (data.Latitude) request.input("Latitude", sql.Decimal(9, 6), data.Latitude);
        if (data.Longitude) request.input("Longitude", sql.Decimal(9, 6), data.Longitude);

        // Features (Array -> JSON String)
        if (data.FeatureIds && Array.isArray(data.FeatureIds)) {
            request.input("FeatureIds", sql.NVarChar(sql.MAX), JSON.stringify(data.FeatureIds));
        }

        request.output("NewServiceId", sql.Int);
        request.output("Result", sql.Int);

        const result = await request.execute("sp_Services_Create");
        const code = result.output.Result;

        if (code === 1) {
            return {
                success: true,
                code: 201,
                data: { ServiceId: result.output.NewServiceId },
                message: "Service created successfully."
            };
        }

        return { success: false, code: 500, message: "Database error during creation." };

    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

// ===========================================
// 4. UPDATE
// ===========================================
const updateService = async (serviceId, ownerUserId, data) => {
    try {
        const pool = await poolPromise;
        const request = pool.request();

        request.input("ServiceId", sql.Int, serviceId);
        request.input("OwnerUserId", sql.Int, ownerUserId);

        // Map các field update
        if (data.Name) request.input("Name", sql.NVarChar(200), data.Name);
        if (data.Description) request.input("Description", sql.NVarChar(sql.MAX), data.Description);
        if (data.Address) request.input("Address", sql.NVarChar(500), data.Address);
        if (data.Status) request.input("Status", sql.NVarChar(20), data.Status);

        if (data.Latitude) request.input("Latitude", sql.Decimal(9, 6), data.Latitude);
        if (data.Longitude) request.input("Longitude", sql.Decimal(9, 6), data.Longitude);

        if (data.FeatureIds) request.input("FeatureIds", sql.NVarChar(sql.MAX), JSON.stringify(data.FeatureIds));

        request.output("Result", sql.Int);

        const result = await request.execute("sp_Services_Update");
        const code = result.output.Result;

        if (code === 1) return { success: true, code: 200, message: "Service updated successfully." };
        if (code === -1) return { success: false, code: 403, message: "Service not found or unauthorized." };

        return { success: false, code: 500, message: "Database error during update." };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

// ===========================================
// 5. DELETE
// ===========================================
const deleteService = async (serviceId, ownerUserId) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("ServiceId", sql.Int, serviceId)
            .input("OwnerUserId", sql.Int, ownerUserId)
            .output("Result", sql.Int)
            .execute("sp_Services_Delete");

        if (result.output.Result === 1) {
            return { success: true, code: 200, message: "Service deleted successfully." };
        }
        return { success: false, code: 403, message: "Service not found or unauthorized." };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};


module.exports = {
    getServices,
    getServiceById,
    getServicesByOwnerUserId,
    createService,
    updateService,
    deleteService
};
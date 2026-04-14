const { sql, poolPromise } = require("../config/dbConfig");

const getLocations = async ({ pageNumber, pageSize, keyword, city }) => {
    try {
        const pool = await poolPromise;

        const request = pool.request()
            .input("PageNumber", sql.Int, pageNumber)
            .input("PageSize", sql.Int, pageSize)
            .output("Result", sql.Int);

        if (keyword) {
            request.input("Keyword", sql.NVarChar(200), keyword);
        }
        if (city) {
            request.input("City", sql.NVarChar(100), city);
        }

        const result = await request.execute("sp_Locations_GetList");

        const code = result.output.Result;

        if (code === 1) {
            const totalCount = result.recordsets[0][0] ? result.recordsets[0][0].TotalCount : 0;
            const locations = result.recordsets[1] || [];

            return {
                success: true,
                code: 200,
                data: {
                    locations,
                    totalCount,
                    pageNumber,
                    pageSize,
                    totalPages: Math.ceil(totalCount / pageSize)
                },
                message: "Successfully retrieved locations list."
            };
        }

        return { success: false, code: 500, message: "Database error while retrieving locations." };

    } catch (error) {
        console.error("[getLocations] Error", error);
        return { success: false, code: 500, message: "System error during locations retrieval.", error: error.message };
    }
};

const getLocationById = async (locationId) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("LocationId", sql.Int, locationId)
            .output("Result", sql.Int)
            .execute("sp_Locations_GetById");

        const code = result.output.Result;

        if (code === 1) {
            return {
                success: true,
                code: 200,
                data: result.recordset[0],
                message: "Location retrieved successfully."
            };
        } else if (code === -1) {
            return {
                success: false,
                code: 404,
                message: "Location not found or has been deleted."
            };
        }

        return { success: false, code: 500, message: "Database error while retrieving location details." };
    } catch (error) {
        console.error("[getLocationById] Error", error);
        return { success: false, code: 500, message: "System error during location retrieval.", error: error.message };
    }
};

const createLocation = async (locationData) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("Name", sql.NVarChar(200), locationData.Name)
            .input("Address", sql.NVarChar(500), locationData.Address)
            .input("City", sql.NVarChar(100), locationData.City)
            .input("Country", sql.NVarChar(100), locationData.Country)
            .input("Description", sql.NVarChar(sql.MAX), locationData.Description)
            .input("Latitude", sql.Decimal(9, 6), locationData.Latitude)
            .input("Longitude", sql.Decimal(9, 6), locationData.Longitude)
            .input("ImageUrl", sql.NVarChar(500), locationData.ImageUrl)
            .output("NewLocationId", sql.Int)
            .output("Result", sql.Int);

        const result = await request.execute("sp_Locations_Create");
        const code = result.output.Result;

        if (code === 1) {
            return {
                success: true,
                code: 201,
                data: { LocationId: result.output.NewLocationId },
                message: "Location created successfully."
            };
        } else if (code === -1) {
            return {
                success: false,
                code: 400,
                message: "Location name already exists."
            };
        }

        return { success: false, code: 500, message: "Database error during location creation." };
    } catch (error) {
        console.error("[createLocation] Error", error);
        return { success: false, code: 500, message: "System error during location creation.", error: error.message };
    }
};

const updateLocation = async (locationId, locationData) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("LocationId", sql.Int, locationId)
            .input("Name", sql.NVarChar(200), locationData.Name)
            .input("Address", sql.NVarChar(500), locationData.Address)
            .input("City", sql.NVarChar(100), locationData.City)
            .input("Country", sql.NVarChar(100), locationData.Country)
            .input("Description", sql.NVarChar(sql.MAX), locationData.Description)
            .input("Latitude", sql.Decimal(9, 6), locationData.Latitude)
            .input("Longitude", sql.Decimal(9, 6), locationData.Longitude)
            .input("ImageUrl", sql.NVarChar(500), locationData.ImageUrl)
            .output("Result", sql.Int);

        const result = await request.execute("sp_Locations_Update");
        const code = result.output.Result;

        if (code === 1) {
            return { success: true, code: 200, message: "Location updated successfully." };
        } else if (code === -1) {
            return { success: false, code: 400, message: "Location name already exists." };
        } else if (code === -2) {
            return { success: false, code: 404, message: "Location not found." };
        }

        return { success: false, code: 500, message: "Database error during location update." };
    } catch (error) {
        console.error("[updateLocation] Error", error);
        return { success: false, code: 500, message: "System error during location update.", error: error.message };
    }
};

const deleteLocation = async (locationId) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("LocationId", sql.Int, locationId)
            .output("Result", sql.Int)
            .execute("sp_Locations_Delete");

        const code = result.output.Result;

        if (code === 1) {
            return { success: true, code: 200, message: "Location deleted successfully (Soft Delete)." };
        } else if (code === -1) {
            return { success: false, code: 404, message: "Location not found." };
        }

        return { success: false, code: 500, message: "Database error during location deletion." };
    } catch (error) {
        console.error("[deleteLocation] Error", error);
        return { success: false, code: 500, message: "System error during location deletion.", error: error.message };
    }
};

module.exports = {
    getLocations,
    getLocationById,
    createLocation,
    updateLocation,
    deleteLocation
};
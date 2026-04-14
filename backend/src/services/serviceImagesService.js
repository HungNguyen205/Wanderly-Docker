const { poolPromise, sql } = require("../config/dbConfig");

// Get all images by service ID
const getByServiceId = async (serviceId) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("ServiceId", sql.Int, serviceId)
            .execute("sp_ServiceImages_GetByServiceId");

        return {
            success: true,
            code: 200,
            data: result.recordset || []
        };
    } catch (error) {
        console.error("Error getting service images:", error);
        return { success: false, code: 500, message: error.message };
    }
};

// Get image by ID
const getById = async (imageId) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("ImageId", sql.Int, imageId)
            .execute("sp_ServiceImages_GetById");

        if (!result.recordset || result.recordset.length === 0) {
            return { success: false, code: 404, message: "Image not found." };
        }

        return {
            success: true,
            code: 200,
            data: result.recordset[0]
        };
    } catch (error) {
        console.error("Error getting image:", error);
        return { success: false, code: 500, message: error.message };
    }
};

// Create single image
const create = async (serviceId, imageUrl, caption = null, displayOrder = null) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("ServiceId", sql.Int, serviceId)
            .input("ImageUrl", sql.NVarChar(500), imageUrl)
            .input("Caption", sql.NVarChar(255), caption)
            .input("DisplayOrder", sql.Int, displayOrder)
            .output("NewImageId", sql.Int)
            .output("Result", sql.Int);

        const result = await request.execute("sp_ServiceImages_Create");
        const code = result.output.Result;

        if (code === -1) {
            return { success: false, code: 404, message: "Service not found." };
        }
        if (code !== 1) {
            return { success: false, code: 500, message: "Failed to create image." };
        }

        return {
            success: true,
            code: 201,
            message: "Image created successfully.",
            data: result.recordset[0]
        };
    } catch (error) {
        console.error("Error creating image:", error);
        return { success: false, code: 500, message: error.message };
    }
};

// Bulk create images
const bulkCreate = async (serviceId, images) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("ServiceId", sql.Int, serviceId)
            .input("Images", sql.NVarChar(sql.MAX), JSON.stringify(images))
            .output("Result", sql.Int);

        const result = await request.execute("sp_ServiceImages_BulkCreate");
        const code = result.output.Result;

        if (code === -1) {
            return { success: false, code: 404, message: "Service not found." };
        }
        if (code === -99) {
            return { success: false, code: 500, message: "Failed to create images." };
        }

        return {
            success: true,
            code: 201,
            message: `${code} image(s) created successfully.`,
            data: result.recordset || []
        };
    } catch (error) {
        console.error("Error bulk creating images:", error);
        return { success: false, code: 500, message: error.message };
    }
};

// Update image
const update = async (imageId, caption, displayOrder) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("ImageId", sql.Int, imageId)
            .input("Caption", sql.NVarChar(255), caption)
            .input("DisplayOrder", sql.Int, displayOrder)
            .output("Result", sql.Int);

        const result = await request.execute("sp_ServiceImages_Update");
        const code = result.output.Result;

        if (code === -1) {
            return { success: false, code: 404, message: "Image not found." };
        }
        if (code !== 1) {
            return { success: false, code: 500, message: "Failed to update image." };
        }

        return {
            success: true,
            code: 200,
            message: "Image updated successfully.",
            data: result.recordset[0]
        };
    } catch (error) {
        console.error("Error updating image:", error);
        return { success: false, code: 500, message: error.message };
    }
};

// Delete image
const deleteImage = async (imageId) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("ImageId", sql.Int, imageId)
            .output("Result", sql.Int);

        const result = await request.execute("sp_ServiceImages_Delete");
        const code = result.output.Result;

        if (code === -1) {
            return { success: false, code: 404, message: "Image not found." };
        }
        if (code !== 1) {
            return { success: false, code: 500, message: "Failed to delete image." };
        }

        return {
            success: true,
            code: 200,
            message: "Image deleted successfully."
        };
    } catch (error) {
        console.error("Error deleting image:", error);
        return { success: false, code: 500, message: error.message };
    }
};

// Delete all images by service
const deleteByServiceId = async (serviceId) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("ServiceId", sql.Int, serviceId)
            .output("Result", sql.Int);

        const result = await request.execute("sp_ServiceImages_DeleteByServiceId");

        return {
            success: true,
            code: 200,
            message: `${result.output.Result} image(s) deleted.`
        };
    } catch (error) {
        console.error("Error deleting images:", error);
        return { success: false, code: 500, message: error.message };
    }
};

// Reorder images
const reorder = async (serviceId, imageOrders) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("ServiceId", sql.Int, serviceId)
            .input("ImageOrders", sql.NVarChar(sql.MAX), JSON.stringify(imageOrders))
            .output("Result", sql.Int);

        const result = await request.execute("sp_ServiceImages_Reorder");
        const code = result.output.Result;

        if (code === -99) {
            return { success: false, code: 500, message: "Failed to reorder images." };
        }

        return {
            success: true,
            code: 200,
            message: "Images reordered successfully.",
            data: result.recordset || []
        };
    } catch (error) {
        console.error("Error reordering images:", error);
        return { success: false, code: 500, message: error.message };
    }
};

// Set primary image
const setPrimary = async (imageId) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("ImageId", sql.Int, imageId)
            .output("Result", sql.Int);

        const result = await request.execute("sp_ServiceImages_SetPrimary");
        const code = result.output.Result;

        if (code === -1) {
            return { success: false, code: 404, message: "Image not found." };
        }
        if (code !== 1) {
            return { success: false, code: 500, message: "Failed to set primary image." };
        }

        return {
            success: true,
            code: 200,
            message: "Primary image set successfully.",
            data: result.recordset || []
        };
    } catch (error) {
        console.error("Error setting primary image:", error);
        return { success: false, code: 500, message: error.message };
    }
};

module.exports = {
    getByServiceId,
    getById,
    create,
    bulkCreate,
    update,
    deleteImage,
    deleteByServiceId,
    reorder,
    setPrimary
};


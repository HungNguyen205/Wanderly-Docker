const { sql, poolPromise } = require('../config/dbConfig');

// 1. Đăng ký làm Nhà cung cấp (POST /providers/register)
const registerProvider = async (ownerUserId, data) => {
  try {
    const pool = await poolPromise;
    const request = pool.request()
      .input("OwnerUserId", sql.Int, ownerUserId)
      .input("CompanyName", sql.NVarChar(200), data.CompanyName)
      .input("ContactEmail", sql.NVarChar(255), data.ContactEmail)
      .input("PhoneNumber", sql.NVarChar(20), data.PhoneNumber)
      .input("Address", sql.NVarChar(500), data.Address)
      .output("Result", sql.Int);

    const result = await request.execute("sp_Providers_Register");
    const code = result.output.Result;

    if (code === 1) {
      return { success: true, code: 201, message: "Provider registered and user role updated successfully." };
    } else if (code === -1) {
      return { success: false, code: 400, message: "User is already a registered Provider." };
    } else if (code === -2) {
      return { success: false, code: 400, message: "Company Name or Contact Email already in use." };
    }

    return { success: false, code: 500, message: "Database error during registration." };
  } catch (error) {
    return { success: false, code: 500, message: "System error.", error: error.message };
  }
};

// 2. Lấy hồ sơ Nhà cung cấp (GET /providers/me)
const getProviderProfile = async (ownerUserId) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("OwnerUserId", sql.Int, ownerUserId)
      .execute("sp_Providers_GetByOwnerId");

    if (result.recordset.length === 0) {
      return { success: false, code: 404, message: "Provider profile not found for this user." };
    }

    return {
      success: true,
      code: 200,
      data: result.recordset[0],
      message: "Provider profile retrieved successfully."
    };
  } catch (error) {
    return { success: false, code: 500, message: "System error.", error: error.message };
  }
};

// 3. Cập nhật hồ sơ Nhà cung cấp (PUT /providers/me)
const updateProviderProfile = async (providerId, data) => {
  try {
    const pool = await poolPromise;
    const request = pool.request()
      .input("ProviderId", sql.Int, providerId)
      .input("CompanyName", sql.NVarChar(200), data.CompanyName)
      .input("ContactEmail", sql.NVarChar(255), data.ContactEmail)
      .input("PhoneNumber", sql.NVarChar(20), data.PhoneNumber)
      .input("Address", sql.NVarChar(500), data.Address)
      .output("Result", sql.Int);

    const result = await request.execute("sp_Providers_UpdateProfile");
    const code = result.output.Result;

    if (code === 1) {
      return { success: true, code: 200, message: "Provider profile updated successfully." };
    } else if (code === -1) {
      return { success: false, code: 400, message: "Contact email is already in use by another provider." };
    } else if (code === 0) {
      return { success: false, code: 404, message: "Provider not found." };
    }

    return { success: false, code: 500, message: "Database error during update." };
  } catch (error) {
    return { success: false, code: 500, message: "System error.", error: error.message };
  }
};

// 4. Xóa/Hủy hồ sơ Nhà cung cấp (DELETE /providers/me)
const deleteProvider = async (providerId) => {
  try {
    const pool = await poolPromise;
    const request = pool.request()
      .input("ProviderId", sql.Int, providerId)
      .output("Result", sql.Int);

    const result = await request.execute("sp_Providers_Delete");
    const code = result.output.Result;

    if (code === 1) {
      return { success: true, code: 200, message: "Provider registration deleted and user role reset." };
    } else if (code === -1) {
      return { success: false, code: 404, message: "Provider not found or already deleted." };
    }

    return { success: false, code: 500, message: "Database error during deletion." };
  } catch (error) {
    return { success: false, code: 500, message: "System error.", error: error.message };
  }
};

// Export tất cả các hàm đã định nghĩa
module.exports = {
  registerProvider,
  getProviderProfile,
  updateProviderProfile,
  deleteProvider,
};
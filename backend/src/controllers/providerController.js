const providerService = require('../services/providerService');

// ===========================================
// Hàm hỗ trợ: Lấy ProviderId từ OwnerUserId 
// (Dùng lại logic Get Profile)
// ===========================================
const getProviderIdFromOwner = async (ownerUserId) => {
  const result = await providerService.getProviderProfile(ownerUserId);
  if (result.success && result.data && result.data.ProviderId) {
    return result.data.ProviderId;
  }
  return null; // Trả về null nếu không tìm thấy
};

// ===========================================
// 1. Đăng ký làm Nhà cung cấp (POST /providers/register)
// ===========================================
const registerProvider = async (req, res) => {
  try {
    const ownerUserId = req.user.id; // Lấy OwnerUserId từ Token
    const data = req.body;

    if (!data.CompanyName || !data.ContactEmail) {
      return res.status(400).json({ success: false, message: "Company Name and Contact Email are required." });
    }

    const result = await providerService.registerProvider(ownerUserId, data);

    return res.status(result.code || 500).json(result);
  } catch (error) {
    console.error("[RegisterProvider Controller] Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ===========================================
// 2. Lấy hồ sơ Nhà cung cấp (GET /providers/me)
// ===========================================
const getProviderProfile = async (req, res) => {
  try {
    const ownerUserId = req.user.id;
    const result = await providerService.getProviderProfile(ownerUserId);

    return res.status(result.code || 500).json(result);
  } catch (error) {
    console.error("[GetProviderProfile Controller] Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ===========================================
// 3. Cập nhật hồ sơ Nhà cung cấp (PUT /providers/me)
// ===========================================
const updateProviderProfile = async (req, res) => {
  try {
    const ownerUserId = req.user.id;

    // 1. Lấy ProviderId cần thiết cho SP Update
    const providerId = await getProviderIdFromOwner(ownerUserId);

    if (!providerId) {
      return res.status(404).json({ success: false, message: "Provider profile not found." });
    }

    // 2. Kiểm tra dữ liệu đầu vào
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ success: false, message: "No fields provided for update." });
    }

    const result = await providerService.updateProviderProfile(providerId, req.body);

    return res.status(result.code || 500).json(result);
  } catch (error) {
    console.error("[UpdateProviderProfile Controller] Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ===========================================
// 4. Xóa/Hủy hồ sơ Nhà cung cấp (DELETE /providers/me)
// ===========================================
const deleteProvider = async (req, res) => {
  try {
    const ownerUserId = req.user.id;

    // 1. Lấy ProviderId
    const providerId = await getProviderIdFromOwner(ownerUserId);

    if (!providerId) {
      return res.status(404).json({ success: false, message: "Provider profile not found." });
    }

    const result = await providerService.deleteProvider(providerId);

    return res.status(result.code || 500).json(result);
  } catch (error) {
    console.error("[DeleteProvider Controller] Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

module.exports = {
  registerProvider,
  getProviderProfile,
  updateProviderProfile,
  deleteProvider,
};
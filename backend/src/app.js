const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path"); 

const app = express();

/* ----------------------------
   CORS
---------------------------- */
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:4000"], 
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.options(/.*/, cors());

/* ----------------------------
   Helmet – Cấu hình bảo mật
---------------------------- */
app.use(helmet({
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
    contentSecurityPolicy: false, // Tắt CSP để tránh chặn script từ bản build React
}));

/* ----------------------------
   Body parser + logger
---------------------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

/* ----------------------------
   API ROUTES (Giữ nguyên các route hiện tại)
---------------------------- */
app.use("/api/auths", require("./routes/authRoute"));
app.use("/api/users", require("./routes/userRoute"));
app.use("/api/locations", require("./routes/locationRoute"));
app.use("/api/categories", require("./routes/categoryRoute"));
app.use("/api/features", require("./routes/featureRoute"));
app.use("/api/providers", require("./routes/providerRoute"));
app.use("/api/services", require("./routes/serviceRoute"));
app.use("/api/service-features", require("./routes/serviceFeatureRoute"));
app.use("/api/tags", require("./routes/tagRoute"));
app.use("/api/posts", require("./routes/postRoute"));
app.use("/api/itineraries", require("./routes/itineraryRoute"));
app.use("/api/itinerary-items", require("./routes/itineraryItemRoute"));
app.use("/api/cloudinary", require("./routes/cloudinaryRoute"));
app.use("/api/comments", require("./routes/commentRoute"));
app.use("/api", require("./routes/postLikeRoute"));
app.use("/api", require("./routes/commentLikeRoute"));
app.use("/api/service-availabilities", require("./routes/serviceAvailabilitiesRoute"));
app.use("/api/service-accommodations", require("./routes/serviceAccommodationsRoute"));
app.use("/api/service-images", require("./routes/serviceImagesRoute"));
app.use("/api/bookings", require("./routes/bookingsRoute"));
app.use("/api/reviews", require("./routes/reviewsRoute"));
app.use("/api/backup", require("./routes/backupRoute"));

// LƯU Ý: Không thêm bất kỳ route app.get("/") nào ở đây để tránh đè lên Frontend

// 1. Chỉ định thư mục public chứa bản build tĩnh của React
/* ----------------------------
   CẤU HÌNH PHỤC VỤ FRONTEND (DOCKER - PHƯƠNG ÁN AN TOÀN NHẤT)
---------------------------- */
const publicPath = path.join(__dirname, "../public");
app.use(express.static(publicPath));

// Dùng middleware thay vì app.get để tránh lỗi parser của Express 5
app.use((req, res, next) => {
    // Nếu là yêu cầu API hoặc đường dẫn có định dạng file (có dấu chấm), bỏ qua
    if (req.path.startsWith('/api') || req.path.includes('.')) {
        return next();
    }
    // Còn lại trả về giao diện React
    res.sendFile(path.join(publicPath, "index.html"));
});

module.exports = app;
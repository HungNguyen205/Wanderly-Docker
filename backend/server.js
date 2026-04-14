require("dotenv").config();
const app = require("./src/app");

const PORT = process.env.PORT || 4000;

// Lắng nghe trên 0.0.0.0 là yếu tố sống còn trong Docker
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Wanderly App is running on port ${PORT}`);
});
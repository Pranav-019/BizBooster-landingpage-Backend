const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config");
const userRoutes = require("./routes/userRoutes");
const carouselRoutes = require("./routes/carouselRoutes");
const itemRoutes = require("./routes/itemRoutes");
const boxRoutes = require("./routes/boxRoutes");

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/images", carouselRoutes);
app.use("/api/item", itemRoutes);
app.use("/api/box", boxRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

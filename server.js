const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config");
const userRoutes = require("./routes/userRoutes");
const carouselRoutes = require("./routes/carouselRoutes");
const itemRoutes = require("./routes/itemRoutes");
const boxRoutes = require("./routes/boxRoutes");
const businessRoute = require('./routes/businessRoute');
const serviceRoute = require('./routes/serviceRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');
const videoUploadRoutes = require('./routes/videoUploadRoutes');
const contactUsRoutes = require('./routes/contactUsRoutes');
const contentSectionRoutes = require('./routes/contentSectionRoutes');
const servicepageroutes = require('./routes/servicepageroutes')

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/images", carouselRoutes);
app.use("/api/item", itemRoutes);
app.use("/api/box", boxRoutes);
app.use('/api/business', businessRoute);
app.use('/api/service', serviceRoute);
app.use('/api/testimonial', testimonialRoutes);
app.use('/api/videos', videoUploadRoutes);
app.use('/api/contact', contactUsRoutes);
app.use('/api/content', contentSectionRoutes);
app.use('/api/page', servicepageroutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

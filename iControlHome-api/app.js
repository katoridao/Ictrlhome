var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors"); 

// Import Database
const db = require("./config/database");
db.connect();

// Import Routers
var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
const houseRoutes = require("./routes/house");
const roomRoutes = require("./routes/room");
const deviceRoutes = require("./routes/device");
const historyRoutes = require("./routes/history");
const apiRouter = require("./routes/api");

var app = express();

// View engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

// Middleware
app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// --- KHU VỰC API (Ưu tiên đưa lên trên) ---
// Đồng bộ đường dẫn: Mọi thứ bắt đầu bằng /api
app.use("/api/houses", houseRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/history", historyRoutes);
app.use("/api", apiRouter);

// --- KHU VỰC WEB ---
app.use("/", indexRouter);
app.use("/users", usersRouter);

// Catch 404 và chuyển tiếp đến error handler
app.use(function (req, res, next) {
  // Debug log: Nếu chạy đến đây là không có route nào ở trên khớp
  console.log(`[404 Error] Không tìm thấy: ${req.method} ${req.url}`);
  next(createError(404));
});

// Error handler
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: req.app.get("env") === "development" ? err : {}
  });
});

module.exports = app;
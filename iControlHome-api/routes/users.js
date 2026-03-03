var express = require("express");
var router = express.Router();

// get list user
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

module.exports = router;

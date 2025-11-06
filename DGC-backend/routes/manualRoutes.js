const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.send("Manuals route working!");
});

module.exports = router;

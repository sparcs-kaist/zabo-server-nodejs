const fs = require("fs");
const path = require("path");

module.exports = {
  getCurrentDirectoryBase: () => path.basename(process.cwd()),
  directoryExists: filePath => fs.existsSync(filePath),
};

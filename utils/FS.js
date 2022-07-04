const fs = require('fs');
const path = require('path');

const read = (dir) => {
  const readData = JSON.parse(fs.readFileSync(path.join(__dirname, `../model/${dir}`)))
  return readData
};

module.exports = {
  read
}
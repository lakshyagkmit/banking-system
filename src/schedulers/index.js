const fs = require('fs');
const path = require('path');

const schedulerFiles = fs.readdirSync(__dirname).filter(file => {
  return file !== 'index.js' && file.endsWith('.scheduler.js');
});

schedulerFiles.forEach(file => {
  const schedulerPath = path.join(__dirname, file);
  const scheduleJob = require(schedulerPath);

  if (typeof scheduleJob === 'function') {
    console.log(`Starting scheduler: ${file}`);
    scheduleJob();
  } else {
    console.warn(`File ${file} does not export a function`);
  }
});

/* globals logger */

const glob = require('glob');
const Mocha = require('mocha');
const path = require('path');

const mocha = new Mocha();
mocha.reporter('spec');

const utils = require(path.join(__dirname, 'utils'));

utils.initialize();

glob.sync('tests/integration/**/*.js')
  .filter((filePath) => {
    const fileName = path.parse(filePath).base;

    return (fileName.indexOf(process.argv[2]) !== -1);
  })
  .forEach((file) => {
    mocha.addFile(path.join(process.cwd(), file));
  });

// run Mocha

utils.createDB()
  .then(() => {
    mocha.run((failures) => {
      process.on('exit', () => {
        process.exit(failures);
      });
      process.exit();
    });


    process.on('error', (err) => {
      console.error(err, err.stack);
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error(err, err.stack);
    process.exit(1);
  });

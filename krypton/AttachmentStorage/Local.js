/* globals Krypton, Class, Module */

const fs = require('fs-extra');
const magic = require('stream-mmmagic');
const mime = require('mime');
const metadata = require('im-metadata');
const Promise = require('bluebird');

Krypton.AttachmentStorage = Krypton.AttachmentStorage || {};

Krypton.AttachmentStorage.Local =
Class(Krypton.AttachmentStorage, 'Local')
  .inherits(Krypton.AttachmentStorage.Abstract)({
    prototype: {
      getURL(pathField, version, ext) {
        return `/uploads/${pathField}`
          .replace(/{version}/g, version)
          .replace(/{ext}/g, ext);
      },

      saveStream(stream, basePath) {
        const version = Object.keys(stream)[0];

        return new Promise((resolve, reject) => {
          magic(stream[version], (err, _mime, output) => {
            if (err) {
              reject(err);
            }

            const ext = mime.extension(_mime.type);

            let filePath = basePath
              .replace(/{version}/g, version)
              .replace(/{ext}/g, ext);

            filePath = `${process.cwd()}/public/uploads/${filePath}`;

            fs.ensureFileSync(filePath);

            const writer = fs.createWriteStream(`${filePath}`);

            output.pipe(writer);

            writer.on('finish', () => {
              if (/image/.test(_mime.type)) {
                metadata(filePath, {
                  exif: false,
                  autoOrient: false,
                }, (error, data) => {
                  if (error) {
                    reject(error);
                  }

                  const response = {};
                  response[version] = data;
                  response[version].mimeType = _mime.type;
                  response[version].ext = ext;

                  delete response[version].path;
                  delete response[version].name;

                  resolve(response);
                });
              } else {
                const response = {};

                response[version] = {
                  ext,
                  mimeType: _mime.type,
                  size: fs.lstatSync(filePath).size,
                };
                resolve(response);
              }
            });
          });
        });
      },
    },
  });

module.exports = Krypton.AttachmentStorage.Local;

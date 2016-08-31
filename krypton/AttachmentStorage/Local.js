/* globals Krypton, Class, Module */

const fs = require('fs-extra');
const through2 = require('through2')
const magic = require('stream-mmmagic');
const mime = require('mime');
const streamLength = require('stream-length');
const metadata = require('im-metadata');
const Promise = require('bluebird');

Krypton.AttachmentStorage = Krypton.AttachmentStorage || {};

Krypton.AttachmentStorage.Local = Class(Krypton.AttachmentStorage, 'Local')
({
  MAX_FILE_SIZE_ERROR: 'Krypton.Storage.Local: File too big',
  MIME_TYPE_ERROR: 'Krypton.Storage.Local: Invalid file mimetype',
  prototype: {
    acceptedMimeTypes: null,
    maxFileSize: null,

    init(config) {
      Object.keys(config || {}).forEach((propertyName) => {
        this[propertyName] = config[propertyName];
      }, this);

      // Accept all filetypes if no acceptedMimeTypes are set
      this.acceptedMimeTypes = this.acceptedMimeTypes || [/.+/i];

      // Default to 5MB
      this.maxFileSize = this.maxFileSize || 5242880;

      return this;
    },

    checkConstraints(readStream) {
      const storage = this;
      const stream = readStream.pipe(through2());

      return new Promise((resolve, reject) => {
        return streamLength(readStream)
          .then((res) => {
            if (res > storage.s) {

              throw new Error(storage.constructor.MAX_FILE_SIZE_ERROR);
            }

            return new Promise((_resolve, _reject) => {
              magic(stream, (err, _mime, output) => {
                if (err) {
                  _reject(err);
                }

                const fileMime = _mime.type;

                const result = this.acceptedMimeTypes.filter((val) => {
                  if (typeof val === 'string') {
                    return (fileMime.indexOf(val) !== -1);
                  }

                  return (val.test(fileMime));
                });

                if (result.length === 0) {
                  _reject(new Error(storage.constructor.MIME_TYPE_ERROR));
                }

                _resolve(output);
              });
            })
            .then(resolve)
            .catch(reject);

          });
      });
    },

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

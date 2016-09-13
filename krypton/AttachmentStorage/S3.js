/* globals Krypton, Class, Module */

const fs = require('fs-extra');
const zlib = require('zlib');
const magic = require('stream-mmmagic');
const metadata = require('im-metadata');
const mime = require('mime');

const Promise = require('bluebird');

Krypton.AttachmentStorage = Krypton.AttachmentStorage || {};

Krypton.AttachmentStorage.S3 =
Class(Krypton.AttachmentStorage, 'S3')
  .inherits(Krypton.AttachmentStorage.Abstract)({
    prototype: {
      bucketName: null,
      bucketInsance: null,
      pathPrefix: null,
      getURL(pathField, version, ext) {
        return `${this.pathPrefix}${pathField}`
          .replace(/{version}/g, version)
          .replace(/{ext}/g, ext);
      },

      saveStream(stream, basePath) {
        const storage = this;
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

            filePath = `${storage.pathPrefix}${filePath}`;

            storage.bucketInstance.upload({
              Body: output,
              Key: filePath,
              ContentType: _mime.type,
            })
            .send((error, data) => {
              if (error) {
                reject(error);
              } else {
                if (/image/.test(_mime.type)) {
                  metadata(output, {
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

                    resolve(response);
                  });
                } else {
                  const response = {};

                  response[version] = {
                    ext,
                    mimeType: _mime.type,
                    // size: fs.lstatSync(filePath).size,
                  };
                  resolve(response);
                }
              }
            });
          });
        });
      },
    },
  });

module.exports = Krypton.AttachmentStorage.S3;

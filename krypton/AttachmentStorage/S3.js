/* globals Krypton, Class, Module */

const magic = require('stream-mmmagic');
const request = require('request');
const imagesize = require('imagesize');

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
            .send((error, awsData) => {
              if (error) {
                return reject(error);
              }

              if (/image/.test(_mime.type)) {
                imagesize(request.get(awsData.Location), (_err, info) => {
                  if (_err) {
                    return reject(err);
                  }

                  const response = {};

                  response[version] = {
                    ext,
                    mimeType: _mime.type,
                    width: info.width,
                    height: info.height,
                    key: awsData.Key,
                  };

                  return resolve(response);
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
            });
          });
        });
      },
    },
  });

module.exports = Krypton.AttachmentStorage.S3;

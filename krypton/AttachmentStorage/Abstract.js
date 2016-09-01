/* globals Krypton, Class, Module */

const through2 = require('through2');
const magic = require('stream-mmmagic');
const streamLength = require('stream-length');
const Promise = require('bluebird');

Krypton.AttachmentStorage = Krypton.AttachmentStorage || {};

Krypton.AttachmentStorage.Abstract =
Class(Krypton.AttachmentStorage, 'Abstract')({
  MAX_FILE_SIZE_ERROR: 'Krypton.Storage.{name}: File too big.',
  MIME_TYPE_ERROR: 'Krypton.Storage.{name}: Invalid file mime-type.',
  prototype: {
    acceptedMimeTypes: null,
    maxFileSize: 5242880, // Default to 5MB

    init(config) {
      Object.keys(config || {}).forEach((propertyName) => {
        this[propertyName] = config[propertyName];
      }, this);

      // Accept all filetypes if no acceptedMimeTypes are set
      this.acceptedMimeTypes = this.acceptedMimeTypes || [/.+/i];

      this.constructor.MAX_FILE_SIZE_ERROR
        .replace('{name}', this.constructor.className);
      this.constructor.MIME_TYPE_ERROR
        .replace('{name}', this.constructor.className);

      return this;
    },

    checkConstraints(readStream) {
      const storage = this;
      const stream = readStream.pipe(through2());

      return new Promise((resolve, reject) => {
        return streamLength(readStream)
          .then((res) => {
            if (res > storage.maxFileSize) {
              reject(new Error(storage.constructor.MAX_FILE_SIZE_ERROR));
            }

            return new Promise((_resolve, _reject) => {
              magic(stream, (err, _mime, output) => {
                if (err) {
                  _reject(err);
                }

                const fileMime = _mime.type;

                const result = storage.acceptedMimeTypes.filter((val) => {
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
      throw new Error('Not implemented.');
    },

    saveStream(stream, basePath) {
      return Promise.reject(new Error('Not implemented.'));
    },
  },
});

module.exports = Krypton.AttachmentStorage.Abstract;

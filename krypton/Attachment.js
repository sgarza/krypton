/* eslint max-len: 0 */
/* globals Krypton, Class, Module */

const fs = require('fs');
const request = require('request');
const Promise = require('bluebird');
const path = require('path');

const LOCAL_URI_REGEXP = /^\//;
const REMOTE_URI_REGEXP = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/;

Krypton.Attachment = Module(Krypton, 'Attachment')({
  attachmentStorage: null,
  prototype: {
    hasAttachment(config) {
      const model = this;
      const storage = this.constructor.attachmentStorage;

      const versions = {
        original(readStream) {
          return readStream;
        },
      };

      Object.keys(config.versions || []).forEach((version) => {
        versions[version] = config.versions[version];
      });

      const attachmentObject = {
        url(version) {
          const pathField = `${config.name}Path`;

          if (!model[pathField]) {
            return null;
          }

          const ext = model[config.name].meta(version).ext;

          const url = storage.getURL(model[pathField], version, ext);

          return url;
        },

        meta(version) {
          const metaField = `${config.name}Meta`;

          try {
            return model[metaField][version];
          } catch (e) {
            return {};
          }
        },

        processVersions() {
          if (!model[config.name].url('original')) {
            return Promise.resolve();
          }

          const url = model[config.name].url('original');

          return model.attach(config.name, url);
        },

        exists(version) {
          let meta;
          const metaField = `${config.name}Meta`;

          try {
            meta = model[metaField];
          } catch (e) {
            meta = {};
          }

          return meta[version] ? true : false;
        },
        versions,
        basePath: config.basePath || '{env}/{modelName}/{id}/{property}/{version}.{ext}',
      };

      Object.defineProperty(model, config.name, {
        enumerable: true,
        get() {
          return attachmentObject;
        },
      });
    },

    attach(property, url, meta) {
      if (!this.id) {
        throw new Error('Can\'t attach a file if model doesn\'t have an id');
      }

      const model = this;
      const storage = this.constructor.attachmentStorage;
      const versions = model[property].versions;
      const env = process.env.NODE_ENV || 'development';
      const basePath = model[property].basePath
        .replace(/{env}/g, env)
        .replace(/{modelName}/g, model.constructor.className)
        .replace(/{id}/g, model.id)
        .replace(/{property}/g, property);

      if (meta) {
        const maxFileSize = storage.maxFileSize;
        const acceptedMimeTypes = storage.acceptedMimeTypes;

        if (meta.fileSize && meta.fileSize > maxFileSize) {
          throw new Error(storage.constructor.MAX_FILE_SIZE_ERROR);
        }

        if (meta.mimeType) {
          const mimeTypes = acceptedMimeTypes.filter((val) => {
            if (typeof val === 'string') {
              return (meta.mimeType.indexOf(val) !== -1);
            }

            return (val.test(meta.mimeType));
          });

          if (mimeTypes.length === 0) {
            throw new Error(storage.constructor.MIME_TYPE_ERROR);
          }
        }
      }

      let readStream;

      if (LOCAL_URI_REGEXP.test(url)) {
        readStream = fs.createReadStream(url);
      } else if (REMOTE_URI_REGEXP.test(url)) {
        readStream = request.get(url);
      }

      const originalFileName = path.parse(readStream.path).base;

      return storage.checkConstraints(readStream)
        .then((_readStream) => {
          const streams = [];

          Object.keys(versions).forEach((version) => {
            const transform = versions[version];

            const processedStream = transform(_readStream);

            const result = {};

            result[version] = processedStream;

            streams.push(storage.saveStream(result, basePath));
          });

          return Promise.all(streams)
            .then((res) => {
              const _meta = {};

              res.forEach((i) => {
                Object.keys(i).forEach((k) => {
                  i[k].originalFileName = originalFileName;
                });

                Object.assign(_meta, i);
              });

              model[`${property}Meta`] = _meta;
              model[`${property}Path`] = basePath;

              return Promise.resolve();
            });
        });
    },
  },
});

module.exports = Krypton.Attachment;

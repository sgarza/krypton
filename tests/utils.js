/* global Class, Module, Krypton, DynamicModel1, DynamicModel2, Model1, Model2 */
const im = require('imagemagick-stream');
const AWS = require('aws-sdk');

require('./../');

const IntegrationTestUtils = Module({}, 'IntegrationTestUtils')({
  initialize() {
    const utils = this;

    const knex = require('knex')({
      client: 'postgres',
      connection: {
        host: '127.0.0.1',
        database: 'krypton_test',
      },
    });

    this.knex = knex;

    Class('DynamicModel1').inherits(Krypton.Model)({
      tableName: 'Model1',
      attributes: ['id', 'model1Id', 'property1', 'property2', 'property3'],
    });

    Class('DynamicModel2').inherits(Krypton.Model)({
      tableName: 'Model2',
      attributes: ['id', 'model1Id', 'property1', 'property2', 'createdAt', 'updatedAt'],
      relations: {
        dynamicModel2Relation1: {
          type: 'HasManyThrough',
          relatedModel: DynamicModel1,
          ownerCol: 'id',
          relatedCol: 'id',
          through: {
            tableName: 'Model1Model2',
            ownerCol: 'model_2_id',
            relatedCol: 'model_1_id',
          },
        },
      },
    });

    Class('Model1').inherits(Krypton.Model)({
      tableName: 'Model1',
      attributes: ['id', 'model1Id', 'property1', 'property2', 'property3'],
    });

    Class('Model2').inherits(Krypton.Model)({
      tableName: 'Model2',
      attributes: ['id', 'model1Id', 'property1', 'property2', 'createdAt', 'updatedAt'],
      relations: {
        model2Relation1: {
          type: 'HasManyThrough',
          relatedModel: Model1,
          ownerCol: 'id',
          relatedCol: 'id',
          through: {
            tableName: 'Model1Model2',
            ownerCol: 'model_2_id',
            relatedCol: 'model_1_id',
          },
        },
      },
    });

    Model1.knex(knex);
    Model2.knex(knex);

    Model1.relations = {
      model1Relation1: {
        type: 'HasOne',
        relatedModel: Model1,
        ownerCol: 'model_1_id',
        relatedCol: 'id',
      },
      model1Relation2: {
        type: 'HasMany',
        relatedModel: Model2,
        ownerCol: 'id',
        relatedCol: 'model_1_id',
      },
    };

    DynamicModel1.relations = {
      dynamicModel1Relation1: {
        type: 'HasOne',
        relatedModel: DynamicModel1,
        ownerCol: 'model_1_id',
        relatedCol: 'id',
      },
      dynamicModel1Relation2: {
        type: 'HasMany',
        relatedModel: DynamicModel2,
        ownerCol: 'id',
        relatedCol: 'model_1_id',
      },
    };

    Class('Image').inherits(Krypton.Model)
    .includes(Krypton.Attachment)({
      tableName: 'Attachments',
      attachmentStorage: new Krypton.AttachmentStorage.Local({
        maxFileSize: 5242880,
        acceptedMimeTypes: [/image/i],
      }),

      attributes: ['id', 'imagePath', 'imageMeta', 'createdAt', 'updatedAt'],

      prototype: {
        init(config) {
          Krypton.Model.prototype.init.call(this, config);

          this.hasAttachment({
            name: 'image',
            versions: {
              small(readStream) {
                return readStream.pipe(
                  im()
                    .resize('200x200')
                    .quality(80)
                );
              },
              big(readStream) {
                return readStream.pipe(
                  im()
                    .resize('600x600')
                    .quality(80)
                );
              },
            },
          });
        },
      },
    });

    Image.knex(knex);

    Class('File').inherits(Krypton.Model)
    .includes(Krypton.Attachment)({
      tableName: 'Files',
      attachmentStorage: new Krypton.AttachmentStorage.Local(),

      attributes: ['id', 'documentPath', 'documentMeta', 'createdAt', 'updatedAt'],

      prototype: {
        init(config) {
          Krypton.Model.prototype.init.call(this, config);

          this.hasAttachment({
            name: 'document',
          });
        },
      },
    });

    File.knex(knex);

    AWS.config.update({
      region: 'us-east-1',
      accessKeyId: process.env.AWS_KEY,
      secretAccessKey: process.env.AWS_SECRET,
    });

    const bucketInstance = new AWS.S3({
      params: {
        Bucket: process.env.AWS_BUCKET,
        ACL: 'public-read',
      },
    });

    const attachmentStorage = new Krypton.AttachmentStorage.S3({
      pathPrefix: 'krypton/',
      bucketName: process.env.AWS_BUCKET,
      bucketInstance,
    });

    Class('ImageS3').inherits(Krypton.Model).includes(Krypton.Attachment)({
      tableName: 'Attachments',
      attachmentStorage,

      attributes: ['id', 'imagePath', 'imageMeta', 'createdAt', 'updatedAt'],
      prototype: {
        init(config) {
          Krypton.Model.prototype.init.call(this, config);

          this.hasAttachment({
            name: 'image',
            versions: {
              small(readStream) {
                return readStream.pipe(
                  im()
                    .resize('200x200')
                    .quality(80)
                );
              },
              big(readStream) {
                return readStream.pipe(
                  im()
                    .resize('600x600')
                    .quality(80)
                );
              },
            },
          });
        },
      },
    });

    ImageS3.knex(knex);

    return {
      knex,
      createDB: utils.createDB,
      destroy: utils.destroy,
    };
  },

  createDB() {
    const utils = this;

    return utils.knex.schema
      .dropTableIfExists('Model1Model2')
      .dropTableIfExists('Model1')
      .dropTableIfExists('Model2')
      .dropTableIfExists('Attachments')
      .createTable('Model1', (t) => {
        t.increments('id').primary();
        t.integer('model_1_id');
        t.string('property_1');
        t.integer('property_2');
        t.json('property_3');
      })
      .createTable('Model2', (t) => {
        t.increments('id').primary();
        t.integer('model_1_id');
        t.string('property_1');
        t.integer('property_2');
        t.datetime('created_at');
        t.datetime('updated_at');
      })
      .createTable('Model1Model2', (t) => {
        t.increments('id').primary();
        t.integer('model_1_id').notNullable();
        t.integer('model_2_id').notNullable();
      })
      .createTable('Attachments', (t) => {
        t.increments('id').primary();
        t.string('image_path');
        t.jsonb('image_meta');
        t.timestamps();
      })
      .createTable('Files', (t) => {
        t.increments('id').primary();
        t.string('document_path');
        t.jsonb('document_meta');
        t.timestamps();
      })
      .catch((e) => {
        throw new Error(e);
      });
  },

  destroy() {
    this.knex.destroy();
  },
});

module.exports = IntegrationTestUtils;

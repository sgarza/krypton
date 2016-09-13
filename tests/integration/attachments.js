/* globals Attachment, Class, Image, Krypton */
/* eslint no-unused-expressions: 0 */

const expect = require('chai').expect;
const path = require('path');

const truncate = require(path.join(__dirname, '..', 'truncate'));

describe('Attachments', () => {
  beforeEach(() => {
    truncate(Image);
  });

  describe('Attachment.Storage.Local', () => {
    describe('Image', () => {
      it('Should create an attachment from a local file', function handler() {
        this.timeout(5000);

        const attachment = new Image({});
        const file = path.join(process.cwd(), 'tests', 'assets', 'hubble.jpg');

        return attachment.save().then(() => {
          return attachment.attach('image', file);
        })
        .then(() => {
          expect(attachment.image).to.exist;
          return attachment.save();
        })
        .then(() => {
          expect(attachment.image.meta('original').ext).to.be.equal('jpeg');
          expect(attachment.image.meta('big').ext).to.be.equal('jpeg');
          expect(attachment.image.meta('small').ext).to.be.equal('jpeg');
        });
      });

      it('Should create an attachment from a remote URL', function handler() {
        this.timeout(5000);

        const attachment = new Image({});
        const file = 'https://nodejs.org/static/images/logos/nodejs-1440x900.png';

        return attachment.save().then(() => {
          return attachment.attach('image', file);
        })
        .then(() => {
          expect(attachment.image).to.exist;
          return attachment.save();
        })
        .then(() => {
          expect(attachment.image.meta('original').ext).to.be.equal('png');
          expect(attachment.image.meta('big').ext).to.be.equal('png');
          expect(attachment.image.meta('small').ext).to.be.equal('png');
        });
      });
    });

    describe('File', () => {
      it('Should create an attachment from a local file', function handler() {
        this.timeout(5000);

        const attachment = new File({});
        const file = path.join(process.cwd(), 'tests', 'assets', 'stories.pdf');

        return attachment.save().then(() => {
          return attachment.attach('document', file);
        })
        .then(() => {
          expect(attachment.document).to.exist;
          return attachment.save();
        })
        .then(() => {
          expect(attachment.document.meta('original').ext).to.be.equal('pdf');
          expect(attachment.document.meta('original').mimeType).to.be.equal('application/pdf');
          expect(attachment.document.url('original').match('original.pdf')).to.not.be.equal(null);
        });
      });

      it('Should create an attachment from a remote URL', function handler() {
        this.timeout(5000);

        const attachment = new File({});
        const file = 'http://unec.edu.az/application/uploads/2014/12/pdf-sample.pdf';

        return attachment.save().then(() => {
          return attachment.attach('document', file);
        })
        .then(() => {
          expect(attachment.document).to.exist;
          return attachment.save();
        })
        .then(() => {
          expect(attachment.document.meta('original').ext).to.be.equal('pdf');
          expect(attachment.document.meta('original').mimeType).to.be.equal('application/pdf');
          expect(attachment.document.url('original').match('original.pdf')).to.not.be.equal(null);
        });
      });
    });

    describe('Local Constraints', () => {
      it('Should pass if the fileSize provided in the file meta argument does met constraints', function handler() {
        this.timeout(5000);

        const attachment = new Image({});
        const file = path.join(process.cwd(), 'tests', 'assets', 'hubble.jpg');

        return attachment.save().then(() => {
          const meta = {
            fileSize: 2097152,
          };

          return attachment.attach('image', file, meta);
        })
        .then(() => {
          expect(attachment.image).to.exist;
        });
      });

      it('Should fail if the fileSize provided in the file meta argument does not met constraints', function handler() {
        this.timeout(5000);

        const attachment = new Image({});
        const file = path.join(process.cwd(), 'tests', 'assets', 'hubble.jpg');

        return attachment.save().then(() => {
          const meta = {
            fileSize: 6291456,
          };

          return attachment.attach('image', file, meta);
        })
        .then(() => {
          expect.fail;
        })
        .catch((err) => {
          expect(err.message).to.be.equal(Krypton.AttachmentStorage.Local.MAX_FILE_SIZE_ERROR);
        });
      });

      it('Should pass if the mimeType provided in the file meta argument does met constraints', function handler() {
        this.timeout(5000);

        const attachment = new Image({});
        const file = path.join(process.cwd(), 'tests', 'assets', 'hubble.jpg');

        return attachment.save().then(() => {
          const meta = {
            mimeType: 'image/png',
          };

          return attachment.attach('image', file, meta);
        })
        .then(() => {
          expect(attachment.image).to.exist;
        });
      });

      it('Should fail if the mimeType provided in the file meta argument does not met constraints', function handler() {
        this.timeout(5000);

        const attachment = new Image({});
        const file = path.join(process.cwd(), 'tests', 'assets', 'hubble.jpg');

        return attachment.save().then(() => {
          const meta = {
            mimeType: 'application/html',
          };

          return attachment.attach('image', file, meta);
        })
        .then(() => {
          expect.fail;
        })
        .catch((err) => {
          expect(err.message).to.be.equal(Krypton.AttachmentStorage.Local.MIME_TYPE_ERROR);
        });
      });
    });
  });

  describe('AttachmentStorage.S3', () => {
    it('Should upload to S3', function handler() {
      this.timeout(5000);

      const attachment = new ImageS3({});
      const file = path.join(process.cwd(), 'tests', 'assets', 'hubble.jpg');

      return attachment.save().then(() => {
        return attachment.attach('image', file);
      })
      .then(() => {
        expect(attachment.image).to.exist;
        return attachment.save();
      })
      .then(() => {
        expect(attachment.image.meta('original').ext).to.be.equal('jpeg');
        expect(attachment.image.meta('big').ext).to.be.equal('jpeg');
        expect(attachment.image.meta('small').ext).to.be.equal('jpeg');
        expect(attachment.image.url('original'))
          .to.be.equal(attachment.image.meta('original').key);
      });
    });
  });


  describe('Stream Constraints', () => {
    it('Should fail if the stream fileSize does not met constraints', function handler() {
      this.timeout(5000);

      Image.attachmentStorage.maxFileSize = 1;

      const attachment = new Image({});
      const file = path.join(process.cwd(), 'tests', 'assets', 'hubble.jpg');

      return attachment.save().then(() => {
        return attachment.attach('image', file);
      })
      .then(() => {
        expect.fail;
      })
      .catch((err) => {
        expect(err.message).to.be.equal(Krypton.AttachmentStorage.Local.MAX_FILE_SIZE_ERROR);
      });
    });

    it('Should fail if the stream\'s mimeType does not met constraints', function handler() {
      this.timeout(5000);

      Image.attachmentStorage.maxFileSize = 5000000;
      Image.attachmentStorage.acceptedMimeTypes = ['application/json'];

      const attachment = new Image({});
      const file = path.join(process.cwd(), 'tests', 'assets', 'hubble.jpg');

      return attachment.save().then(() => {
        return attachment.attach('image', file);
      })
      .then(() => {
        expect.fail;
      })
      .catch((err) => {
        expect(err.message).to.be.equal(Krypton.AttachmentStorage.Local.MIME_TYPE_ERROR);
      });
    });
  });
});

/* global Krypton, Class, */

const expect = require('chai').expect;

describe('Krypton.ExpressionParser', () => {
  const testParse = function testParse(str, parsed) {
    const expr = new Krypton.ExpressionParser(str);
    const res = JSON.parse(JSON.stringify(expr.parse()));
    expect(res).is.eql(parsed);
  };

  const testParseFail = function testParseFail(str) {
    expect(() => { new Krypton.ExpressionParser(str).parse() }).to.throw(Error);
  };

  describe('Parse', () => {
    it('Empty string', () => {
      testParse('', { nodes: [] });
    });

    it('Non String', () => {
      testParse(null, { nodes: [] });
      testParse(false, { nodes: [] });
      testParse(true, { nodes: [] });
      testParse(1, { nodes: [] });
      testParse({}, { nodes: [] });
      testParse([], { nodes: [] });
    });

    it('Single relation', () => {
      testParse('a', {
        nodes: [
          {
            name: 'a',
            children: [],
          },
        ],
      });

      testParse('[a]', {
        nodes: [
          {
            name: 'a',
            children: [],
          },
        ],
      });

      testParse('[[[a]]]', {
        nodes: [
          {
            name: 'a',
            children: [],
          },
        ],
      });
    });

    it('Nested relations', () => {
      testParse('a.b', {
        nodes: [{
          name: 'a',
          children: [{
            name: 'b',
            children: [],
          }],
        }],
      });

      testParse('a.b.c', {
        nodes: [{
          name: 'a',
          children: [{
            name: 'b',
            children: [{
              name: 'c',
              children: [],
            }],
          }],
        }],
      });
    });

    it('Multiple relations', () => {
      testParse('[a, b, c]', {
        nodes: [{
          name: 'a',
          children: [],
        }, {
          name: 'b',
          children: [],
        }, {
          name: 'c',
          children: [],
        }],
      });
    });

    it('Multiple nested relations', () => {
      testParse('[a.b, c.d.e, f]', {
        nodes: [{
          name: 'a',
          children: [{
            name: 'b',
            children: [],
          }],
        }, {
          name: 'c',
          children: [{
            name: 'd',
            children: [{
              name: 'e',
              children: [],
            }],
          }],
        }, {
          name: 'f',
          children: [],
        }],
      });
    });

    it('Multiple sub relations', () => {
      testParse('[a.[b, c.[d, e.f]], g]', {
        nodes: [{
          name: 'a',
          children: [{
            name: 'b',
            children: [],
          }, {
            name: 'c',
            children: [{
              name: 'd',
              children: [],
            }, {
              name: 'e',
              children: [{
                name: 'f',
                children: [],
              }],
            }],
          }],
        }, {
          name: 'g',
          children: [],
        }],
      });
    });

    it('Should fail gracefully on invalid input', () => {
      testParseFail('.');
      testParseFail('..');
      testParseFail('a.');
      testParseFail('.a');
      testParseFail('[');
      testParseFail(']');
      testParseFail('[]');
      testParseFail('[[]]');
      testParseFail('[a');
      testParseFail('a]');
      testParseFail('[a.]');
      testParseFail('a.[b]]');
      testParseFail('a.[.]');
      testParseFail('a.[.b]');
      testParseFail('[a,,b]');
      testParseFail('[a,b,]');
    });
  });
});

var expect = require('chai').expect;

var _ = require('lodash');

require('./../../');

describe('Krypton.ExpressionParser', function() {
  function testParse(str, parsed) {
    var expr = new Krypton.ExpressionParser(str);
    var res = JSON.parse(JSON.stringify(expr.parse()));
    expect(res).is.eql(parsed);
  }

  function testParseFail(str) {
    expect(function() { new Krypton.ExpressionParser(str).parse()}).to.throw(Error);
  }

  describe('Parse', function() {
    it('Empty string', function() {
      testParse('', { nodes: [] });
    });

    it('Non String', function() {
      testParse(null, { nodes: [] });
      testParse(false, { nodes: [] });
      testParse(true, { nodes: [] });
      testParse(1, { nodes: [] });
      testParse({}, { nodes: [] });
      testParse([], { nodes: [] });
    });

    it('Single relation', function() {
      testParse('a', {
        nodes : [
          {
            name : 'a',
            children : []
          }
        ]
      });

      testParse('[a]', {
        nodes : [
          {
            name : 'a',
            children : []
          }
        ]
      });

      testParse('[[[a]]]', {
        nodes : [
          {
            name : 'a',
            children : []
          }
        ]
      });
    });

    it('Nested relations', function() {
      testParse('a.b', {
        nodes: [{
          name: 'a',
          children: [{
            name: 'b',
            children: []
          }]
        }]
      });

      testParse('a.b.c', {
        nodes: [{
          name: 'a',
          children: [{
            name: 'b',
            children: [{
              name: 'c',
              children: []
            }]
          }]
        }]
      });
    });

    it('Multiple relations', function() {
      testParse('[a, b, c]', {
        nodes: [{
          name: 'a',
          children: []
        }, {
          name: 'b',
          children: []
        }, {
          name: 'c',
          children: []
        }]
      });
    });

    it('Multiple nested relations', function() {
      testParse('[a.b, c.d.e, f]', {
        nodes: [{
          name: 'a',
          children: [{
            name: 'b',
            children: []
          }]
        }, {
          name: 'c',
          children: [{
            name: 'd',
            children: [{
              name: 'e',
              children: []
            }]
          }]
        }, {
          name: 'f',
          children: []
        }]
      });
    });

    it('Multiple sub relations', function () {
      testParse('[a.[b, c.[d, e.f]], g]', {
        nodes: [{
          name: 'a',
          children: [{
            name: 'b',
            children: []
          }, {
            name: 'c',
            children: [{
              name: 'd',
              children: []
            }, {
              name: 'e',
              children: [{
                name: 'f',
                children: []
              }]
            }]
          }]
        }, {
          name: 'g',
          children: []
        }]
      });
    });

    it('Should fail gracefully on invalid input', function () {
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

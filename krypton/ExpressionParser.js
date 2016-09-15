/* global Class, Krypton */

const _ = require('lodash');

Class(Krypton, 'ExpressionNode')({
  prototype: {
    init(name) {
      this.name = name;
      this.children = [];
    },
  },
});

Class(Krypton, 'ExpressionParser')({
  prototype: {
    init(expression) {
      this.expression = expression;
    },

    parse() {
      if (!_.isString(this.expression) || !this.expression) {
        return new Krypton.Expression([]);
      }

      return new Krypton.Expression(this._parse(this.expression));
    },

    _parse(expression) {
      const parser = this;

      const rootNodes = [];

      let nodes = rootNodes;

      this._forEachToken(expression, '.', (token) => {
        nodes = parser._parseIterator(token, nodes);
      });

      return rootNodes;
    },

    _parseIterator(token, nodes) {
      if (this._isArrayToken(token)) {
        return this._parseArrayToken(token, nodes);
      }

      return this._parseToken(token, nodes);
    },

    _parseArrayToken(arrayToken, nodes) {
      const parser = this;

      arrayToken = this._stripArrayChars(arrayToken);

      this._forEachToken(arrayToken, ',', (token) => {
        parser._parseArrayIterator(token, nodes);
      });

      return nodes;
    },

    _parseArrayIterator(token, nodes) {
      const rel = this._parse(token);

      for (let i = 0, l = rel.length; i < l; ++i) {
        nodes.push(rel[i]);
      }
    },

    _parseToken(token, nodes) {
      if (token.length === 0) {
        return this._error();
      }

      const node = new Krypton.ExpressionNode(token);

      nodes.push(node);

      return node.children;
    },

    _forEachToken(expression, separator, callback) {
      let bracketDepth = 0;
      let previousMatchIndex = -1;
      let token = null;
      let i = 0;

      for (let l = expression.length; i <= l; ++i) {
        // We handle the last token by faking that there is a
        // separator after the last character.
        const c = (i === l) ? separator : expression.charAt(i);

        if (c === '[') {
          bracketDepth++;
        } else if (c === ']') {
          bracketDepth--;
        } else if (c === separator && bracketDepth === 0) {
          token = expression.substring(previousMatchIndex + 1, i).trim();
          callback.call(this, token);
          previousMatchIndex = i;
        }
      }

      if (bracketDepth !== 0) {
        this._error();
      }
    },

    _isArrayToken(token) {
      return token.length >= 2 && token.charAt(0) === '[' &&
        token.charAt(token.length - 1) === ']';
    },

    _stripArrayChars(token) {
      return token.substring(1, token.length - 1);
    },

    _error() {
      throw new Error(`Invalid Expression: ${this.expression}`);
    },
  },
});

Class(Krypton, 'Expression')({
  prototype: {
    nodes: null,

    init(nodes) {
      this.nodes = nodes;
    },
  },
});

var _ = require('lodash');

Class(Krypton, 'ExpressionNode')({
  prototype : {
    init : function(name) {
      this.name = name;
      this.children = [];
    }
  }
});

Class(Krypton, 'ExpressionParser')({
  prototype : {
    init : function(expression) {
      this.expression = expression;
    },

    parse : function() {
      if (!_.isString(this.expression) || !this.expression) {
        return new Krypton.Expression([]);

      } else {
        return new Krypton.Expression(this._parse(this.expression));
      }
    },

    _parse : function(expression) {
      var parser = this;

      var rootNodes = [];

      var nodes = rootNodes;

      this._forEachToken(expression, '.', function(token) {
        nodes = parser._parseIterator(token, nodes);
      });

      return rootNodes;
    },

    _parseIterator : function(token, nodes) {
      if (this._isArrayToken(token)) {
        return this._parseArrayToken(token, nodes);
      } else {
        return this._parseToken(token, nodes);
      }
    },

    _parseArrayToken : function(arrayToken, nodes) {
      var parser = this;

      arrayToken = this._stripArrayChars(arrayToken);

      this._forEachToken(arrayToken, ',', function(token) {
        parser._parseArrayIterator(token, nodes);
      });

      return nodes;
    },

    _parseArrayIterator : function(token, nodes) {
      var rel = this._parse(token);

      for (var i = 0, l = rel.length; i < l; ++i) {
        nodes.push(rel[i]);
      }
    },

    _parseToken : function(token, nodes) {
      if (token.length === 0) {
        return this._error();
      }

      var node = new Krypton.ExpressionNode(token);

      nodes.push(node);

      return node.children;
    },

    _forEachToken : function(expression, separator, callback) {
      var bracketDepth = 0;
      var previousMatchIndex = -1;
      var token = null;
      var i = 0;

      for (var l = expression.length; i <= l; ++i) {
        // We handle the last token by faking that there is a
        // separator after the last character.
        var c = (i === l) ? separator : expression.charAt(i);

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

    _isArrayToken : function(token) {
      return token.length >= 2 && token.charAt(0) ==='[' &&
      token.charAt(token.length - 1) === ']';
    },

    _stripArrayChars : function(token) {
      return token.substring(1, token.length - 1);
    },

    _error : function() {
      throw new Error('Invalid Expression: ' + this.expression);
    }
  }
});

Class(Krypton, 'Expression')({

  prototype : {
    nodes : null,

    init : function(nodes) {
      this.nodes = nodes;
    }
  }
})

Krypton.Relation = Class(Krypton, 'Relation')({
  prototype : {
    name : null,
    ownerModel : null,
    relatedModel : null,
    ownerCol : null,
    relatedCol : null,
    scope : null,
    joinTable : null,
    joinTableOwnerCol : null,
    joinTableRelatedCol : null,

    init : function(config) {
      Object.keys(config || {}).forEach(function (propertyName) {
        this[propertyName] = config[propertyName];
      }, this);

      return this;
    },

    fetch : function() {
      console.log('Not implemented');
      return false;
    }
  }
});

module.exports = Krypton.Relation;

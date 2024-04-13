const Routes = require('./routes');
module.exports = function(app,db,crypto) {
  Routes(app, db,crypto);
};
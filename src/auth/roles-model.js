'use strict';

const mongoose = require('mongoose');

const rolesSchema = new mongoose.Schema({
  role: {type: String, required:true, unique: true},
  capabilities: {type: Array, required:true},
});

module.exports = mongoose.model('roles', rolesSchema);

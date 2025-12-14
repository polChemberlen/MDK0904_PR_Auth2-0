const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  googleId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  email: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  profilePicture: {
    type: DataTypes.STRING
  },
  refreshToken: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'users',
  timestamps: true
});

module.exports = User;

const mongoose = require('mongoose');

const investigatorSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 24,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 40,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    avatarIcon: {
      type: String,
      default: '🔍',
    },
    avatarColor: {
      type: String,
      default: '#2d3a5c',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    casesCompleted: {
      type: [String],
      default: [],
    },
    investigatorRank: {
      type: String,
      enum: ['Rookie', 'Detective', 'Senior Detective', 'Lead Investigator'],
      default: 'Rookie',
    },
    friends: {
      type: [String],
      default: [],
    },
  },
  {
    versionKey: false,
    toJSON: {
      transform(_doc, ret) {
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('Investigator', investigatorSchema);
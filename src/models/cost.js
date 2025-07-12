const mongoose = require('mongoose');

const costSchema = new mongoose.Schema({
  originalPrice: {
    type: mongoose.Schema.Types.Decimal128,
    min: 100,
    required: true
  },
  discountPercentage: {
    type: Number,
    min: 0,
    max: 100
  },
  discountAmount: {
    type: mongoose.Schema.Types.Decimal128,
    min: 0
  },
  currentPrice: {
    type: mongoose.Schema.Types.Decimal128,
    min: 0
  }
});

module.exports = costSchema;

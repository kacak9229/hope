const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReviewSchema = new Schema({
  job: { type: Schema.Types.ObjectId, ref: 'Job'},
  comment: String,
  star: Number
});


module.exports = mongoose.model('Review', ReviewSchema);

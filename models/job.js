const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const JobSchema = new Schema({
  driver: { type: Schema.Types.ObjectId, ref: 'User'},
  passenger: { type: Schema.Types.ObjectId, ref: 'User'},
  source_location: {
      address: String,
      coordinates: {
        lat: Number,
        long: Number
      }
  },
  to_location: {
      address: String,
      coordinates: {
        lat: Number,
        long: Number
      }
  },
  total_price: Number,
  distance_in_km: Number
});


module.exports = mongoose.model('Job', JobSchema);

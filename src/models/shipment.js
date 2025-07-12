import mongoose from 'mongoose';

import addressSchema from './address.js';
import costSchema from './cost.js';

export const shipmentSchema = new mongoose.Schema({
  origin: addressSchema,
  destination: addressSchema,
  courier: { type: mongoose.Schema.Types.ObjectId, ref: 'Courier' },
  status: String,
  assignedTimestamp: Date,
  pickedUpTimestamp: Date,
  deliveredTimestamp: Date,
  cost: costSchema,
  bundle: { type: mongoose.Schema.Types.ObjectId, ref: 'Bundle' },
});

const ShipmentModel = mongoose.model('Shipment', shipmentSchema);
export default ShipmentModel;

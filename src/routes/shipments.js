const ShipmentModel = require('../models/shipment');
const CourierModel = require('../models/courier');
const addressSchema = require('../models/address');
const costSchema = require('../models/cost');

const mongoose = require('mongoose');
const faker = require('faker');
const { body } = require('express-validator');

module.exports = app => {
  app
    // Manager: Get all shipments
    .get('/shipments', async (req, res) => {
      const shipmentDocs = await ShipmentModel.find({});
      res.status(200).json(shipmentDocs);
    })

    // Assign courier
    .put('/shipment/courier/assign/:id', async (req, res) => {
      ShipmentModel.findByIdAndUpdate(req.params.id, {
        $set: {
          courier: req.body.courier,
          status: 'ASSIGNED',
          assignedTimestamp: req.body.timestamp
        }
      })
        .then(async () => {
          const courierDoc = await CourierModel.findById(req.body.courier);
          courierDoc.shipments.push(req.params.id);
          await courierDoc.save();
        })
        .then(() => {
          return res.status(200).json({
            message: `Shipment with ID ${req.params.id} has been assigned to courier ${req.body.courier}.`
          });
        })
        .catch(err => {
          console.error(err);
          res.status(500).json({ message: 'Internal server error' });
        });
    })

    // Apply discount (amount)
    .put('/shipment/:id/discount/amount', async (req, res) => {
      const updateAmount = req.body.discountAmount * 100;
      const shipmentDoc = await ShipmentModel.findById(req.params.id);
      let newPrice = shipmentDoc.cost.currentPrice - updateAmount;
      if (newPrice < 0) newPrice = 0;
      shipmentDoc.cost.currentPrice = newPrice;
      await shipmentDoc.save();
      return res.status(200).json({
        message: `Shipment with ID ${req.params.id} has been discounted by ${updateAmount}!`
      });
    })

    // Apply discount (percentage)
    .put('/shipment/:id/discount/percentage', async (req, res) => {
      const updatePercentage = req.body.discountPercentage;
      const shipmentDoc = await ShipmentModel.findById(req.params.id);
      const newPrice = shipmentDoc.cost.currentPrice - (shipmentDoc.cost.currentPrice * updatePercentage / 100);
      shipmentDoc.cost.currentPrice = Math.max(0, newPrice);
      await shipmentDoc.save();
      return res.status(200).json({
        message: `Shipment with ID ${req.params.id} has been discounted by ${updatePercentage}%!`
      });
    })

    // Courier: get shipments by courier ID
    .get('/shipments/courier/:id', async (req, res) => {
      const courierShipmentDocs = await ShipmentModel.find({ courier: req.params.id });
      res.status(200).json(courierShipmentDocs);
    })

    // Get single shipment
    .get('/shipment/:id', async (req, res) => {
      const shipmentDoc = await ShipmentModel.findById(req.params.id);
      res.status(200).json(shipmentDoc);
    })

    // Register picked up
    .put('/shipment/:id/pickedup', async (req, res) => {
      ShipmentModel.findByIdAndUpdate(req.params.id, {
        $set: {
          status: 'PICKED_UP',
          pickedUpTimestamp: req.body.timestamp
        }
      })
        .then(() => {
          return res.status(200).json({
            message: `Shipment with ID ${req.params.id} has been picked up at ${req.body.timestamp}!`
          });
        })
        .catch(err => {
          console.error(err);
          res.status(500).json({ message: 'Internal server error' });
        });
    })

    // Register delivered
    .put('/shipment/:id/delivered', async (req, res) => {
      ShipmentModel.findByIdAndUpdate(req.params.id, {
        $set: {
          status: 'DELIVERED',
          deliveredTimestamp: req.body.timestamp
        }
      })
        .then(() => {
          return res.status(200).json({
            message: `Shipment with ID ${req.params.id} has been delivered!`
          });
        })
        .catch(err => {
          console.error(err);
          res.status(500).json({ message: 'Internal server error' });
        });
    })

    // Demo: create new shipment
    .post('/shipment/new', async (req, res) => {
      function generateAmount() {
        return Math.floor(Math.random() * 20001) + 1;
      }

      function generatePercentage() {
        return Math.floor(Math.random() * 101);
      }

      const oPrice = generateAmount() + 20000;
      const dPercentage = generatePercentage();
      const dAmount = generateAmount();
      let cPrice = oPrice - ((oPrice * dPercentage) / 100) - dAmount;
      if (cPrice < 0) cPrice = 0;

      const cost = {
        _id: mongoose.Types.ObjectId(),
        originalPrice: oPrice,
        discountPercentage: dPercentage,
        discountAmount: dAmount,
        currentPrice: cPrice
      };

      const generateAddress = () => ({
        _id: mongoose.Types.ObjectId(),
        name: `${faker.name.firstName()} ${faker.name.lastName()}`,
        companyName: faker.company.companyName(),
        streetAddress: faker.address.streetAddress(),
        postalCode: faker.address.zipCode(),
        city: faker.address.city(),
        country: faker.address.country(),
        email: faker.internet.email(),
        phone: faker.phone.phoneNumber()
      });

      const shipment = {
        origin: generateAddress(),
        destination: generateAddress(),
        status: 'WAITING',
        cost: cost
      };

      await ShipmentModel.create(shipment, err => {
        if (err) {
          console.error(err);
          res.status(500).json({ message: 'Internal server error; could not create shipment' });
        } else {
          res.status(200).json({ message: 'New shipment created!' });
        }
      });
    })

    // Dev only: delete shipment
    .delete('/shipment/delete/:id', (req, res) => {
      ShipmentModel.findByIdAndDelete(req.params.id)
        .then(() => {
          res.status(200).json({ message: 'Shipment deleted.' });
        })
        .catch(error => {
          console.error(error);
        });
    });
};

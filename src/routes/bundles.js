const BundleModel = require('../models/bundle');
const ShipmentModel = require('../models/shipment');
const CourierModel = require('../models/courier');

const mongoose = require('mongoose');
const { body } = require('express-validator'); // fixed import

module.exports = app => {
  app
    // MANAGER tasks
    // Get all bundles
    .get('/bundles', async (req, res) => {
      try {
        const bundleDocs = await BundleModel.find({});
        res.status(200).json(bundleDocs);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
      }
    })

    // Get bundle by ID
    .get('/bundle/:id', async (req, res) => {
      try {
        const bundleDoc = await BundleModel.findById(req.params.id);
        res.status(200).json(bundleDoc);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
      }
    })

    // Create a bundle (with shipments)
    .post('/bundle/create', async (req, res) => {
      try {
        const newBundle = new BundleModel({
          shipments: req.body.shipments,
        });

        await Promise.all(
          req.body.shipments.map(shipmentId =>
            ShipmentModel.findByIdAndUpdate(
              shipmentId,
              { $set: { bundle: mongoose.Types.ObjectId(newBundle._id) } }
            )
          )
        );

        await newBundle.save();

        res.status(200).json({ message: 'Bundle created!' });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
      }
    })

    // Assign bundle to courier
    .put('/bundle/assign/:id/', async (req, res) => {
      try {
        await BundleModel.findByIdAndUpdate(req.params.id, {
          $set: {
            courier: req.body.courier,
            status: 'ASSIGNED',
            assignedTimestamp: req.body.timestamp,
          },
        });

        const courierDoc = await CourierModel.findById(req.body.courier);
        const bundleDoc = await BundleModel.findById(req.params.id);

        // Add bundle shipments to courier shipments
        bundleDoc.shipments.forEach(shipmentId => {
          courierDoc.shipments.push(mongoose.Types.ObjectId(shipmentId));
        });

        await Promise.all(
          bundleDoc.shipments.map(shipmentId =>
            ShipmentModel.findByIdAndUpdate(
              shipmentId,
              { $set: { bundle: mongoose.Types.ObjectId(req.params.id) } }
            )
          )
        );

        await courierDoc.save();

        res.status(200).json({ message: 'Bundle assigned to courier!' });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
      }
    })

    // Discount bundle by amount
    .put('/bundle/:id/discount/amount', async (req, res) => {
      try {
        const updateAmount = req.body.discountAmount * 100;
        const bundleToDiscount = await BundleModel.findById(req.params.id);

        await Promise.all(
          bundleToDiscount.shipments.map(async shipmentId => {
            const shipmentDoc = await ShipmentModel.findById(shipmentId);
            let newPrice = shipmentDoc.cost.currentPrice - updateAmount;
            if (newPrice < 0) newPrice = 0;
            shipmentDoc.cost.currentPrice = newPrice;
            await shipmentDoc.save();
          })
        );

        res.status(200).json({ message: 'Bundle discounted by an amount!' });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
      }
    })

    // Discount bundle by percentage
    .put('/bundle/:id/discount/percentage', async (req, res) => {
      try {
        const updatePercentage = req.body.discountPercentage;
        const bundleToDiscount = await BundleModel.findById(req.params.id);

        await Promise.all(
          bundleToDiscount.shipments.map(async shipmentId => {
            const shipmentDoc = await ShipmentModel.findById(shipmentId);
            let newPrice = shipmentDoc.cost.currentPrice - (shipmentDoc.cost.currentPrice * updatePercentage / 100);
            if (newPrice < 0) newPrice = 0;
            shipmentDoc.cost.currentPrice = newPrice;
            await shipmentDoc.save();
          })
        );

        res.status(200).json({ message: 'Bundle discounted by a percentage!' });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
      }
    })

    // Get bundles assigned to a courier
    .get('/bundles/courier/:id', async (req, res) => {
      try {
        const courierBundleDocs = await BundleModel.find({ courier: req.params.id });
        res.status(200).json(courierBundleDocs);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
      }
    })

    // COURIER tasks TODO
    .put('/bundle/:id/picked-up', async (req, res) => {
      // TODO: implement marking bundle picked up
      res.status(501).json({ message: 'Not implemented' });
    })

    .put('/bundle/:id/delivered', async (req, res) => {
      // TODO: implement marking bundle delivered
      res.status(501).json({ message: 'Not implemented' });
    });
};

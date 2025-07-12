const CourierModel = require('../models/courier');
const faker = require('faker');
const { body } = require('express-validator'); // fixed import
const mongoose = require('mongoose');

module.exports = app => {
  app
    // MANAGER tasks
    // Get all couriers
    .get('/couriers', async (req, res) => {
      try {
        const courierDocs = await CourierModel.find({});
        res.status(200).json(courierDocs);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
      }
    })

    // Get courier by ID
    .get('/courier/:id', async (req, res) => {
      try {
        const courierDoc = await CourierModel.findById(req.params.id);
        res.status(200).json(courierDoc);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
      }
    })

    // Create a test courier (demo purposes)
    .post('/courier/new', async (req, res) => {
      try {
        let courier = {
          name: faker.name.firstName(),
          shipments: [],
        };
        await CourierModel.create(courier);
        res.status(200).json({ message: 'New courier created!' });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error; could not create courier' });
      }
    })

    // Update courier name (demo/test/dev only)
    .put('/courier/update/:id', async (req, res) => {
      try {
        await CourierModel.findByIdAndUpdate(req.params.id, { $set: { name: faker.name.firstName() } });
        res.status(200).json({ message: 'Name updated!' });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error; could not update courier' });
      }
    });
};

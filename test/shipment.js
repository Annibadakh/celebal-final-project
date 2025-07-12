process.env.NODE_ENV = 'test';

const mongoose = require('mongoose');
const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const ShipmentModel = require('../src/models/shipment');
const CourierModel = require('../src/models/courier');
const server = require('../server');

const should = chai.should();
chai.use(chaiHttp);

// --------------------------------------------
// 🔧 Utility Functions
// --------------------------------------------

function generateAddress() {
  return {
    street: faker.address.streetAddress(),
    city: faker.address.city(),
    state: faker.address.state(),
    postalCode: faker.address.zipCode(),
    country: faker.address.country()
  };
}

function generatePercentage() {
  return Math.floor(Math.random() * 101); // 0 to 100
}

function generateAmount() {
  return Math.floor(Math.random() * 20001) + 1; // 1 to 20000
}

function toDecimal128(num) {
  return mongoose.Types.Decimal128.fromString(num.toFixed(2));
}

function generateCost() {
  const oPrice = generateAmount() + 20000;
  const dPercentage = generatePercentage();
  const dAmount = generateAmount();
  let cPrice = oPrice - (oPrice * dPercentage) / 100 - dAmount;
  if (cPrice < 0) cPrice = 0;

  return {
    _id: mongoose.Types.ObjectId(),
    originalPrice: toDecimal128(oPrice),
    discountPercentage: dPercentage,
    discountAmount: toDecimal128(dAmount),
    currentPrice: toDecimal128(cPrice)
  };
}

function generateCourierId() {
  return mongoose.Types.ObjectId();
}

function generateOrderStatus() {
  const statuses = ['WAITING', 'ASSIGNED', 'PICKED_UP', 'DELIVERED'];
  return statuses[Math.floor(Math.random() * statuses.length)];
}

function generateShipment(courierId) {
  return {
    _id: mongoose.Types.ObjectId(),
    origin: generateAddress(),
    destination: generateAddress(),
    courier: courierId || generateCourierId(),
    status: generateOrderStatus(),
    assignedTimestamp: faker.date.past(),
    deliveredTimestamp: faker.date.past(),
    cost: generateCost()
  };
}

// --------------------------------------------
// 🚀 Mocha Tests
// --------------------------------------------

describe('Shipments', () => {
  beforeEach((done) => {
    ShipmentModel.deleteMany({}, () => {
      CourierModel.deleteMany({}, done);
    });
  });

  describe('GET /shipments', () => {
    it('should get a list of all shipments', (done) => {
      chai.request(server)
        .get('/shipments')
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('array');
          res.body.length.should.be.eql(0);
          done();
        });
    });
  });

  describe('POST /shipment/:id/discount/amount', () => {
    it('should apply a discount amount to a shipment', async () => {
      const courierId = generateCourierId();
      const shipmentData = new ShipmentModel(generateShipment(courierId));
      const savedShipment = await shipmentData.save();

      const discountAmount = 1500;
      const res = await chai.request(server)
        .post(`/shipment/${savedShipment._id}/discount/amount`)
        .send({ discountAmount });

      res.should.have.status(200);
      res.body.should.have.property('discountAmount');
    });
  });

  describe('POST /shipment/:id/discount/percentage', () => {
    it('should apply a discount percentage to a shipment', async () => {
      const courierId = generateCourierId();
      const shipmentData = new ShipmentModel(generateShipment(courierId));
      const savedShipment = await shipmentData.save();

      const discountPercentage = 10;
      const res = await chai.request(server)
        .post(`/shipment/${savedShipment._id}/discount/percentage`)
        .send({ discountPercentage });

      res.should.have.status(200);
      res.body.should.have.property('discountPercentage');
    });
  });

  describe('GET /shipments/courier/:id', () => {
    it("should get a list of all shipments for a courier, by courier ID", async () => {
      const courierId = generateCourierId();
      const courier = new CourierModel({ _id: courierId });
      await courier.save();

      await ShipmentModel.create([
        generateShipment(courierId),
        generateShipment(courierId)
      ]);

      const res = await chai.request(server)
        .get(`/shipments/courier/${courierId}`);

      res.should.have.status(200);
      res.body.should.be.a('array');
      res.body.length.should.be.gte(2);
    });
  });

  describe('POST /shipment/:id/pickedup', () => {
    it('should mark a shipment as picked up', async () => {
      const shipment = await ShipmentModel.create(generateShipment());

      const res = await chai.request(server)
        .post(`/shipment/${shipment._id}/pickedup`);

      res.should.have.status(200);
      res.body.should.have.property('status').eql('PICKED_UP');
    });
  });

  describe('POST /shipment/:id/delivered', () => {
    it('should mark a shipment as delivered', async () => {
      const shipment = await ShipmentModel.create(generateShipment());

      const res = await chai.request(server)
        .post(`/shipment/${shipment._id}/delivered`);

      res.should.have.status(200);
      res.body.should.have.property('status').eql('DELIVERED');
    });
  });
});

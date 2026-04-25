const { Sequelize, DataTypes } = require('sequelize');

// init sequelize connection
const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://user:password@postgres:5432/ecommerce_db', {
  logging: false
});

// cart model definition
const Cart = sequelize.define('Cart', {
  sessionId: { type: DataTypes.STRING, allowNull: false },
  totalPrice: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 }
});

// cart lines with validation
const CartLine = sequelize.define('CartLine', {
  productId: { type: DataTypes.INTEGER, allowNull: false },
  quantity: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    validate: { min: 1 } // requirement: quantity > 0
  }
});

// relations for eager loading
Cart.hasMany(CartLine, { as: 'lines' });
CartLine.belongsTo(Cart);

// domain hook for price calculation
CartLine.addHook('afterSave', async (line) => {
  // logic to update total price would go here
  console.log(`line updated for cart ${line.CartId}`);
});

module.exports = { sequelize, Cart, CartLine };
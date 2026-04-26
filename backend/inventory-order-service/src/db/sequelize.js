const { Sequelize, DataTypes } = require('sequelize');

// init sequelize connection
const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://user:password@postgres:5432/ecommerce_db', {
  logging: false
});

// cart model definition
const Cart = sequelize.define('Cart', {
  userId: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.ENUM('OPEN', 'CLOSED'), defaultValue: 'OPEN' },
  totalPrice: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 }
}, {
  // domain Hook
  hooks: {
    beforeSave: (cart) => {
      // logic to ensure total price is never negative
      if (cart.totalPrice < 0) cart.totalPrice = 0;
    }
  }
});

// cart lines with validation
const CartLine = sequelize.define('CartLine', {
  productId: { type: DataTypes.INTEGER, allowNull: false },
  // model validation
  quantity: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    validate: { min: 1 } // requirement: quantity > 0
  },
  priceAtEntry: { 
    type: DataTypes.DECIMAL(10, 2), 
    allowNull: false,
    validate: { isDecimal: true }
  }
});

// relations for eager loading
Cart.hasMany(CartLine);
CartLine.belongsTo(Cart);

// domain hook for price calculation
CartLine.addHook('afterSave', async (line) => {
  // logic to update total price would go here
  console.log(`line updated for cart ${line.CartId}`);
});

module.exports = { sequelize, Cart, CartLine };
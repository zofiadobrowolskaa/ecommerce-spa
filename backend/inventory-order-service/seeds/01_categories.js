exports.seed = async function(knex) {
  // first delete products to respect foreign key constraint
  await knex('products').del();
  // then delete existing categories to prevent duplicates
  await knex('categories').del();
  
  // insert default domain seeds
  await knex('categories').insert([
    { id: 1, name: 'Earrings' },
    { id: 2, name: 'Rings' },
    { id: 3, name: 'Necklaces' },
    { id: 4, name: 'Bracelets' }
  ]);
};
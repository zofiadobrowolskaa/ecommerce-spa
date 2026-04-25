exports.up = function(knex) {
  // add categories and link to products
  return knex.schema
    .createTable('categories', table => {
      table.increments('id').primary();
      table.string('name').notNullable();
    })
    .alterTable('products', table => {
      table.integer('category_id').references('id').inTable('categories');
    });
};

exports.down = function(knex) {
  return knex.schema.alterTable('products', table => {
    table.dropColumn('category_id');
  }).dropTable('categories');
};
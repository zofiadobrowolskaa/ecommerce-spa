// configuration for knex migrations and seeds
module.exports = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL || 'postgres://user:password@postgres:5432/ecommerce_db',
    migrations: { directory: './migrations' },
    seeds: { directory: './seeds' }
  }
};
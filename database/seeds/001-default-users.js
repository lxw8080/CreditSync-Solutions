'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('admin123456', 12);
    
    await queryInterface.bulkInsert('users', [
      {
        username: 'admin',
        password_hash: hashedPassword,
        role: 'admin',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        username: 'customer_service_1',
        password_hash: await bcrypt.hash('cs123456', 12),
        role: 'customer_service',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        username: 'customer_service_2',
        password_hash: await bcrypt.hash('cs123456', 12),
        role: 'customer_service',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  }
};

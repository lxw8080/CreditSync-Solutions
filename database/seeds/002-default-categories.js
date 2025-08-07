'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('material_categories', [
      {
        name: '身份证明',
        description: '客户身份相关证明文件',
        sort_order: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: '收入证明',
        description: '客户收入相关证明文件',
        sort_order: 2,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: '资产证明',
        description: '客户资产相关证明文件',
        sort_order: 3,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: '银行流水',
        description: '客户银行账户流水记录',
        sort_order: 4,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: '其他材料',
        description: '其他补充材料',
        sort_order: 5,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('material_categories', null, {});
  }
};

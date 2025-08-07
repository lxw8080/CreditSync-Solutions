'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 获取分类ID
    const categories = await queryInterface.sequelize.query(
      'SELECT id, name FROM material_categories ORDER BY sort_order',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name] = cat.id;
    });

    await queryInterface.bulkInsert('material_items', [
      // 身份证明
      {
        category_id: categoryMap['身份证明'],
        name: '身份证正面',
        description: '身份证正面照片，需清晰可见',
        file_types: JSON.stringify(['image']),
        is_required: true,
        sort_order: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        category_id: categoryMap['身份证明'],
        name: '身份证反面',
        description: '身份证反面照片，需清晰可见',
        file_types: JSON.stringify(['image']),
        is_required: true,
        sort_order: 2,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        category_id: categoryMap['身份证明'],
        name: '户口本',
        description: '户口本相关页面照片',
        file_types: JSON.stringify(['image']),
        is_required: false,
        sort_order: 3,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      
      // 收入证明
      {
        category_id: categoryMap['收入证明'],
        name: '工资流水',
        description: '近6个月工资流水',
        file_types: JSON.stringify(['image', 'text']),
        is_required: true,
        sort_order: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        category_id: categoryMap['收入证明'],
        name: '收入证明',
        description: '单位开具的收入证明',
        file_types: JSON.stringify(['image']),
        is_required: true,
        sort_order: 2,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        category_id: categoryMap['收入证明'],
        name: '劳动合同',
        description: '与用人单位签署的劳动合同',
        file_types: JSON.stringify(['image']),
        is_required: false,
        sort_order: 3,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      
      // 资产证明
      {
        category_id: categoryMap['资产证明'],
        name: '房产证',
        description: '房产证明文件',
        file_types: JSON.stringify(['image']),
        is_required: false,
        sort_order: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        category_id: categoryMap['资产证明'],
        name: '车辆行驶证',
        description: '车辆行驶证照片',
        file_types: JSON.stringify(['image']),
        is_required: false,
        sort_order: 2,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      
      // 银行流水
      {
        category_id: categoryMap['银行流水'],
        name: '银行流水单',
        description: '近6个月银行流水',
        file_types: JSON.stringify(['image', 'text']),
        is_required: true,
        sort_order: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      
      // 其他材料
      {
        category_id: categoryMap['其他材料'],
        name: '补充说明',
        description: '其他需要补充的文字说明',
        file_types: JSON.stringify(['text']),
        is_required: false,
        sort_order: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        category_id: categoryMap['其他材料'],
        name: '其他文件',
        description: '其他相关文件',
        file_types: JSON.stringify(['image', 'video']),
        is_required: false,
        sort_order: 2,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('material_items', null, {});
  }
};

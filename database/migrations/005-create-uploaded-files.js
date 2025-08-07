'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('uploaded_files', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'orders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      material_item_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'material_items',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      file_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      original_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      file_path: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      file_size: {
        type: Sequelize.BIGINT,
        allowNull: true
      },
      file_type: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      mime_type: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      upload_time: {
        type: Sequelize.DATE,
        allowNull: false
      },
      uploader_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      text_content: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      checksum: {
        type: Sequelize.STRING(64),
        allowNull: true
      },
      thumbnail_path: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 添加索引
    await queryInterface.addIndex('uploaded_files', ['order_id']);
    await queryInterface.addIndex('uploaded_files', ['material_item_id']);
    await queryInterface.addIndex('uploaded_files', ['upload_time']);
    await queryInterface.addIndex('uploaded_files', ['uploader_id']);
    await queryInterface.addIndex('uploaded_files', ['file_type']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('uploaded_files');
  }
};

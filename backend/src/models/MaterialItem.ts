import { DataTypes, Model, Optional, Association } from 'sequelize'
import { sequelize } from '../config/database'
import { MaterialCategory } from './MaterialCategory'

interface MaterialItemAttributes {
  id: number
  categoryId: number
  name: string
  description?: string
  fileTypes: string[]
  isRequired: boolean
  sortOrder: number
  isActive: boolean
  validationRules?: any
  createdAt: Date
  updatedAt: Date
}

interface MaterialItemCreationAttributes extends Optional<MaterialItemAttributes, 'id' | 'createdAt' | 'updatedAt' | 'description' | 'validationRules'> {}

class MaterialItem extends Model<MaterialItemAttributes, MaterialItemCreationAttributes> implements MaterialItemAttributes {
  public id!: number
  public categoryId!: number
  public name!: string
  public description?: string
  public fileTypes!: string[]
  public isRequired!: boolean
  public sortOrder!: number
  public isActive!: boolean
  public validationRules?: any
  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  // 关联
  public readonly category?: MaterialCategory
  public readonly uploadedFiles?: any[]

  public static associations: {
    category: Association<MaterialItem, MaterialCategory>
    uploadedFiles: Association<MaterialItem, any>
  }
}

MaterialItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'category_id',
      references: {
        model: MaterialCategory,
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [1, 100],
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    fileTypes: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: ['image'],
      field: 'file_types',
      validate: {
        isValidFileTypes(value: string[]) {
          const validTypes = ['image', 'video', 'text']
          if (!Array.isArray(value) || value.length === 0) {
            throw new Error('File types must be a non-empty array')
          }
          for (const type of value) {
            if (!validTypes.includes(type)) {
              throw new Error(`Invalid file type: ${type}`)
            }
          }
        }
      }
    },
    isRequired: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_required'
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'sort_order'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    },
    validationRules: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'validation_rules'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at'
    }
  },
  {
    sequelize,
    tableName: 'material_items',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['category_id']
      },
      {
        fields: ['sort_order']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['is_required']
      }
    ]
  }
)

// 定义关联
MaterialItem.belongsTo(MaterialCategory, {
  foreignKey: 'categoryId',
  as: 'category'
})

MaterialCategory.hasMany(MaterialItem, {
  foreignKey: 'categoryId',
  as: 'materialItems'
})

export { MaterialItem, MaterialItemAttributes, MaterialItemCreationAttributes }

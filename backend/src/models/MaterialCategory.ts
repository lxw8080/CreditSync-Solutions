import { DataTypes, Model, Optional, Association } from 'sequelize'
import { sequelize } from '../config/database'

interface MaterialCategoryAttributes {
  id: number
  name: string
  description?: string
  sortOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

interface MaterialCategoryCreationAttributes extends Optional<MaterialCategoryAttributes, 'id' | 'createdAt' | 'updatedAt' | 'description'> {}

class MaterialCategory extends Model<MaterialCategoryAttributes, MaterialCategoryCreationAttributes> implements MaterialCategoryAttributes {
  public id!: number
  public name!: string
  public description?: string
  public sortOrder!: number
  public isActive!: boolean
  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  // 关联
  public readonly materialItems?: any[]

  public static associations: {
    materialItems: Association<MaterialCategory, any>
  }
}

MaterialCategory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
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
    tableName: 'material_categories',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['sort_order']
      },
      {
        fields: ['is_active']
      }
    ]
  }
)

export { MaterialCategory, MaterialCategoryAttributes, MaterialCategoryCreationAttributes }

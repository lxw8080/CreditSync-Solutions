import { DataTypes, Model, Optional, Association } from 'sequelize'
import { sequelize } from '../config/database'
import { User } from './User'

interface OrderAttributes {
  id: number
  orderNumber: string
  customerName: string
  customerIdCard?: string
  creatorId: number
  status: 'in_progress' | 'completed'
  submittedAt?: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}

interface OrderCreationAttributes extends Optional<OrderAttributes, 'id' | 'createdAt' | 'updatedAt' | 'submittedAt' | 'notes'> {}

class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  public id!: number
  public orderNumber!: string
  public customerName!: string
  public customerIdCard?: string
  public creatorId!: number
  public status!: 'in_progress' | 'completed'
  public submittedAt?: Date
  public notes?: string
  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  // 关联
  public readonly creator?: User

  public static associations: {
    creator: Association<Order, User>
  }

  // 生成订单号
  public static generateOrderNumber(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const timestamp = now.getTime().toString().slice(-6)
    return `ORD${year}${month}${day}${timestamp}`
  }
}

Order.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    orderNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'order_number'
    },
    customerName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'customer_name',
      validate: {
        len: [1, 100],
        notEmpty: true
      }
    },
    customerIdCard: {
      type: DataTypes.STRING(18),
      allowNull: true,
      field: 'customer_id_card',
      validate: {
        len: [15, 18]
      }
    },
    creatorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'creator_id',
      references: {
        model: User,
        key: 'id'
      }
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'in_progress',
      validate: {
        isIn: [['in_progress', 'completed']]
      }
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'submitted_at'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
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
    tableName: 'orders',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['order_number']
      },
      {
        fields: ['creator_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['customer_name']
      }
    ]
  }
)

// 定义关联
Order.belongsTo(User, {
  foreignKey: 'creatorId',
  as: 'creator'
})

export { Order, OrderAttributes, OrderCreationAttributes }

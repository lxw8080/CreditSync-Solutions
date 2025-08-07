import { DataTypes, Model, Optional, Association } from 'sequelize'
import { sequelize } from '../config/database'
import { Order } from './Order'
import { User } from './User'
import { v4 as uuidv4 } from 'uuid'

interface CollaborationLinkAttributes {
  id: number
  orderId: number
  token: string
  expiresAt: Date
  createdBy: number
  accessCount: number
  lastAccessedAt?: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

interface CollaborationLinkCreationAttributes extends Optional<CollaborationLinkAttributes, 'id' | 'createdAt' | 'updatedAt' | 'token' | 'accessCount' | 'lastAccessedAt' | 'isActive'> {}

class CollaborationLink extends Model<CollaborationLinkAttributes, CollaborationLinkCreationAttributes> implements CollaborationLinkAttributes {
  public id!: number
  public orderId!: number
  public token!: string
  public expiresAt!: Date
  public createdBy!: number
  public accessCount!: number
  public lastAccessedAt?: Date
  public isActive!: boolean
  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  // 关联
  public readonly order?: Order
  public readonly creator?: User

  public static associations: {
    order: Association<CollaborationLink, Order>
    creator: Association<CollaborationLink, User>
  }

  // 生成协同链接token
  public static generateToken(): string {
    return uuidv4().replace(/-/g, '')
  }

  // 检查链接是否有效
  public isValid(): boolean {
    return this.isActive && new Date() < this.expiresAt
  }

  // 记录访问
  public async recordAccess(): Promise<void> {
    this.accessCount += 1
    this.lastAccessedAt = new Date()
    await this.save()
  }
}

CollaborationLink.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'order_id',
      references: {
        model: Order,
        key: 'id'
      }
    },
    token: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      defaultValue: () => CollaborationLink.generateToken()
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at'
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'created_by',
      references: {
        model: User,
        key: 'id'
      }
    },
    accessCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'access_count'
    },
    lastAccessedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_accessed_at'
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
    tableName: 'collaboration_links',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['token']
      },
      {
        fields: ['order_id']
      },
      {
        fields: ['expires_at']
      },
      {
        fields: ['is_active']
      }
    ]
  }
)

// 定义关联
CollaborationLink.belongsTo(Order, {
  foreignKey: 'orderId',
  as: 'order'
})

CollaborationLink.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator'
})

export { CollaborationLink, CollaborationLinkAttributes, CollaborationLinkCreationAttributes }

import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../config/database'

interface UserAttributes {
  id: number
  username: string
  passwordHash: string
  role: 'admin' | 'customer_service'
  isActive: boolean
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt' | 'lastLoginAt'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number
  public username!: string
  public passwordHash!: string
  public role!: 'admin' | 'customer_service'
  public isActive!: boolean
  public lastLoginAt?: Date
  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  // 实例方法
  public toJSON(): Omit<UserAttributes, 'passwordHash'> {
    const values = { ...this.get() }
    delete values.passwordHash
    return values
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
        notEmpty: true
      }
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash'
    },
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'customer_service',
      validate: {
        isIn: [['admin', 'customer_service']]
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login_at'
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
    tableName: 'users',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['username']
      },
      {
        fields: ['role']
      },
      {
        fields: ['is_active']
      }
    ]
  }
)

export { User, UserAttributes, UserCreationAttributes }

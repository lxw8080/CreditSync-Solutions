import { DataTypes, Model, Optional, Association } from 'sequelize'
import { sequelize } from '../config/database'
import { Order } from './Order'
import { MaterialItem } from './MaterialItem'
import { User } from './User'

interface UploadedFileAttributes {
  id: number
  orderId: number
  materialItemId: number
  fileName?: string
  originalName?: string
  filePath?: string
  fileSize?: number
  fileType?: string
  mimeType?: string
  uploadTime: Date
  uploaderId: number
  textContent?: string
  checksum?: string
  thumbnailPath?: string
  metadata?: any
  createdAt: Date
  updatedAt: Date
}

interface UploadedFileCreationAttributes extends Optional<UploadedFileAttributes, 'id' | 'createdAt' | 'updatedAt' | 'fileName' | 'originalName' | 'filePath' | 'fileSize' | 'fileType' | 'mimeType' | 'textContent' | 'checksum' | 'thumbnailPath' | 'metadata'> {}

class UploadedFile extends Model<UploadedFileAttributes, UploadedFileCreationAttributes> implements UploadedFileAttributes {
  public id!: number
  public orderId!: number
  public materialItemId!: number
  public fileName?: string
  public originalName?: string
  public filePath?: string
  public fileSize?: number
  public fileType?: string
  public mimeType?: string
  public uploadTime!: Date
  public uploaderId!: number
  public textContent?: string
  public checksum?: string
  public thumbnailPath?: string
  public metadata?: any
  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  // 关联
  public readonly order?: Order
  public readonly materialItem?: MaterialItem
  public readonly uploader?: User

  public static associations: {
    order: Association<UploadedFile, Order>
    materialItem: Association<UploadedFile, MaterialItem>
    uploader: Association<UploadedFile, User>
  }
}

UploadedFile.init(
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
    materialItemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'material_item_id',
      references: {
        model: MaterialItem,
        key: 'id'
      }
    },
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'file_name'
    },
    originalName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'original_name'
    },
    filePath: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'file_path'
    },
    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'file_size'
    },
    fileType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'file_type'
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'mime_type'
    },
    uploadTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'upload_time'
    },
    uploaderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'uploader_id',
      references: {
        model: User,
        key: 'id'
      }
    },
    textContent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'text_content'
    },
    checksum: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    thumbnailPath: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'thumbnail_path'
    },
    metadata: {
      type: DataTypes.JSON,
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
    tableName: 'uploaded_files',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['order_id']
      },
      {
        fields: ['material_item_id']
      },
      {
        fields: ['upload_time']
      },
      {
        fields: ['uploader_id']
      },
      {
        fields: ['file_type']
      }
    ]
  }
)

// 定义关联
UploadedFile.belongsTo(Order, {
  foreignKey: 'orderId',
  as: 'order'
})

UploadedFile.belongsTo(MaterialItem, {
  foreignKey: 'materialItemId',
  as: 'materialItem'
})

UploadedFile.belongsTo(User, {
  foreignKey: 'uploaderId',
  as: 'uploader'
})

Order.hasMany(UploadedFile, {
  foreignKey: 'orderId',
  as: 'uploadedFiles'
})

MaterialItem.hasMany(UploadedFile, {
  foreignKey: 'materialItemId',
  as: 'uploadedFiles'
})

export { UploadedFile, UploadedFileAttributes, UploadedFileCreationAttributes }

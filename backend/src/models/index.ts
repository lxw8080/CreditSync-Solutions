// 导出所有模型
export { User, UserAttributes, UserCreationAttributes } from './User'
export { Order, OrderAttributes, OrderCreationAttributes } from './Order'
export { MaterialCategory, MaterialCategoryAttributes, MaterialCategoryCreationAttributes } from './MaterialCategory'
export { MaterialItem, MaterialItemAttributes, MaterialItemCreationAttributes } from './MaterialItem'
export { UploadedFile, UploadedFileAttributes, UploadedFileCreationAttributes } from './UploadedFile'
export { CollaborationLink, CollaborationLinkAttributes, CollaborationLinkCreationAttributes } from './CollaborationLink'

// 同步数据库
import { sequelize } from '../config/database'

export const syncDatabase = async (force: boolean = false): Promise<void> => {
  try {
    await sequelize.sync({ force })
    console.log('Database synchronized successfully')
  } catch (error) {
    console.error('Error synchronizing database:', error)
    throw error
  }
}

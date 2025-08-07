import { Sequelize } from 'sequelize'
import { logger } from '../utils/logger'

const sequelize = new Sequelize({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'materials_db',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  dialect: 'postgres',
  logging: (msg) => logger.debug(msg),
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
})

export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate()
    logger.info('Database connection established successfully')
  } catch (error) {
    logger.error('Unable to connect to the database:', error)
    throw error
  }
}

export { sequelize }
export default sequelize

// backend/models/index.js
import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    logging: false,
  }
);

// Import models
import ProductModel from "./product.js";
import CustomerModel from "./customer.js";
import OrderModel from "./order.js";
import TenantModel from "./tenant.js";

// Define models
export const Product = ProductModel(sequelize);
export const Customer = CustomerModel(sequelize);
export const Order = OrderModel(sequelize);
export const Tenant = TenantModel(sequelize);

// Relations
Tenant.hasMany(Product, { foreignKey: "tenant_id" });
Tenant.hasMany(Customer, { foreignKey: "tenant_id" });
Tenant.hasMany(Order, { foreignKey: "tenant_id" });

Product.belongsTo(Tenant, { foreignKey: "tenant_id" });
Customer.belongsTo(Tenant, { foreignKey: "tenant_id" });
Order.belongsTo(Tenant, { foreignKey: "tenant_id" });
Order.belongsTo(Customer, { foreignKey: "customer_id", targetKey: "customer_id" });

// Sync DB
sequelize.sync({ alter: true }).then(() => {
  console.log("✅ Sequelize models synced with DB");
});

export default sequelize;
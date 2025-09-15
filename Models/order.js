// backend/models/order.js
import { DataTypes } from "sequelize";

export default (sequelize) => {
  return sequelize.define("Order", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    tenant_id: { type: DataTypes.INTEGER, allowNull: false },
    order_id: { type: DataTypes.BIGINT, allowNull: false, unique: true },
    customer_id: { type: DataTypes.BIGINT, allowNull: true },
    total_price: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  });
};
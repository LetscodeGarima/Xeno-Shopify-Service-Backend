// backend/models/customer.js
import { DataTypes } from "sequelize";

export default (sequelize) => {
  return sequelize.define("Customer", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    tenant_id: { type: DataTypes.INTEGER, allowNull: false },
    customer_id: { type: DataTypes.BIGINT, allowNull: false, unique: true },
    first_name: { type: DataTypes.STRING },
    last_name: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING },
  });
};
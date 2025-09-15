// backend/models/product.js
import { DataTypes } from "sequelize";

export default (sequelize) => {
  return sequelize.define("Product", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    tenant_id: { type: DataTypes.INTEGER, allowNull: false },
    product_id: { type: DataTypes.BIGINT, allowNull: false, unique: true },
    title: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  });
};
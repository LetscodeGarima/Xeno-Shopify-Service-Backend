// backend/models/tenant.js
import { DataTypes } from "sequelize";

export default (sequelize) => {
  return sequelize.define("Tenant", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
  });
};
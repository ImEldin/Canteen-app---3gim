"use strict";
module.exports = (sequelize, DataTypes) => {
    const Tag = sequelize.define(
        "Tag",
        {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            name: { type: DataTypes.TEXT, allowNull: false, unique: true },
            dedscription: DataTypes.TEXT,
            created_at: DataTypes.DATE,
        },
        {
            tableName: "tags",
            timestamps: false
        }
    );

    Tag.associate = models => {
        Tag.belongsToMany(models.MenuItem, {
            through: models.MenuItemTag,
            foreignKey: "tag_id",
        });
    }

    return Tag;
};
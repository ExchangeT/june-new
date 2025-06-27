import * as Sequelize from "sequelize";
import { DataTypes, Model } from "sequelize";

export default class kycLevel
  extends Model<kycLevelAttributes, kycLevelCreationAttributes>
  implements kycLevelAttributes
{
  id!: string;
  serviceId?: string;
  name!: string;
  description?: string;
  level!: number;
  fields?: any;
  features?: any;
  status!: "ACTIVE" | "DRAFT" | "INACTIVE";
  createdAt?: Date;
  updatedAt?: Date;

  public static initModel(sequelize: Sequelize.Sequelize): typeof kycLevel {
    return kycLevel.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        serviceId: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        name: {
          type: DataTypes.STRING(191),
          allowNull: false,
          validate: {
            notEmpty: { msg: "name: Name cannot be empty" },
          },
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        level: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: {
            isInt: { msg: "level: Level must be an integer" },
          },
        },
        fields: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        features: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM("ACTIVE", "DRAFT", "INACTIVE"),
          allowNull: false,
          defaultValue: "ACTIVE",
          validate: {
            isIn: {
              args: [["ACTIVE", "DRAFT", "INACTIVE"]],
              msg: "status: Status must be either ACTIVE, DRAFT, or INACTIVE",
            },
          },
        },
      },
      {
        sequelize,
        modelName: "kycLevel",
        tableName: "kyc_level",
        timestamps: true,
        paranoid: true,
        indexes: [
          {
            name: "PRIMARY",
            unique: true,
            using: "BTREE",
            fields: [{ name: "id" }],
          },
        ],
      }
    );
  }

  public static associate(models: any) {
    // A level can have many applications.
    kycLevel.hasMany(models.kycApplication, {
      as: "applications",
      foreignKey: "levelId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    kycLevel.belongsTo(models.kycVerificationService, {
      as: "verificationService",
      foreignKey: "serviceId",
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });
  }
}

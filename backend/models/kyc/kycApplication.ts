import * as Sequelize from "sequelize";
import { DataTypes, Model } from "sequelize";
import { createUserCacheHooks } from "../init";

export default class kycApplication
  extends Model<kycApplicationAttributes, kycApplicationCreationAttributes>
  implements kycApplicationAttributes
{
  id!: string;
  userId!: string;
  levelId!: string;
  status!: "PENDING" | "APPROVED" | "REJECTED" | "ADDITIONAL_INFO_REQUIRED";
  data!: any;
  adminNotes?: string;
  reviewedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;

  public static initModel(
    sequelize: Sequelize.Sequelize
  ): typeof kycApplication {
    return kycApplication.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          validate: {
            notNull: { msg: "userId: User ID cannot be null" },
            isUUID: { args: 4, msg: "userId: Must be a valid UUID" },
          },
        },
        levelId: {
          type: DataTypes.UUID,
          allowNull: false,
          validate: {
            notNull: { msg: "levelId: Level ID cannot be null" },
            isUUID: { args: 4, msg: "levelId: Must be a valid UUID" },
          },
        },
        status: {
          type: DataTypes.ENUM(
            "PENDING",
            "APPROVED",
            "REJECTED",
            "ADDITIONAL_INFO_REQUIRED"
          ),
          allowNull: false,
          defaultValue: "PENDING",
          validate: {
            isIn: {
              args: [
                ["PENDING", "APPROVED", "REJECTED", "ADDITIONAL_INFO_REQUIRED"],
              ],
              msg: "status: Invalid status value",
            },
          },
        },
        data: {
          type: DataTypes.JSON,
          allowNull: false,
        },
        adminNotes: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        reviewedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: "kycApplication",
        tableName: "kyc_application",
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
        hooks: {
          ...createUserCacheHooks(),
        },
      }
    );
  }

  public static associate(models: any) {
    // An application belongs to a level
    kycApplication.belongsTo(models.kycLevel, {
      as: "level",
      foreignKey: "levelId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    // An application belongs to a user
    kycApplication.belongsTo(models.user, {
      as: "user",
      foreignKey: "userId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    // An application can have one verification result
    kycApplication.hasOne(models.kycVerificationResult, {
      as: "verificationResult",
      foreignKey: "applicationId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  }
}

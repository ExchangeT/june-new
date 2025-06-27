import * as Sequelize from "sequelize";
import { DataTypes, Model } from "sequelize";

export default class kycVerificationResult
  extends Model<
    kycVerificationResultAttributes,
    kycVerificationResultCreationAttributes
  >
  implements kycVerificationResultAttributes
{
  id!: string;
  applicationId!: string;
  serviceId!: string;
  status!: "VERIFIED" | "FAILED" | "PENDING" | "NOT_STARTED";
  score?: number;
  checks?: any;
  documentVerifications?: any;
  createdAt?: Date;
  updatedAt?: Date;

  public static initModel(
    sequelize: Sequelize.Sequelize
  ): typeof kycVerificationResult {
    return kycVerificationResult.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        applicationId: {
          type: DataTypes.UUID,
          allowNull: false,
          validate: {
            notNull: { msg: "applicationId: Application ID cannot be null" },
            isUUID: { args: 4, msg: "applicationId: Must be a valid UUID" },
          },
        },
        serviceId: {
          type: DataTypes.STRING(191),
          allowNull: false,
          validate: {
            notEmpty: { msg: "serviceId: Service ID cannot be empty" },
          },
        },
        status: {
          type: DataTypes.ENUM("VERIFIED", "FAILED", "PENDING", "NOT_STARTED"),
          allowNull: false,
          validate: {
            isIn: {
              args: [["VERIFIED", "FAILED", "PENDING", "NOT_STARTED"]],
              msg: "status: Invalid status value",
            },
          },
        },
        score: {
          type: DataTypes.DOUBLE,
          allowNull: true,
          validate: {
            isFloat: { msg: "score: Must be a valid number" },
            min: { args: [0], msg: "score: Cannot be negative" },
          },
        },
        checks: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        documentVerifications: {
          type: DataTypes.JSON,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: "kycVerificationResult",
        tableName: "kyc_verification_result",
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
    // A verification result belongs to a KYC application.
    kycVerificationResult.belongsTo(models.kycApplication, {
      as: "application",
      foreignKey: "applicationId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    // A verification result belongs to a verification service.
    kycVerificationResult.belongsTo(models.kycVerificationService, {
      as: "service",
      foreignKey: "serviceId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  }
}

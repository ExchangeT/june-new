import * as Sequelize from "sequelize";
import { DataTypes, Model } from "sequelize";

export default class supportTicket extends Model<any, any> {
  id!: string;
  userId!: string;
  agentId?: string | null;
  agentName?: string | null;
  subject!: string;
  importance!: "LOW" | "MEDIUM" | "HIGH";
  status!: "PENDING" | "OPEN" | "REPLIED" | "CLOSED";
  messages?: SupportMessage[] | null;
  type?: "LIVE" | "TICKET";
  tags?: string[] | null;
  responseTime?: number | null;
  satisfaction?: number | null;
  createdAt?: Date;
  deletedAt?: Date;
  updatedAt?: Date;

  public static initModel(
    sequelize: Sequelize.Sequelize
  ): typeof supportTicket {
    return supportTicket.init(
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
        },
        agentId: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        agentName: {
          type: DataTypes.STRING(191),
          allowNull: true,
          comment: "Agent display name for faster lookup",
        },
        subject: {
          type: DataTypes.STRING(191),
          allowNull: false,
        },
        importance: {
          type: DataTypes.ENUM("LOW", "MEDIUM", "HIGH"),
          allowNull: false,
          defaultValue: "LOW",
        },
        messages: {
          type: DataTypes.JSON,
          allowNull: true,
          get() {
            const value = this.getDataValue("messages");
            if (!value) return [];
            
            // If it's already an array, return it
            if (Array.isArray(value)) return value;
            
            // If it's a string, try to parse it
            if (typeof value === 'string') {
              try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [];
              } catch (e) {
                console.error('Failed to parse messages JSON in getter:', e);
                return [];
              }
            }
            
            return [];
          },
          set(val) {
            if (
              Array.isArray(val) &&
              val.every(
                (item) =>
                  typeof item === "object" &&
                  typeof item.type === "string" &&
                  typeof item.text === "string" &&
                  item.time
              )
            ) {
              this.setDataValue("messages", val);
            } else if (val === null || val === undefined) {
              this.setDataValue("messages", val);
            } else {
              throw new Error(
                "messages must be an array of message objects or null/undefined"
              );
            }
          },
        },
        status: {
          type: DataTypes.ENUM("PENDING", "OPEN", "REPLIED", "CLOSED"),
          allowNull: false,
          defaultValue: "PENDING",
        },
        type: {
          type: DataTypes.ENUM("LIVE", "TICKET"),
          allowNull: false,
          defaultValue: "TICKET",
        },
        tags: {
          type: DataTypes.JSON,
          allowNull: true,
          comment: "Tags for search/filter (string array)",
          get() {
            const value = this.getDataValue("tags");
            if (!value) return [];
            
            // If it's already an array, return it
            if (Array.isArray(value)) return value;
            
            // If it's a string, try to parse it
            if (typeof value === 'string') {
              try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [];
              } catch (e) {
                console.error('Failed to parse tags JSON in getter:', e);
                return [];
              }
            }
            
            return [];
          },
          set(val) {
            if (
              Array.isArray(val) &&
              val.every((item) => typeof item === "string")
            ) {
              this.setDataValue("tags", val);
            } else if (val === null || val === undefined) {
              this.setDataValue("tags", val);
            } else {
              throw new Error(
                "tags must be an array of strings or null/undefined"
              );
            }
          },
        },
        responseTime: {
          type: DataTypes.INTEGER,
          allowNull: true,
          comment: "Minutes from creation to first agent reply",
        },
        satisfaction: {
          type: DataTypes.FLOAT,
          allowNull: true,
          comment: "Rating 1-5 from user",
        },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
        deletedAt: DataTypes.DATE,
      },
      {
        sequelize,
        modelName: "supportTicket",
        tableName: "support_ticket",
        timestamps: true,
        paranoid: true,
        indexes: [
          {
            name: "PRIMARY",
            unique: true,
            using: "BTREE",
            fields: [{ name: "id" }],
          },
          { name: "agentId", using: "BTREE", fields: [{ name: "agentId" }] },
          {
            name: "supportTicketUserIdForeign",
            using: "BTREE",
            fields: [{ name: "userId" }],
          },
          { name: "tags_idx", using: "BTREE", fields: [{ name: "tags" }] },
        ],
      }
    );
  }

  public static associate(models: any) {
    supportTicket.belongsTo(models.user, {
      as: "user",
      foreignKey: "userId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    supportTicket.belongsTo(models.user, {
      as: "agent",
      foreignKey: "agentId",
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });
  }
}

import * as Sequelize from "sequelize";
import { DataTypes, Model } from "sequelize";

export default class page
  extends Model<pageAttributes, pageCreationAttributes>
  implements pageAttributes
{
  id!: string;
  slug!: string;
  path!: string;
  title!: string;
  content!: string;
  description?: string;
  image?: string;
  status!: "PUBLISHED" | "DRAFT";
  visits!: number;
  order!: number;

  // Builder-specific fields
  isHome!: boolean;
  isBuilderPage!: boolean;
  template?: string;
  category?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;

  // Page settings
  settings?: string; // JSON string for page-level settings
  customCss?: string;
  customJs?: string;

  // Analytics and performance
  lastModifiedBy?: string;
  publishedAt?: Date;

  createdAt?: Date;
  deletedAt?: Date;
  updatedAt?: Date;

  public static initModel(sequelize: Sequelize.Sequelize): typeof page {
    return page.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        slug: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: "pageSlugKey",
          validate: {
            notEmpty: { msg: "slug: Slug cannot be empty" },
            isSlugFormat: (value: string) => {
              if (!/^[a-z0-9-_/]+$/.test(value)) {
                throw new Error(
                  "slug: Slug must contain only lowercase letters, numbers, hyphens, underscores, and forward slashes"
                );
              }
            },
          },
        },
        path: {
          type: DataTypes.STRING(255),
          allowNull: false,
          defaultValue: "",
        },
        title: {
          type: DataTypes.STRING(255),
          allowNull: false,
          validate: {
            notEmpty: { msg: "title: Title cannot be empty" },
            len: {
              args: [1, 255],
              msg: "title: Title must be between 1 and 255 characters",
            },
          },
        },
        content: {
          type: DataTypes.TEXT("long"),
          allowNull: false,
          defaultValue: "", // Allow empty content for new pages
          validate: {
            isValidContent: function (value: string) {
              // For builder pages, content can be empty initially
              if (this.isBuilderPage && !value) {
                return; // Allow empty content for builder pages
              }
              // For non-builder pages, require content
              if (!this.isBuilderPage && !value) {
                throw new Error(
                  "content: Content cannot be empty for non-builder pages"
                );
              }
            },
          },
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        image: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        order: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        visits: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        status: {
          type: DataTypes.ENUM("PUBLISHED", "DRAFT"),
          allowNull: false,
          defaultValue: "DRAFT",
          validate: {
            isIn: {
              args: [["PUBLISHED", "DRAFT"]],
              msg: "status: Status must be either PUBLISHED or DRAFT",
            },
          },
        },

        // Builder-specific fields
        isHome: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          validate: {
            isUniqueHome: async function (value: boolean) {
              if (value === true) {
                // If this page is already in the DB and already home, allow update
                if (this.id) {
                  // Find THIS page
                  const existing = await page.findOne({
                    where: { id: this.id },
                  });
                  if (existing && existing.isHome === true) {
                    // Allow update, no further check needed
                    return;
                  }
                }
                // Else: check for other home page
                const where: any = { isHome: true };
                if (this.id) {
                  where.id = { [Sequelize.Op.ne]: this.id };
                }
                if (this.constructor.options.paranoid) {
                  where.deletedAt = null;
                }
                const existingHomePage = await page.findOne({ where });
                if (existingHomePage) {
                  throw new Error(
                    "isHome: Only one page can be marked as home page"
                  );
                }
              }
            },
          },
        },
        isBuilderPage: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        template: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        category: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },

        // SEO fields
        seoTitle: {
          type: DataTypes.STRING(255),
          allowNull: true,
          validate: {
            len: {
              args: [0, 255],
              msg: "seoTitle: SEO title must be less than 255 characters",
            },
          },
        },
        seoDescription: {
          type: DataTypes.TEXT,
          allowNull: true,
          validate: {
            len: {
              args: [0, 500],
              msg: "seoDescription: SEO description must be less than 500 characters",
            },
          },
        },
        seoKeywords: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        ogImage: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        ogTitle: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        ogDescription: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        // Page settings
        settings: {
          type: DataTypes.TEXT("long"),
          allowNull: true,
          validate: {
            isValidJSON: (value: string) => {
              if (value) {
                try {
                  JSON.parse(value);
                } catch (error) {
                  throw new Error("settings: Settings must be valid JSON");
                }
              }
            },
          },
        },
        customCss: {
          type: DataTypes.TEXT("long"),
          allowNull: true,
        },
        customJs: {
          type: DataTypes.TEXT("long"),
          allowNull: true,
        },

        // Analytics and performance
        lastModifiedBy: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        publishedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: "page",
        tableName: "page",
        timestamps: true,
        paranoid: true,
        hooks: {
          beforeSave: async (instance: page) => {
            // Auto-generate path from slug if not provided
            if (!instance.path && instance.slug) {
              instance.path =
                instance.slug === "home" ? "/" : `/${instance.slug}`;
            }

            // Set publishedAt when status changes to PUBLISHED
            if (instance.status === "PUBLISHED" && !instance.publishedAt) {
              instance.publishedAt = new Date();
            }

            // Auto-generate SEO fields if not provided
            if (!instance.seoTitle && instance.title) {
              instance.seoTitle = instance.title;
            }
            if (!instance.seoDescription && instance.description) {
              instance.seoDescription = instance.description;
            }
          },
        },
        indexes: [
          {
            name: "PRIMARY",
            unique: true,
            using: "BTREE",
            fields: [{ name: "id" }],
          },
          {
            name: "pageSlugKey",
            unique: true,
            using: "BTREE",
            fields: [{ name: "slug" }],
          },
          {
            name: "pageStatusIndex",
            using: "BTREE",
            fields: [{ name: "status" }],
          },
          {
            name: "pageIsHomeIndex",
            using: "BTREE",
            fields: [{ name: "isHome" }],
          },
          {
            name: "pageIsBuilderIndex",
            using: "BTREE",
            fields: [{ name: "isBuilderPage" }],
          },
          {
            name: "pageOrderIndex",
            using: "BTREE",
            fields: [{ name: "order" }],
          },
          {
            name: "pagePublishedAtIndex",
            using: "BTREE",
            fields: [{ name: "publishedAt" }],
          },
        ],
      }
    );
  }
}

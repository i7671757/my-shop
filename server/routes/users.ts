import { Elysia, t } from "elysia";
import { db } from "@/app/src/db";
import { users } from "@/app/src/db/schema";
import { eq } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "@/server/middlewars/auth";
import bcrypt from "bcryptjs";

export default new Elysia({ prefix: "/users" })
  .use(authMiddleware)
  .get(
    "/profile",
    async (context) => {
      const { user, set } = context as any;
      try {
        const [userProfile] = await db
          .select({
            id: users.id,
            email: users.email,
            role: users.role,
            createdAt: users.createdAt,
          })
          .from(users)
          .where(eq(users.id, user.userId));

        if (!userProfile) {
          set.status = 404;
          return { error: "User not found" };
        }

        return {
          success: true,
          data: userProfile,
        };
      } catch (error) {
        set.status = 500;
        return { error: "Failed to fetch profile" };
      }
    },
    {
      detail: {
        tags: ["users"],
        summary: "Get user profile",
        description: "Get current user profile information",
      },
    }
  )

  .put(
    "/profile",
    async (context) => {
      const { user, body, set } = context as any;
      try {
        const updateDate: any = {};

        if (body.email) {
          updateDate.email = body.email;
        }

        if (body.password) {
          updateDate.passwordHash = await bcrypt.hash(body.password, 12);
        }

        const [updatedUser] = await db
          .update(users)
          .set(updateDate)
          .where(eq(users.id, user.userId))
          .returning({
            id: users.id,
            email: users.email,
            role: users.role,
            createdAt: users.createdAt,
          });

        if (!updatedUser) {
          set.status = 404;
          return { error: "User not found" };
        }

        return {
          success: true,
          data: updatedUser,
        };
      } catch (error) {
        set.status = 500;
        return { error: "Failed to update profile" };
      }
    },
    {
      body: t.Object({
        email: t.Optional(t.String({ format: "email" })),
        password: t.Optional(t.String({ minLength: 6 })),
      }),
      detail: {
        tags: ["Users"],
        summary: "Update user profile",
        description: "Update current user profile information",
      },
    }
  )
  .use(adminMiddleware)
  .get(
    "/",
    async ({ query }) => {
      try {
        const { page = "1", limit = "10" } = query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const usersList = await db
          .select({
            id: users.id,
            email: users.email,
            role: users.role,
            createdAt: users.createdAt,
          })
          .from(users)
          .limit(parseInt(limit))
          .offset(offset);

        return {
          success: true,
          data: usersList,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
          },
        };
      } catch (error) {
        return { error: "Failed to fetch users" };
      }
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Users"],
        summary: "Get all users",
        description: "Get list of all users (admin only)",
      },
    }
  )

  .put(
    "/:id/role",
    async ({ params: { id }, body, set }) => {
      try {
        const [updatedUser] = await db
          .update(users)
          .set({ role: body.role })
          .where(eq(users.id, id))
          .returning({
            id: users.id,
            email: users.email,
            role: users.role,
            createdAt: users.createdAt,
          });

        if (!updatedUser) {
          set.status = 404;
          return { error: "User not found" };
        }

        return {
          success: true,
          data: updatedUser,
        };
      } catch (error) {
        set.status = 500;
        return { error: "Failed to update user role" };
      }
    },
    {
      params: t.Object({
        id: t.String({ description: "User ID" }),
      }),
      body: t.Object({
        role: t.String({ description: "New user role" }),
      }),
      detail: {
        tags: ["Users"],
        summary: "Update user role",
        description: "Update user role (admin only)",
      },
    }
  );

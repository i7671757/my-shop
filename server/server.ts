import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { jwt } from "@elysiajs/jwt";

// Простая реализация эндпоинта регистрации для теста
import bcrypt from "bcryptjs";
import { db } from "@/app/src/db";
import { users } from "@/app/src/db/schema";
import { eq } from "drizzle-orm";

const app = new Elysia()
  .use(
    cors({
      origin: ["http://localhost:3000", "http://localhost:3002"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  )
  .use(
    swagger({
      documentation: {
        info: {
          title: "My Shop API",
          version: "1.0.0",
          description: "E-commerce API built with Elysia.js",
        },
      },
    })
  )
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "your-secret-key",
    })
  )
  .get("/", () => ({ message: "My Shop API is running!" }))

  // Auth endpoints
  .post("/auth/register", async ({ body, jwt, set }) => {
    try {
      const { email, password } = body as { email: string; password: string };

      // Check if user exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (existingUser.length > 0) {
        set.status = 400;
        return { error: "User with this email already exists" };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          passwordHash,
          role: "customer",
        })
        .returning({
          id: users.id,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
        });

      // Generate token
      const token = await jwt.sign({
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
      });

      return {
        success: true,
        token,
        user: newUser,
      };
    } catch (error) {
      console.error("Registration error:", error);
      set.status = 500;
      return { error: "Registration failed" };
    }
  })

  .post("/auth/login", async ({ body, jwt, set }) => {
    try {
      const { email, password } = body as { email: string; password: string };

      // Find user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (!user) {
        set.status = 401;
        return { error: "Invalid credentials" };
      }

      // Verify password
      const passwordValid = await bcrypt.compare(password, user.passwordHash);
      if (!passwordValid) {
        set.status = 401;
        return { error: "Invalid credentials" };
      }

      // Generate token
      const token = await jwt.sign({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error) {
      console.error("Login error:", error);
      set.status = 500;
      return { error: "Login failed" };
    }
  })

  // Products endpoints
  .get("/products", async () => {
    try {
      const products = await db.select().from(products);
      return products;
    } catch (error) {
      return [];
    }
  })

  .onError(({ code, error, set }) => {
    console.error("API Error:", error);

    switch (code) {
      case "VALIDATION":
        set.status = 400;
        return { error: "Validation failed", details: error.message };
      case "NOT_FOUND":
        set.status = 404;
        return { error: "Route not found" };
      default:
        set.status = 500;
        return { error: "Internal server error" };
    }
  })
  .listen(3001);

console.log("🚀 Server running on http://localhost:3001");
console.log("📖 Swagger docs on http://localhost:3001/swagger");

export type App = typeof app;
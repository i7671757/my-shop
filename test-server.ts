import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";

const app = new Elysia()
  .use(
    cors({
      origin: "*",
    })
  )
  .get("/", () => ({ message: "Test server is running!" }))
  .post("/auth/register", ({ body }) => {
    console.log("Register request received:", body);
    return {
      success: true,
      message: "Register endpoint works!",
      received: body
    };
  })
  .listen(3001);

console.log("🚀 Test server running on http://localhost:3001");
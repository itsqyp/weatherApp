import Fastify from "fastify";
import cors from "@fastify/cors";
const app = Fastify({
  logger: true,
});

await app.register(cors, {
  origin: "http://localhost:5173",
});

app.get("/api/health", async () => {
  return {
    status: "ok",
    message: "Weather App API is running",
  };
});

app.post("/api/auth/register", async (request, reply) => {
  const body = request.body as {
    username?: string;
    password?: string;
    confirmPassword?: string;
  };

  const { username, password, confirmPassword } = body;

  if (!username || !password || !confirmPassword) {
    return reply.status(400).send({
      message: "All fields are required.",
    });
  }

  if (password !== confirmPassword) {
    return reply.status(400).send({
      message: "Passwords do not match.",
    });
  }

  return reply.status(201).send({
    message: "Account data received successfully.",
    user: {
      username,
    },
  });
});

app.listen({
  port: 3000,
  host: "localhost",
});

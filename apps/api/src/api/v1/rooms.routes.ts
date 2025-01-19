import { Hono } from "hono";
import { roomSchema } from "./schemas/room.schemas";
import { createDb } from "../../db/index";
import { describeRoute } from "hono-openapi";
import { validator as zValidator } from "hono-openapi/zod";
import { eq } from "drizzle-orm";
import { rooms } from "../../../drizzle/schema";

const app = new Hono<{ Bindings: CloudflareEnv }>();

app
  .get(
    "/:roomCode",
    describeRoute({
      tags: ["Rooms"],
      summary: "Get room details",
      description: "Get room details by room code",
    }),
    zValidator("param", roomSchema),
    async (c) => {
      const {roomCode} = c.req.valid("param");

      const db = await createDb(c);
      const { maxPlayers } = (await db.query.rooms.findFirst({
        where: (rooms) => eq(rooms.code, roomCode),
      }))!;

      return c.json({maxPlayers: maxPlayers});
    }
  )
  .get("/:roomCode/details",
    describeRoute({
      tags: ["Rooms"],
      summary: "Get room details",
      description: "Get room details by room code",
    }),
    zValidator("param", roomSchema),
    async (c) => {
      const {roomCode} = c.req.valid("param");

      const db = await createDb(c);
      const room = await db.query.rooms.findFirst({
        where: eq(rooms.code, roomCode),
      });

      return c.json(room);
    }
);

export default app;

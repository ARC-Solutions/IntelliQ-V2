import { Hono } from "hono";
import { roomDetailsResponseSchema, roomResponseSchema, roomSchema } from "./schemas/room.schemas";
import { createDb } from "../../db/index";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { eq } from "drizzle-orm";
import { rooms } from "../../../drizzle/schema";
import { z } from "zod";

const app = new Hono<{ Bindings: CloudflareEnv }>()
  .get(
    "/:roomCode",
    describeRoute({
      tags: ["Rooms"],
      summary: "Get room details",
      description: "Get room details by room code",
      validateResponse: true,
      responses: {
        200: {
          description: "Room details",
          content: {
            "application/json": {
              schema: resolver(roomResponseSchema),
            },
          },
        },
        400: {
          description: "Bad Request",
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
        },
      },
    }),
    zValidator("param", roomSchema),
    async (c) => {
      const { roomCode } = c.req.valid("param");

      const db = await createDb(c);
      const { maxPlayers } = (await db.query.rooms.findFirst({
        where: (rooms) => eq(rooms.code, roomCode),
      }))!;

      return c.json({ max_players: maxPlayers });
    }
  )
  .get(
    "/:roomCode/details",
    describeRoute({
      tags: ["Rooms"],
      summary: "Get room details",
      description: "Get room details by room code",
      validateResponse: true,
      responses: {
        200: {
          description: "Room details",
          content: {
            "application/json": {
              schema: resolver(roomDetailsResponseSchema),
            },
          },
        },
      },
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

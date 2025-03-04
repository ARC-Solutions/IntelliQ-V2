import { Hono } from "hono";
import {
  roomDetailsResponseSchema,
  roomResponseSchema,
  roomSchema,
  updateRoomSettingsSchema,
  roomSettingsResponseSchema,
  createRoomSchema,
  createRoomResponseSchema,
} from "./schemas/room.schemas";
import { createDb } from "../../db/index";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { eq } from "drizzle-orm";
import { rooms } from "../../../drizzle/schema";
import { z } from "zod";
import { HTTPException } from "hono/http-exception";

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
        where: eq(rooms.code, roomCode),
      }))!;

      return c.json({ maxPlayers: maxPlayers });
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
      const { roomCode } = c.req.valid("param");

      const db = await createDb(c);
      const room = await db.query.rooms.findFirst({
        where: eq(rooms.code, roomCode),
      });

      return c.json(room);
    }
  )
  .patch(
    "/:roomCode/settings",
    describeRoute({
      tags: ["Rooms"],
      summary: "Update room settings",
      description: "Update room settings by room code",
      validateResponse: true,
      responses: {
        200: {
          description: "Room settings updated",
          content: {
            "application/json": {
              schema: resolver(roomSettingsResponseSchema),
            },
          },
        },
        400: {
          description: "Bad Request",
          content: {
            "application/json": {
              schema: z.object({ error: z.string() }),
            },
          },
        },
      },
    }),
    zValidator("param", roomSchema),
    zValidator("json", updateRoomSettingsSchema),
    async (c) => {
      const { roomCode } = c.req.valid("param");
      const { type, value } = c.req.valid("json");

      const db = await createDb(c);
      const updatedSettings = await db
        .update(rooms)
        .set({ [type]: value })
        .where(eq(rooms.code, roomCode))
        .returning({
          code: rooms.code,
          id: rooms.id,
          hostId: rooms.hostId,
          maxPlayers: rooms.maxPlayers,
          numQuestions: rooms.numQuestions,
          timeLimit: rooms.timeLimit,
          createdAt: rooms.createdAt,
          endedAt: rooms.endedAt,
        });

      if (!updatedSettings[0]) {
        throw new HTTPException(400, {
          message: "Failed to update room settings",
        });
      }

      return c.json(updatedSettings[0]);
    }
  )
  .post(
    "/",
    describeRoute({
      tags: ["Rooms"],
      summary: "Create a room",
      description: "Create a room",
      validateResponse: true,
      responses: {
        200: {
          description: "Room created",
          content: {
            "application/json": {
              schema: resolver(createRoomResponseSchema),
            },
          },
        },
        400: {
          description: "Bad Request",
          content: {
            "application/json": {
              schema: z.object({ error: z.string() }),
            },
          },
        },
      },
    }),
    zValidator("json", createRoomSchema),
    async (c) => {
      const { code, hostId, maxPlayers, numQuestions, timeLimit, language } =
        c.req.valid("json");

      const db = await createDb(c);
      const newRoom = await db
        .insert(rooms)
        .values({
          code,
          hostId,
          maxPlayers,
          numQuestions,
          timeLimit,
          language,
        })
        .returning({
          id: rooms.id,
          code: rooms.code,
          host_id: rooms.hostId,
          max_players: rooms.maxPlayers,
          num_questions: rooms.numQuestions,
          time_limit: rooms.timeLimit,
          created_at: rooms.createdAt,
        });

      return c.json(newRoom[0], 201);
    }
  );

export default app;

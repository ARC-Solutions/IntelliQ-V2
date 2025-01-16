import { Hono } from 'hono'
import { rooms as roomsTable } from '@drizzle/schema'
import { eq } from 'drizzle-orm'
import { roomSchema, roomResponseSchema, roomDetailsResponseSchema } from '../schemas'
import { z } from 'zod'
import db from '../../../db'

const rooms = new Hono()
  .get('/:roomCode', async (c) => {
    try {
      const validatedParams = roomSchema.parse({ 
        roomCode: c.req.param('roomCode') 
      })

      const room = await db
        .select({ max_players: roomsTable.maxPlayers })
        .from(roomsTable)
        .where(eq(roomsTable.code, validatedParams.roomCode))
        .limit(1)

      if (!room[0]) {
        return c.json({ error: 'Room not found' }, 404)
      }

      const validatedResponse = roomResponseSchema.parse(room[0])
      return c.json(validatedResponse)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          { error: 'Validation error', details: error.flatten().fieldErrors },
          400
        )
      }
      throw error
    }
  })
  .get('/:roomCode/details', async (c) => {
    try {
      const validatedParams = roomSchema.parse({ 
        roomCode: c.req.param('roomCode') 
      })

      const room = await db
        .select({
          id: roomsTable.id,
          quiz_id: roomsTable.quizId,
          host_id: roomsTable.hostId,
          max_players: roomsTable.maxPlayers,
          num_questions: roomsTable.numQuestions,
          code: roomsTable.code,
          created_at: roomsTable.createdAt,
          ended_at: roomsTable.endedAt,
        })
        .from(roomsTable)
        .where(eq(roomsTable.code, validatedParams.roomCode))
        .limit(1)

      if (!room[0]) {
        return c.json({ error: 'Room not found' }, 404)
      }

      const validatedResponse = roomDetailsResponseSchema.parse(room[0])
      return c.json(validatedResponse)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          { error: 'Validation error', details: error.flatten().fieldErrors },
          400
        )
      }
      throw error
    }
  })

export { rooms }
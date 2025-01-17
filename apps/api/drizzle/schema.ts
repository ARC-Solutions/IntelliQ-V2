import { pgTable, foreignKey, pgPolicy, uuid, text, boolean, timestamp, integer, real, bigint, jsonb, vector, unique, smallint, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const quizType = pgEnum("quiz_type", ['singleplayer', 'multiplayer', 'document', 'random'])


export const userResponses = pgTable("user_responses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	quizId: uuid("quiz_id").notNull(),
	questionId: uuid("question_id").notNull(),
	roomId: uuid("room_id").notNull(),
	answer: text().notNull(),
	isCorrect: boolean("is_correct").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.questionId],
			foreignColumns: [questions.id],
			name: "user_responses_question_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.quizId],
			foreignColumns: [quizzes.id],
			name: "user_responses_quiz_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.roomId],
			foreignColumns: [rooms.id],
			name: "user_responses_room_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_responses_user_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	pgPolicy("Users can insert their own responses", { as: "permissive", for: "insert", to: ["authenticated"], withCheck: sql`(( SELECT auth.uid() AS uid) = user_id)`  }),
	pgPolicy("Users can view their own responses", { as: "permissive", for: "select", to: ["authenticated"] }),
]);

export const userUsageData = pgTable("user_usage_data", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	promptTokens: integer("prompt_tokens").notNull(),
	completionTokens: integer("completion_tokens").notNull(),
	totalTokens: integer("total_tokens").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	usedModel: text("used_model").notNull(),
	countQuestions: integer("count_Questions").notNull(),
	responseTimeTaken: real("response_time_taken").notNull(),
	prompt: text().notNull(),
	language: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_usage_data_user_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const users = pgTable("users", {
	id: uuid().default(sql`auth.uid()`).primaryKey().notNull(),
	email: text().notNull(),
	name: text().notNull(),
	avatarUrl: text("avatar_url"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	pgPolicy("Users can update own profile", { as: "permissive", for: "update", to: ["authenticated"], using: sql`(( SELECT auth.uid() AS uid) = id)` }),
]);

export const documents = pgTable("documents", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "documents_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	userId: uuid("user_id").notNull(),
	fileUrl: text("file_url").notNull(),
	content: text().notNull(),
	metadata: jsonb().notNull(),
	embedding: vector({ dimensions: 1536 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "documents_user_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	pgPolicy("Users can insert their own documents", { as: "permissive", for: "insert", to: ["authenticated"], withCheck: sql`(( SELECT auth.uid() AS uid) = user_id)`  }),
	pgPolicy("Users can view their own documents", { as: "permissive", for: "select", to: ["authenticated"] }),
]);

export const questions = pgTable("questions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	quizId: uuid("quiz_id").notNull(),
	text: text().notNull(),
	options: text().array().notNull(),
	correctAnswer: text("correct_answer").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.quizId],
			foreignColumns: [quizzes.id],
			name: "questions_quiz_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	pgPolicy("Anyone can view questions", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("Quiz owners can manage questions", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const bookmarks = pgTable("bookmarks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	quizId: uuid("quiz_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.quizId],
			foreignColumns: [quizzes.id],
			name: "bookmarks_quiz_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "bookmarks_user_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	unique("bookmarks_user_id_key").on(table.userId),
	unique("bookmarks_quiz_id_key").on(table.quizId),
	pgPolicy("Users can delete their own bookmarks", { as: "permissive", for: "delete", to: ["authenticated"], using: sql`(( SELECT auth.uid() AS uid) = user_id)` }),
	pgPolicy("Users can manage their own bookmarks", { as: "permissive", for: "insert", to: ["authenticated"] }),
	pgPolicy("Users can view their own bookmarks", { as: "permissive", for: "select", to: ["authenticated"] }),
]);

export const quizzes = pgTable("quizzes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	title: text().notNull(),
	description: text().notNull(),
	topic: text().notNull(),
	tags: text().array().notNull(),
	passingScore: smallint("passing_score").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	documentId: bigint("document_id", { mode: "number" }),
	type: quizType().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "quizzes_user_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	pgPolicy("Users can create quizzes", { as: "permissive", for: "insert", to: ["authenticated"], withCheck: sql`(( SELECT auth.uid() AS uid) = user_id)`  }),
	pgPolicy("Users can delete their own quizzes", { as: "permissive", for: "delete", to: ["authenticated"] }),
	pgPolicy("Users can update their own quizzes", { as: "permissive", for: "update", to: ["authenticated"] }),
]);

export const rooms = pgTable("rooms", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	quizId: uuid("quiz_id"),
	hostId: uuid("host_id").notNull(),
	maxPlayers: smallint("max_players").default(sql`'4'`).notNull(),
	numQuestions: smallint("num_questions").notNull(),
	code: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	endedAt: timestamp("ended_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.hostId],
			foreignColumns: [users.id],
			name: "rooms_host_id_fkey"
		}),
	foreignKey({
			columns: [table.quizId],
			foreignColumns: [quizzes.id],
			name: "rooms_quiz_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	unique("rooms_code_key").on(table.code),
	pgPolicy("Anyone can view rooms", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("Room hosts can update rooms", { as: "permissive", for: "update", to: ["authenticated"] }),
	pgPolicy("Users can create rooms", { as: "permissive", for: "insert", to: ["authenticated"] }),
]);

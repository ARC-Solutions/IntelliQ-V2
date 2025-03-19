import { pgTable, foreignKey, unique, uuid, smallint, timestamp, pgPolicy, text, boolean, integer, real, bigint, jsonb, vector, index, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const quizType = pgEnum("quiz_type", ['singleplayer', 'multiplayer', 'document', 'random'])


export const multiplayerQuizSubmissions = pgTable("multiplayer_quiz_submissions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	quizId: uuid("quiz_id").notNull(),
	roomId: uuid("room_id").notNull(),
	userScore: smallint("user_score").notNull(),
	correctAnswersCount: smallint("correct_answers_count").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.quizId],
			foreignColumns: [quizzes.id],
			name: "multiplayer_quiz_submissions_quiz_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.roomId],
			foreignColumns: [rooms.id],
			name: "multiplayer_quiz_submissions_room_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "multiplayer_quiz_submissions_user_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	unique("unique_user_quiz_room").on(table.userId, table.quizId, table.roomId),
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

export const userResponses = pgTable("user_responses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	quizId: uuid("quiz_id").notNull(),
	questionId: uuid("question_id").notNull(),
	roomId: uuid("room_id"),
	answer: text().notNull(),
	isCorrect: boolean("is_correct").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	timeTaken: integer("time_taken"),
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
	pgPolicy("Users can view their own responses", { as: "permissive", for: "select", to: ["authenticated"], using: sql`(( SELECT auth.uid() AS uid) = user_id)` }),
	pgPolicy("Users can insert their own responses", { as: "permissive", for: "insert", to: ["authenticated"] }),
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
	quizType: quizType("quiz_type").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_usage_data_user_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
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
	fileName: text("file_name").notNull(),
	fileType: text("file_type").notNull(),
	fileSize: smallint("file_size").notNull(),
	pageCount: smallint("page_count").notNull(),
	processingStatus: text("processing_status").default('pending').notNull(),
	lastAccessed: timestamp("last_accessed", { withTimezone: true, mode: 'string' }).notNull(),
	quizCount: smallint("quiz_count").notNull(),
	documentId: uuid("document_id").defaultRandom().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "documents_user_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	pgPolicy("Users can view their own documents", { as: "permissive", for: "select", to: ["authenticated"], using: sql`(( SELECT auth.uid() AS uid) = user_id)` }),
	pgPolicy("Users can insert their own documents", { as: "permissive", for: "insert", to: ["authenticated"] }),
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
	pgPolicy("Users can view their own bookmarks", { as: "permissive", for: "select", to: ["authenticated"], using: sql`(( SELECT auth.uid() AS uid) = user_id)` }),
	pgPolicy("Users can manage their own bookmarks", { as: "permissive", for: "insert", to: ["authenticated"] }),
	pgPolicy("Users can delete their own bookmarks", { as: "permissive", for: "delete", to: ["authenticated"] }),
]);

export const quizzes = pgTable("quizzes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	title: text().notNull(),
	description: text(),
	topic: text().array(),
	tags: text().array(),
	passingScore: smallint("passing_score"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	documentId: bigint("document_id", { mode: "number" }),
	type: quizType().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	language: text().notNull(),
	userScore: smallint("user_score"),
	correctAnswersCount: smallint("correct_answers_count"),
	questionsCount: smallint("questions_count").notNull(),
	roomId: uuid("room_id"),
	totalTimeTaken: smallint("total_time_taken"),
	passed: boolean(),
	generatedTags: text("generated_tags").array(),
	generatedCategories: text("generated_categories").array(),
	embedding: vector({ dimensions: 1536 }),
}, (table) => [
	index("quiz_embedding_idx").using("hnsw", table.embedding.asc().nullsLast().op("vector_ip_ops")),
	foreignKey({
			columns: [table.documentId],
			foreignColumns: [documents.id],
			name: "quizzes_document_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.roomId],
			foreignColumns: [rooms.id],
			name: "quizzes_room_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "quizzes_user_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	pgPolicy("Users can create quizzes", { as: "permissive", for: "insert", to: ["authenticated"], withCheck: sql`(( SELECT auth.uid() AS uid) = user_id)`  }),
	pgPolicy("Users can update their own quizzes", { as: "permissive", for: "update", to: ["authenticated"] }),
	pgPolicy("Users can delete their own quizzes", { as: "permissive", for: "delete", to: ["authenticated"] }),
]);

export const rooms = pgTable("rooms", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	hostId: uuid("host_id").notNull(),
	maxPlayers: smallint("max_players").default(sql`'4'`).notNull(),
	numQuestions: smallint("num_questions").notNull(),
	code: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	endedAt: timestamp("ended_at", { withTimezone: true, mode: 'string' }),
	timeLimit: smallint("time_limit").notNull(),
	topic: text(),
	language: text(),
}, (table) => [
	foreignKey({
			columns: [table.hostId],
			foreignColumns: [users.id],
			name: "rooms_host_id_fkey"
		}),
	unique("rooms_code_key").on(table.code),
	pgPolicy("Anyone can view rooms", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("Users can create rooms", { as: "permissive", for: "insert", to: ["authenticated"] }),
	pgPolicy("Room hosts can update rooms", { as: "permissive", for: "update", to: ["authenticated"] }),
]);

export const sharedQuizzes = pgTable("shared_quizzes", {
	shareId: uuid("share_id").defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	quizId: uuid("quiz_id").notNull(),
	roomId: uuid("room_id"),
	type: quizType().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	isPublic: boolean("is_public").default(true).notNull(),
	isAnonymous: boolean("is_anonymous").default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.quizId],
			foreignColumns: [quizzes.id],
			name: "shared_quizzes_quiz_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.roomId],
			foreignColumns: [rooms.id],
			name: "shared_quizzes_room_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "shared_quizzes_user_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const userAnalysis = pgTable("user_analysis", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	userTags: jsonb("user_tags").array(),
	generatedTags: jsonb("generated_tags").array(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
	generatedCategories: jsonb("generated_categories").array(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_analysis_user_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	pgPolicy("Enable insert for users based on user_id", { as: "permissive", for: "insert", to: ["public"], withCheck: sql`(( SELECT auth.uid() AS uid) = user_id)`  }),
	pgPolicy("Enable users to view their own data only", { as: "permissive", for: "select", to: ["authenticated"] }),
]);

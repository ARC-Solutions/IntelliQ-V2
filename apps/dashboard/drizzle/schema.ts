import { pgTable, foreignKey, pgPolicy, bigint, uuid, text, jsonb, vector, timestamp, smallint, boolean, unique, integer, real, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const quizType = pgEnum("quiz_type", ['singleplayer', 'multiplayer', 'document', 'random'])


export const documents = pgTable("documents", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "documents_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	userId: uuid("user_id").notNull(),
	fileUrl: text("file_url").notNull(),
	content: text().notNull(),
	metadata: jsonb().notNull(),
	embedding: vector({ dimensions: 1536 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		documentsUserIdFkey: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "documents_user_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
		usersCanViewTheirOwnDocuments: pgPolicy("Users can view their own documents", { as: "permissive", for: "select", to: ["authenticated"], using: sql`(auth.uid() = user_id)` }),
		usersCanInsertTheirOwnDocuments: pgPolicy("Users can insert their own documents", { as: "permissive", for: "insert", to: ["authenticated"] }),
	}
});

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
}, (table) => {
	return {
		quizzesUserIdFkey: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "quizzes_user_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
		usersCanCreateQuizzes: pgPolicy("Users can create quizzes", { as: "permissive", for: "insert", to: ["authenticated"], withCheck: sql`(auth.uid() = user_id)`  }),
		usersCanUpdateTheirOwnQuizzes: pgPolicy("Users can update their own quizzes", { as: "permissive", for: "update", to: ["authenticated"] }),
		usersCanDeleteTheirOwnQuizzes: pgPolicy("Users can delete their own quizzes", { as: "permissive", for: "delete", to: ["authenticated"] }),
	}
});

export const questions = pgTable("questions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	quizId: uuid("quiz_id").notNull(),
	text: text().notNull(),
	options: text().array().notNull(),
	correctAnswer: text("correct_answer").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		questionsQuizIdFkey: foreignKey({
			columns: [table.quizId],
			foreignColumns: [quizzes.id],
			name: "questions_quiz_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
		anyoneCanViewQuestions: pgPolicy("Anyone can view questions", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
		quizOwnersCanManageQuestions: pgPolicy("Quiz owners can manage questions", { as: "permissive", for: "all", to: ["authenticated"] }),
	}
});

export const users = pgTable("users", {
	id: uuid().default(sql`auth.uid()`).primaryKey().notNull(),
	email: text().notNull(),
	name: text().notNull(),
	avatarUrl: text("avatar_url"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		usersCanUpdateOwnProfile: pgPolicy("Users can update own profile", { as: "permissive", for: "update", to: ["authenticated"], using: sql`(auth.uid() = id)` }),
	}
});

export const userResponses = pgTable("user_responses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	quizId: uuid("quiz_id").notNull(),
	questionId: uuid("question_id").notNull(),
	roomId: uuid("room_id").notNull(),
	answer: text().notNull(),
	isCorrect: boolean("is_correct").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		userResponsesQuestionIdFkey: foreignKey({
			columns: [table.questionId],
			foreignColumns: [questions.id],
			name: "user_responses_question_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
		userResponsesQuizIdFkey: foreignKey({
			columns: [table.quizId],
			foreignColumns: [quizzes.id],
			name: "user_responses_quiz_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
		userResponsesRoomIdFkey: foreignKey({
			columns: [table.roomId],
			foreignColumns: [rooms.id],
			name: "user_responses_room_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
		userResponsesUserIdFkey: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_responses_user_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
		usersCanViewTheirOwnResponses: pgPolicy("Users can view their own responses", { as: "permissive", for: "select", to: ["authenticated"], using: sql`(auth.uid() = user_id)` }),
		usersCanInsertTheirOwnResponses: pgPolicy("Users can insert their own responses", { as: "permissive", for: "insert", to: ["authenticated"] }),
	}
});

export const rooms = pgTable("rooms", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	quizId: uuid("quiz_id").notNull(),
	hostId: uuid("host_id").notNull(),
	maxPlayers: smallint("max_players").default(sql`'4'`).notNull(),
	numQuestions: smallint("num_questions").notNull(),
	code: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	endedAt: timestamp("ended_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => {
	return {
		roomsHostIdFkey: foreignKey({
			columns: [table.hostId],
			foreignColumns: [users.id],
			name: "rooms_host_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
		roomsQuizIdFkey: foreignKey({
			columns: [table.quizId],
			foreignColumns: [quizzes.id],
			name: "rooms_quiz_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
		roomsCodeKey: unique("rooms_code_key").on(table.code),
		anyoneCanViewRooms: pgPolicy("Anyone can view rooms", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
		usersCanCreateRooms: pgPolicy("Users can create rooms", { as: "permissive", for: "insert", to: ["authenticated"] }),
		roomHostsCanUpdateRooms: pgPolicy("Room hosts can update rooms", { as: "permissive", for: "update", to: ["authenticated"] }),
	}
});

export const bookmarks = pgTable("bookmarks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	quizId: uuid("quiz_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		bookmarksQuizIdFkey: foreignKey({
			columns: [table.quizId],
			foreignColumns: [quizzes.id],
			name: "bookmarks_quiz_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
		bookmarksUserIdFkey: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "bookmarks_user_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
		bookmarksUserIdKey: unique("bookmarks_user_id_key").on(table.userId),
		bookmarksQuizIdKey: unique("bookmarks_quiz_id_key").on(table.quizId),
		usersCanViewTheirOwnBookmarks: pgPolicy("Users can view their own bookmarks", { as: "permissive", for: "select", to: ["authenticated"], using: sql`(auth.uid() = user_id)` }),
		usersCanManageTheirOwnBookmarks: pgPolicy("Users can manage their own bookmarks", { as: "permissive", for: "insert", to: ["authenticated"] }),
		usersCanDeleteTheirOwnBookmarks: pgPolicy("Users can delete their own bookmarks", { as: "permissive", for: "delete", to: ["authenticated"] }),
	}
});

export const userUsageData = pgTable("user_usage_data", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	promptTokens: integer("prompt_tokens").notNull(),
	completionTokens: integer("completion_tokens").notNull(),
	totalTokens: integer("total_tokens").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	systemFingerprint: text("system_fingerprint"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	quizSeed: bigint("quiz_seed", { mode: "number" }),
	usedModel: text("used_model"),
	countQuestions: integer("count_Questions"),
	responseTimeTaken: real("response_time_taken"),
}, (table) => {
	return {
		userUsageDataUserIdFkey: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_usage_data_user_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
		userUsageDataQuizSeedKey: unique("user_usage_data_quiz_seed_key").on(table.quizSeed),
	}
});

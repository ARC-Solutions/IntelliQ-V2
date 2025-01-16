import { relations } from "drizzle-orm/relations";
import { questions, userResponses, quizzes, rooms, users, userUsageData, documents, bookmarks } from "./schema";

export const userResponsesRelations = relations(userResponses, ({one}) => ({
	question: one(questions, {
		fields: [userResponses.questionId],
		references: [questions.id]
	}),
	quiz: one(quizzes, {
		fields: [userResponses.quizId],
		references: [quizzes.id]
	}),
	room: one(rooms, {
		fields: [userResponses.roomId],
		references: [rooms.id]
	}),
	user: one(users, {
		fields: [userResponses.userId],
		references: [users.id]
	}),
}));

export const questionsRelations = relations(questions, ({one, many}) => ({
	userResponses: many(userResponses),
	quiz: one(quizzes, {
		fields: [questions.quizId],
		references: [quizzes.id]
	}),
}));

export const quizzesRelations = relations(quizzes, ({one, many}) => ({
	userResponses: many(userResponses),
	questions: many(questions),
	bookmarks: many(bookmarks),
	user: one(users, {
		fields: [quizzes.userId],
		references: [users.id]
	}),
	rooms: many(rooms),
}));

export const roomsRelations = relations(rooms, ({one, many}) => ({
	userResponses: many(userResponses),
	user: one(users, {
		fields: [rooms.hostId],
		references: [users.id]
	}),
	quiz: one(quizzes, {
		fields: [rooms.quizId],
		references: [quizzes.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	userResponses: many(userResponses),
	userUsageData: many(userUsageData),
	documents: many(documents),
	bookmarks: many(bookmarks),
	quizzes: many(quizzes),
	rooms: many(rooms),
}));

export const userUsageDataRelations = relations(userUsageData, ({one}) => ({
	user: one(users, {
		fields: [userUsageData.userId],
		references: [users.id]
	}),
}));

export const documentsRelations = relations(documents, ({one}) => ({
	user: one(users, {
		fields: [documents.userId],
		references: [users.id]
	}),
}));

export const bookmarksRelations = relations(bookmarks, ({one}) => ({
	quiz: one(quizzes, {
		fields: [bookmarks.quizId],
		references: [quizzes.id]
	}),
	user: one(users, {
		fields: [bookmarks.userId],
		references: [users.id]
	}),
}));
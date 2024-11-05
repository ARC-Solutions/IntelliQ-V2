import { relations } from "drizzle-orm/relations";
import { users, documents, quizzes, questions, userResponses, rooms, bookmarks, userUsageData } from "./schema";

export const documentsRelations = relations(documents, ({one}) => ({
	user: one(users, {
		fields: [documents.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	documents: many(documents),
	quizzes: many(quizzes),
	userResponses: many(userResponses),
	rooms: many(rooms),
	bookmarks: many(bookmarks),
	userUsageData: many(userUsageData),
}));

export const quizzesRelations = relations(quizzes, ({one, many}) => ({
	user: one(users, {
		fields: [quizzes.userId],
		references: [users.id]
	}),
	questions: many(questions),
	userResponses: many(userResponses),
	rooms: many(rooms),
	bookmarks: many(bookmarks),
}));

export const questionsRelations = relations(questions, ({one, many}) => ({
	quiz: one(quizzes, {
		fields: [questions.quizId],
		references: [quizzes.id]
	}),
	userResponses: many(userResponses),
}));

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

export const userUsageDataRelations = relations(userUsageData, ({one}) => ({
	user: one(users, {
		fields: [userUsageData.userId],
		references: [users.id]
	}),
}));
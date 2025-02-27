import { relations } from "drizzle-orm/relations";
import { quizzes, multiplayerQuizSubmissions, rooms, users, questions, userResponses, userUsageData, documents, bookmarks, sharedQuizzes } from "./schema";

export const multiplayerQuizSubmissionsRelations = relations(multiplayerQuizSubmissions, ({one}) => ({
	quiz: one(quizzes, {
		fields: [multiplayerQuizSubmissions.quizId],
		references: [quizzes.id]
	}),
	room: one(rooms, {
		fields: [multiplayerQuizSubmissions.roomId],
		references: [rooms.id]
	}),
	user: one(users, {
		fields: [multiplayerQuizSubmissions.userId],
		references: [users.id]
	}),
}));

export const quizzesRelations = relations(quizzes, ({one, many}) => ({
	multiplayerQuizSubmissions: many(multiplayerQuizSubmissions),
	userResponses: many(userResponses),
	questions: many(questions),
	bookmarks: many(bookmarks),
	document: one(documents, {
		fields: [quizzes.documentId],
		references: [documents.id]
	}),
	room: one(rooms, {
		fields: [quizzes.roomId],
		references: [rooms.id]
	}),
	user: one(users, {
		fields: [quizzes.userId],
		references: [users.id]
	}),
	sharedQuizzes: many(sharedQuizzes),
}));

export const roomsRelations = relations(rooms, ({one, many}) => ({
	multiplayerQuizSubmissions: many(multiplayerQuizSubmissions),
	userResponses: many(userResponses),
	user: one(users, {
		fields: [rooms.hostId],
		references: [users.id]
	}),
	quizzes: many(quizzes),
	sharedQuizzes: many(sharedQuizzes),
}));

export const usersRelations = relations(users, ({many}) => ({
	multiplayerQuizSubmissions: many(multiplayerQuizSubmissions),
	userResponses: many(userResponses),
	userUsageData: many(userUsageData),
	documents: many(documents),
	bookmarks: many(bookmarks),
	rooms: many(rooms),
	quizzes: many(quizzes),
	sharedQuizzes: many(sharedQuizzes),
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

export const questionsRelations = relations(questions, ({one, many}) => ({
	userResponses: many(userResponses),
	quiz: one(quizzes, {
		fields: [questions.quizId],
		references: [quizzes.id]
	}),
}));

export const userUsageDataRelations = relations(userUsageData, ({one}) => ({
	user: one(users, {
		fields: [userUsageData.userId],
		references: [users.id]
	}),
}));

export const documentsRelations = relations(documents, ({one, many}) => ({
	user: one(users, {
		fields: [documents.userId],
		references: [users.id]
	}),
	quizzes: many(quizzes),
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

export const sharedQuizzesRelations = relations(sharedQuizzes, ({one}) => ({
	quiz: one(quizzes, {
		fields: [sharedQuizzes.quizId],
		references: [quizzes.id]
	}),
	room: one(rooms, {
		fields: [sharedQuizzes.roomId],
		references: [rooms.id]
	}),
	user: one(users, {
		fields: [sharedQuizzes.userId],
		references: [users.id]
	}),
}));
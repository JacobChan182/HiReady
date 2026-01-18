import mongoose from 'mongoose';

const QuizSchema = new mongoose.Schema({
    question: { type: String, required: true },
    correct: { type: Number, required: true }, // 1 for correct, 0 for incorrect
    createdAt: { type: Date, default: Date.now }
});

export const Quiz = mongoose.model('Quiz', QuizSchema);
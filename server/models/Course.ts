import mongoose, { Schema } from 'mongoose';
import { IRewindEvent } from './RewindEvent';

export interface ITrainingSession {
  trainingSessionId: string;
  trainingSessionTitle: string;
  trainingProgramId: string;
  videoUrl?: string;
  createdAt: Date;
  employeeRewindEvents: Array<{
    employeeId: string;
    employeePseudonymId: string;
    rewindEvents: IRewindEvent[];
  }>;
}

export interface ITrainingProgram {
  trainingProgramId: string; // Unique training program ID (e.g., "SAFETY-101")
  trainingProgramName: string;
  trainerId: string;
  trainingSessions: ITrainingSession[];
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeRewindEventsSchema = new Schema({
  employeeId: { type: String, required: true },
  employeePseudonymId: { type: String, required: true },
  rewindEvents: { type: [Schema.Types.Mixed], default: [] },
});

const TrainingSessionSchema = new Schema<ITrainingSession>({
  trainingSessionId: { type: String, required: true }, // Not unique - same trainingSessionId can exist in different training programs
  trainingSessionTitle: { type: String, required: true },
  trainingProgramId: { type: String, required: true },
  videoUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  employeeRewindEvents: { type: [EmployeeRewindEventsSchema], default: [] },
}, { _id: false }); // Disable _id for subdocuments

const TrainingProgramSchema = new Schema<ITrainingProgram>({
  trainingProgramId: { type: String, required: true, unique: true },
  trainingProgramName: { type: String, required: true },
  trainerId: { type: String, required: true },
  trainingSessions: { type: [TrainingSessionSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

TrainingProgramSchema.pre('save', function() {
  this.updatedAt = new Date();
});

export const TrainingProgram = mongoose.model<ITrainingProgram>('TrainingProgram', TrainingProgramSchema);

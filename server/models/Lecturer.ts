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

export interface ITrainer {
  userId: string;
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
  trainingSessionId: { type: String, required: true, unique: true },
  trainingSessionTitle: { type: String, required: true },
  trainingProgramId: { type: String, required: true },
  videoUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  employeeRewindEvents: { type: [EmployeeRewindEventsSchema], default: [] },
});

const TrainerSchema = new Schema<ITrainer>({
  userId: { type: String, required: true, unique: true },
  trainingSessions: { type: [TrainingSessionSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

TrainerSchema.pre('save', function(this: ITrainer) {
  this.updatedAt = new Date();
});

export const Trainer = mongoose.model<ITrainer>('Trainer', TrainerSchema);

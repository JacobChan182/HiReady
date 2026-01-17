import mongoose, { Schema } from 'mongoose';
import { IRewindEvent } from './RewindEvent';

export interface ITrainingSessionProgress {
  trainingSessionId: string;
  trainingSessionTitle: string;
  trainingProgramId: string;
  assignedAt: Date;
  rewindEvents: IRewindEvent[];
  lastAccessedAt?: Date;
}

export interface IEmployee {
  userId: string;
  pseudonymId: string;
  trainingProgramIds: string[];
  cluster?: string;
  trainingSessions: ITrainingSessionProgress[];
  createdAt: Date;
  updatedAt: Date;
}

const TrainingSessionProgressSchema = new Schema<ITrainingSessionProgress>({
  trainingSessionId: { type: String, required: true },
  trainingProgramId: { type: String, required: true },
  trainingSessionTitle: { type: String, required: true },
  assignedAt: { type: Date, default: Date.now },
  rewindEvents: { type: Schema.Types.Mixed, default: [] },
  lastAccessedAt: { type: Date },
});

const EmployeeSchema = new Schema<IEmployee>({
  userId: { type: String, required: true, unique: true },
  pseudonymId: { type: String, required: true, unique: true },
  trainingProgramIds: { type: [String], default: [] },
  cluster: { type: String },
  trainingSessions: { type: [TrainingSessionProgressSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

EmployeeSchema.pre('save', function(this: IEmployee) {
  this.updatedAt = new Date();
});

export const Employee = mongoose.model<IEmployee>('Employee', EmployeeSchema);

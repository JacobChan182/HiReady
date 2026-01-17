import express, { Request, Response } from 'express';
import { Employee } from '../models/Student';
import { TrainingProgram } from '../models/Course';

const router = express.Router();

// Track rewind event for an employee
router.post('/rewind', async (req: Request, res: Response) => {
  try {
    const {
      userId,
      pseudonymId,
      trainingSessionId,
      trainingSessionTitle,
      trainingProgramId,
      rewindEvent,
    } = req.body;

    if (!userId || !trainingSessionId || !rewindEvent) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Update Employee collection
    const employee = await Employee.findOne({ userId });
    
    if (!employee) {
      // Create new employee if doesn't exist
      const newEmployee = new Employee({
        userId,
        pseudonymId,
        trainingProgramIds: [trainingProgramId],
        trainingSessions: [{
          trainingSessionId,
          trainingSessionTitle,
          trainingProgramId,
          assignedAt: new Date(),
          rewindEvents: [rewindEvent],
          lastAccessedAt: new Date(),
        }],
      });
      await newEmployee.save();
    } else {
      // Update existing employee
      const trainingSessionProgress = employee.trainingSessions.find(ts => ts.trainingSessionId === trainingSessionId);
      
      if (!trainingSessionProgress) {
        // Add new training session assignment
        employee.trainingSessions.push({
          trainingSessionId,
          trainingSessionTitle,
          trainingProgramId,
          assignedAt: new Date(),
          rewindEvents: [rewindEvent],
          lastAccessedAt: new Date(),
        });
      } else {
        // Add rewind event to existing training session
        trainingSessionProgress.rewindEvents.push(rewindEvent);
        trainingSessionProgress.lastAccessedAt = new Date();
      }
      
      await employee.save();
    }

    // Update TrainingProgram collection
    // Find training program by trainingProgramId
    let trainingProgram = await TrainingProgram.findOne({ trainingProgramId });
    
    if (!trainingProgram) {
      // Training program doesn't exist - this shouldn't happen if training programs are created properly
      // But we'll log it and continue (employee data is already saved)
      console.warn(`Training program ${trainingProgramId} not found when tracking rewind event`);
    } else {
      // Find training session within the training program
      let trainingSession = trainingProgram.trainingSessions.find(ts => ts.trainingSessionId === trainingSessionId);
      
      if (!trainingSession) {
        // Training session doesn't exist in training program - add it
        trainingProgram.trainingSessions.push({
          trainingSessionId,
          trainingSessionTitle,
          trainingProgramId,
          createdAt: new Date(),
          employeeRewindEvents: [{
            employeeId: userId,
            employeePseudonymId: pseudonymId,
            rewindEvents: [rewindEvent],
          }],
        });
        await trainingProgram.save();
      } else {
        // Training session exists, add rewind event
        let employeeRewindData = trainingSession.employeeRewindEvents.find(
          e => e.employeeId === userId
        );
        
        if (!employeeRewindData) {
          // Add new employee to training session
          trainingSession.employeeRewindEvents.push({
            employeeId: userId,
            employeePseudonymId: pseudonymId,
            rewindEvents: [rewindEvent],
          });
        } else {
          // Add rewind event to existing employee
          employeeRewindData.rewindEvents.push(rewindEvent);
        }
        
        await trainingProgram.save();
      }
    }

    res.status(200).json({ success: true, message: 'Rewind event tracked' });
  } catch (error) {
    console.error('Error tracking rewind event:', error);
    res.status(500).json({ error: 'Failed to track rewind event' });
  }
});

export default router;

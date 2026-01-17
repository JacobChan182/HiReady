import express, { Request, Response } from 'express';
import { Employee } from '../models/Student';

const router = express.Router();

// Get employee data
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const employee = await Employee.findOne({ userId });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    console.error('Error fetching employee data:', error);
    res.status(500).json({ error: 'Failed to fetch employee data' });
  }
});

// Assign training session to employee
router.post('/:userId/training-sessions', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { trainingSessionId, trainingSessionTitle, trainingProgramId } = req.body;

    if (!trainingSessionId || !trainingSessionTitle || !trainingProgramId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const employee = await Employee.findOne({ userId });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Check if training session already assigned
    const existingTrainingSession = employee.trainingSessions.find(ts => ts.trainingSessionId === trainingSessionId);
    
    if (!existingTrainingSession) {
      employee.trainingSessions.push({
        trainingSessionId,
        trainingSessionTitle,
        trainingProgramId,
        assignedAt: new Date(),
        rewindEvents: [],
      });
    }

    await employee.save();

    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    console.error('Error assigning training session to employee:', error);
    res.status(500).json({ error: 'Failed to assign training session' });
  }
});

export default router;

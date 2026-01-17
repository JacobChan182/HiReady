import express, { Request, Response } from 'express';
import { Trainer } from '../models/Lecturer';

const router = express.Router();

// Create or update trainer with a training session
router.post('/:userId/training-sessions', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { trainingSessionId, trainingSessionTitle, trainingProgramId } = req.body;

    if (!trainingSessionId || !trainingSessionTitle || !trainingProgramId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let trainer = await Trainer.findOne({ userId });

    if (!trainer) {
      trainer = new Trainer({
        userId,
        trainingSessions: [{
          trainingSessionId,
          trainingSessionTitle,
          trainingProgramId,
          createdAt: new Date(),
          employeeRewindEvents: [],
        }],
      });
    } else {
      // Check if training session already exists
      const existingTrainingSession = trainer.trainingSessions.find(ts => ts.trainingSessionId === trainingSessionId);
      
      if (!existingTrainingSession) {
        trainer.trainingSessions.push({
          trainingSessionId,
          trainingSessionTitle,
          trainingProgramId,
          createdAt: new Date(),
          employeeRewindEvents: [],
        });
      }
    }

    await trainer.save();

    res.status(200).json({ success: true, data: trainer });
  } catch (error) {
    console.error('Error updating trainer training sessions:', error);
    res.status(500).json({ error: 'Failed to update trainer training sessions' });
  }
});

// Get trainer data
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const trainer = await Trainer.findOne({ userId });

    if (!trainer) {
      return res.status(404).json({ error: 'Trainer not found' });
    }

    res.status(200).json({ success: true, data: trainer });
  } catch (error) {
    console.error('Error fetching trainer data:', error);
    res.status(500).json({ error: 'Failed to fetch trainer data' });
  }
});

export default router;

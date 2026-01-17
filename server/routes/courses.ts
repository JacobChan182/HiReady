import express, { Request, Response } from 'express';
import { TrainingProgram } from '../models/Course';

const router = express.Router();

// Create a new training program
router.post('/', async (req: Request, res: Response) => {
  try {
    const { trainingProgramId, trainingProgramName, trainerId } = req.body;

    if (!trainingProgramId || !trainingProgramName || !trainerId) {
      return res.status(400).json({ error: 'Missing required fields: trainingProgramId, trainingProgramName, trainerId' });
    }

    // Check if training program already exists
    const existingTrainingProgram = await TrainingProgram.findOne({ trainingProgramId });
    if (existingTrainingProgram) {
      return res.status(409).json({ error: 'Training program with this ID already exists' });
    }

    const newTrainingProgram = new TrainingProgram({
      trainingProgramId,
      trainingProgramName,
      trainerId,
      trainingSessions: [],
    });

    await newTrainingProgram.save();

    res.status(201).json({ success: true, data: newTrainingProgram });
  } catch (error: any) {
    console.error('Error creating training program:', error);
    
    // Handle duplicate key error for old userId index
    if (error.code === 11000 && error.keyPattern?.userId) {
      console.error('⚠️  Old userId index detected. Please restart the server to clean up indexes.');
      return res.status(500).json({ 
        error: 'Database index conflict. Please restart the server to fix this issue.',
        details: 'The database has an old index that needs to be removed. Restarting the server will automatically fix this.'
      });
    }
    
    // Handle duplicate key error for old trainingSessions.trainingSessionId index
    if (error.code === 11000 && error.keyPattern?.['trainingSessions.trainingSessionId']) {
      console.error('⚠️  Old trainingSessions.trainingSessionId index detected. Please restart the server to clean up indexes.');
      return res.status(500).json({ 
        error: 'Database index conflict. Please restart the server to fix this issue.',
        details: 'The database has an old index on trainingSessions.trainingSessionId that needs to be removed. Restarting the server will automatically fix this.'
      });
    }
    
    // Handle duplicate trainingProgramId error
    if (error.code === 11000 && error.keyPattern?.trainingProgramId) {
      return res.status(409).json({ error: 'Training program with this ID already exists' });
    }
    
    res.status(500).json({ error: 'Failed to create training program' });
  }
});

// Get all training programs for a trainer
router.get('/trainer/:trainerId', async (req: Request, res: Response) => {
  try {
    const { trainerId } = req.params;

    const trainingPrograms = await TrainingProgram.find({ trainerId });

    res.status(200).json({ success: true, data: trainingPrograms });
  } catch (error) {
    console.error('Error fetching training programs:', error);
    res.status(500).json({ error: 'Failed to fetch training programs' });
  }
});

// Get a specific training program by trainingProgramId
router.get('/:trainingProgramId', async (req: Request, res: Response) => {
  try {
    const { trainingProgramId } = req.params;

    const trainingProgram = await TrainingProgram.findOne({ trainingProgramId });

    if (!trainingProgram) {
      return res.status(404).json({ error: 'Training program not found' });
    }

    res.status(200).json({ success: true, data: trainingProgram });
  } catch (error) {
    console.error('Error fetching training program:', error);
    res.status(500).json({ error: 'Failed to fetch training program' });
  }
});

// Add a training session to a training program
router.post('/:trainingProgramId/training-sessions', async (req: Request, res: Response) => {
  try {
    const trainingProgramId = Array.isArray(req.params.trainingProgramId) 
      ? req.params.trainingProgramId[0] 
      : req.params.trainingProgramId;
    const { trainingSessionId, trainingSessionTitle, videoUrl } = req.body;

    if (!trainingSessionId || !trainingSessionTitle) {
      return res.status(400).json({ error: 'Missing required fields: trainingSessionId, trainingSessionTitle' });
    }

    let trainingProgram = await TrainingProgram.findOne({ trainingProgramId });

    if (!trainingProgram) {
      return res.status(404).json({ error: 'Training program not found' });
    }

    // Check if training session already exists
    const existingTrainingSession = trainingProgram.trainingSessions.find(ts => ts.trainingSessionId === trainingSessionId);
    
    if (!existingTrainingSession) {
      trainingProgram.trainingSessions.push({
        trainingSessionId,
        trainingSessionTitle,
        trainingProgramId,
        videoUrl: videoUrl || undefined,
        createdAt: new Date(),
        employeeRewindEvents: [],
      });
      await trainingProgram.save();
    }

    res.status(200).json({ success: true, data: trainingProgram });
  } catch (error) {
    console.error('Error adding training session to training program:', error);
    res.status(500).json({ error: 'Failed to add training session to training program' });
  }
});

// Get all training sessions for a trainer (aggregated from all their training programs)
router.get('/trainer/:trainerId/training-sessions', async (req: Request, res: Response) => {
  try {
    const trainerId = Array.isArray(req.params.trainerId) 
      ? req.params.trainerId[0] 
      : req.params.trainerId;

    const trainingPrograms = await TrainingProgram.find({ trainerId });

    // Aggregate all training sessions from all training programs
    const allTrainingSessions = trainingPrograms.flatMap(trainingProgram => 
      trainingProgram.trainingSessions.map(trainingSession => ({
        trainingSessionId: trainingSession.trainingSessionId,
        trainingSessionTitle: trainingSession.trainingSessionTitle,
        trainingProgramId: trainingProgram.trainingProgramId,
        videoUrl: trainingSession.videoUrl,
        createdAt: trainingSession.createdAt,
        employeeRewindEvents: trainingSession.employeeRewindEvents,
        trainingProgramName: trainingProgram.trainingProgramName,
      }))
    );

    res.status(200).json({ success: true, data: { trainingSessions: allTrainingSessions, trainingPrograms } });
  } catch (error) {
    console.error('Error fetching trainer training sessions:', error);
    res.status(500).json({ error: 'Failed to fetch trainer training sessions' });
  }
});

export default router;

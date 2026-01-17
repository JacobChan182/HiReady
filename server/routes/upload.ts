import express, { Request, Response } from 'express';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import axios from 'axios';
import { s3Client, BUCKET_NAME, generateVideoKey, getVideoUrl } from '../utils/r2';
import { Trainer } from '../models/Lecturer';
import { TrainingProgram } from '../models/Course';

const router = express.Router();

// 1. Generate presigned URL for video upload
router.post('/presigned-url', async (req: Request, res: Response) => {
  try {
    const { userId, trainingSessionId, filename, contentType } = req.body;

    if (!userId || !trainingSessionId || !filename) {
      return res.status(400).json({ error: 'Missing required fields: userId, trainingSessionId, filename' });
    }

    if (!BUCKET_NAME) {
      console.error('R2_BUCKET_NAME is not configured');
      return res.status(500).json({ error: 'R2 bucket configuration missing.' });
    }

    const validExtensions = ['mp4', 'webm', 'mov', 'avi', 'mkv'];
    const extension = filename.split('.').pop()?.toLowerCase();
    if (!extension || !validExtensions.includes(extension)) {
      return res.status(400).json({ error: 'Invalid file type. Only video files are allowed.' });
    }

    const key = generateVideoKey(userId, trainingSessionId, filename);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType || `video/${extension}`,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    res.status(200).json({
      success: true,
      presignedUrl,
      key,
      publicUrl: getVideoUrl(key),
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

// 2. Complete upload - Update Lecturer, Course, and Trigger Indexing
router.post('/complete', async (req: Request, res: Response) => {
  try {
    const { userId, trainingSessionId, videoKey, trainingSessionTitle, trainingProgramId } = req.body;

    if (!userId || !trainingSessionId || !videoKey || !trainingProgramId) {
      return res.status(400).json({ error: 'Missing required fields (userId, trainingSessionId, videoKey, trainingProgramId)' });
    }

    // A. Verify TrainingProgram and Permissions
    const trainingProgram = await TrainingProgram.findOne({ trainingProgramId });
    if (!trainingProgram) {
      return res.status(404).json({ error: `Training program ${trainingProgramId} not found.` });
    }
    if (trainingProgram.trainerId !== userId) {
      return res.status(403).json({ error: 'Permission denied: You do not own this training program' });
    }

    // B. Generate signed URL for Twelve Labs (Flask) access
    const downloadCommand = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: videoKey });
    const signedDownloadUrl = await getSignedUrl(s3Client, downloadCommand, { expiresIn: 3600 });

    // C. Trigger Flask Indexing
    try {
      await axios.post('http://127.0.0.1:5000/api/index-video', {
        videoUrl: signedDownloadUrl,
        trainingSessionId: trainingSessionId
      });
      console.log('Twelve Labs indexing triggered via Flask.');
    } catch (flaskError: any) {
      console.error('Indexing trigger failed:', flaskError.message);
    }

    const videoUrl = getVideoUrl(videoKey);
    const trainingSessionData = {
      trainingSessionId,
      trainingSessionTitle: trainingSessionTitle || 'Untitled Training Session',
      trainingProgramId,
      videoUrl,
      createdAt: new Date(),
      employeeRewindEvents: [],
    };

    // D. Update TrainingProgram Model
    const trainingProgramSessionIndex = trainingProgram.trainingSessions.findIndex(ts => ts.trainingSessionId === trainingSessionId);
    if (trainingProgramSessionIndex > -1) {
      trainingProgram.trainingSessions[trainingProgramSessionIndex].videoUrl = videoUrl;
    } else {
      trainingProgram.trainingSessions.push(trainingSessionData);
    }
    await trainingProgram.save();

    // E. Update Trainer Model
    let trainer = await Trainer.findOne({ userId });
    if (!trainer) {
      trainer = new Trainer({ userId, trainingSessions: [] });
    }
    const trainerSessionIndex = trainer.trainingSessions.findIndex(ts => ts.trainingSessionId === trainingSessionId);
    if (trainerSessionIndex > -1) {
      trainer.trainingSessions[trainerSessionIndex].videoUrl = videoUrl;
    } else {
      trainer.trainingSessions.push(trainingSessionData);
    }
    await trainer.save();

    res.status(200).json({
      success: true,
      message: 'Video upload and metadata synchronization completed',
      data: { trainingSessionId, videoUrl },
    });
  } catch (error) {
    console.error('Error completing upload:', error);
    res.status(500).json({ error: 'Failed to save video metadata across models' });
  }
});

// 3. Direct upload (Server-side proxy)
router.post('/direct', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const trainingSessionId = req.headers['x-training-session-id'] as string;
    const filename = req.headers['x-filename'] as string;
    const contentType = req.headers['content-type'] || 'video/mp4';

    if (!userId || !trainingSessionId || !filename) {
      return res.status(400).json({ error: 'Missing required headers' });
    }

    const key = generateVideoKey(userId, trainingSessionId, filename);
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: req.body,
      ContentType: contentType,
    });

    await s3Client.send(command);

    res.status(200).json({
      success: true,
      data: { key, videoUrl: getVideoUrl(key), trainingSessionId },
    });
  } catch (error) {
    console.error('Direct upload failed:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

export default router;
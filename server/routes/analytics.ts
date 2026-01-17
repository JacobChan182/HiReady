import express, { Request, Response } from 'express';
import { Student } from '../models/Student';
import { Course } from '../models/Course';

const router = express.Router();

// Track rewind event for a student
router.post('/rewind', async (req: Request, res: Response) => {
  try {
    const {
      userId,
      pseudonymId,
      lectureId,
      lectureTitle,
      courseId,
      rewindEvent,
    } = req.body;

    if (!userId || !lectureId || !rewindEvent) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Update Student collection
    const student = await Student.findOne({ userId });
    
    if (!student) {
      // Create new student if doesn't exist
      const newStudent = new Student({
        userId,
        pseudonymId,
        courseIds: [courseId],
        lectures: [{
          lectureId,
          lectureTitle,
          assignedAt: new Date(),
          rewindEvents: [rewindEvent],
          lastAccessedAt: new Date(),
        }],
      });
      await newStudent.save();
    } else {
      // Update existing student
      let lectureProgress = student.lectures.find(l => l.lectureId === lectureId);
      
      if (!lectureProgress) {
        // Add new lecture assignment
        student.lectures.push({
          lectureId,
          lectureTitle,
          assignedAt: new Date(),
          rewindEvents: [rewindEvent],
          lastAccessedAt: new Date(),
        });
      } else {
        // Add rewind event to existing lecture
        lectureProgress.rewindEvents.push(rewindEvent);
        lectureProgress.lastAccessedAt = new Date();
      }
      
      await student.save();
    }

    // Update Course collection
    // Find course by courseId
    let course = await Course.findOne({ courseId });
    
    if (!course) {
      // Course doesn't exist - this shouldn't happen if courses are created properly
      // But we'll log it and continue (student data is already saved)
      console.warn(`Course ${courseId} not found when tracking rewind event`);
    } else {
      // Find lecture within the course
      let lecture = course.lectures.find(l => l.lectureId === lectureId);
      
      if (!lecture) {
        // Lecture doesn't exist in course - add it
        course.lectures.push({
          lectureId,
          lectureTitle,
          courseId,
          createdAt: new Date(),
          studentRewindEvents: [{
            studentId: userId,
            studentPseudonymId: pseudonymId,
            rewindEvents: [rewindEvent],
          }],
        });
        await course.save();
      } else {
        // Lecture exists, add rewind event
        let studentRewindData = lecture.studentRewindEvents.find(
          s => s.studentId === userId
        );
        
        if (!studentRewindData) {
          // Add new student to lecture
          lecture.studentRewindEvents.push({
            studentId: userId,
            studentPseudonymId: pseudonymId,
            rewindEvents: [rewindEvent],
          });
        } else {
          // Add rewind event to existing student
          studentRewindData.rewindEvents.push(rewindEvent);
        }
        
        await course.save();
      }
    }

    res.status(200).json({ success: true, message: 'Rewind event tracked' });
  } catch (error) {
    console.error('Error tracking rewind event:', error);
    res.status(500).json({ error: 'Failed to track rewind event' });
  }
});

export default router;

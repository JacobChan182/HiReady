import express, { Request, Response } from 'express';
import { Quiz } from '../models/Quiz';

const router = express.Router();

// Path changed from '/api/quizzes' to '/quizzes' because prefix is in index.ts
router.post('/quizzes', async (req: Request, res: Response) => {
    try {
        console.log('\n=======================================');
        console.log('[NODE] INCOMING QUIZ DATA AT:', new Date().toISOString());
        console.log('[NODE] Body:', JSON.stringify(req.body, null, 2));
        
        const { results } = req.body;
        
        if (!results || !Array.isArray(results)) {
            console.log('[NODE] Validation Failed: results missing or not array');
            return res.status(400).json({ error: 'No results provided' });
        }
        
        const saved = await Quiz.insertMany(results);
        console.log(`[NODE] MongoDB Saved ${saved.length} documents.`);
        console.log('=======================================\n');
        
        res.status(201).json({ success: true, count: saved.length });
    } catch (error: any) {
        console.error('[NODE] DATABASE ERROR:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;

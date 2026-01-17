import { User, TrainingProgram, TrainingSession, Concept, AnalyticsEvent, BehavioralCluster } from '@/types';

// Generate pseudonymous ID
export const generatePseudonymId = (): string => {
  const adjectives = ['Swift', 'Bright', 'Calm', 'Bold', 'Keen', 'Wise', 'Quick', 'Sharp'];
  const animals = ['Fox', 'Owl', 'Bear', 'Wolf', 'Hawk', 'Lion', 'Eagle', 'Tiger'];
  const number = Math.floor(Math.random() * 999) + 1;
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${animals[Math.floor(Math.random() * animals.length)]}${number}`;
};

export const mockTrainingPrograms: TrainingProgram[] = [
  {
    id: 'training-program-1',
    name: 'Workplace Safety Training',
    code: 'SAFETY-101',
    trainerId: 'trainer-1',
    trainingSessionIds: ['training-session-1', 'training-session-2'],
  },
  {
    id: 'training-program-2',
    name: 'Machinery Operation Basics',
    code: 'MACH-201',
    trainerId: 'trainer-1',
    trainingSessionIds: ['training-session-3'],
  },
];

export const mockConcepts: Concept[] = [
  // Training Session 1 concepts
  {
    id: 'concept-1',
    name: 'Workplace Safety Fundamentals',
    summary: 'Introduction to basic workplace safety principles and regulations.',
    startTime: 0,
    endTime: 180,
    trainingSessionId: 'training-session-1',
  },
  {
    id: 'concept-2',
    name: 'Hazard Identification',
    summary: 'How to identify and assess workplace hazards effectively.',
    startTime: 180,
    endTime: 420,
    trainingSessionId: 'training-session-1',
  },
  {
    id: 'concept-3',
    name: 'Personal Protective Equipment',
    summary: 'Proper selection, use, and maintenance of PPE.',
    startTime: 420,
    endTime: 720,
    trainingSessionId: 'training-session-1',
  },
  {
    id: 'concept-4',
    name: 'Emergency Procedures',
    summary: 'Essential emergency response protocols and evacuation procedures.',
    startTime: 720,
    endTime: 1020,
    trainingSessionId: 'training-session-1',
  },
  {
    id: 'concept-5',
    name: 'Incident Reporting',
    summary: 'Proper documentation and reporting of workplace incidents.',
    startTime: 1020,
    endTime: 1380,
    trainingSessionId: 'training-session-1',
  },
  // Training Session 2 concepts
  {
    id: 'concept-6',
    name: 'Machinery Safety Basics',
    summary: 'Fundamental safety practices when operating machinery.',
    startTime: 0,
    endTime: 300,
    trainingSessionId: 'training-session-2',
  },
  {
    id: 'concept-7',
    name: 'Lockout/Tagout Procedures',
    summary: 'Critical safety procedures for equipment maintenance.',
    startTime: 300,
    endTime: 600,
    trainingSessionId: 'training-session-2',
  },
];

export const mockTrainingSessions: TrainingSession[] = [
  {
    id: 'training-session-1',
    title: 'Workplace Safety Essentials',
    trainingProgramId: 'training-program-1',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    duration: 1380,
    concepts: mockConcepts.filter(c => c.trainingSessionId === 'training-session-1'),
    uploadedAt: new Date('2024-01-15'),
  },
  {
    id: 'training-session-2',
    title: 'Machinery Safety Protocols',
    trainingProgramId: 'training-program-1',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    duration: 600,
    concepts: mockConcepts.filter(c => c.trainingSessionId === 'training-session-2'),
    uploadedAt: new Date('2024-01-22'),
  },
];

// Transform MongoDB training program data to TrainingSession format
export const transformTrainingProgramSessions = (trainingProgramData: any): TrainingSession[] => {
  if (!trainingProgramData?.trainingSessions || !Array.isArray(trainingProgramData.trainingSessions)) {
    return [];
  }

  return trainingProgramData.trainingSessions.map((trainingSession: any) => ({
    id: trainingSession.trainingSessionId,
    title: trainingSession.trainingSessionTitle,
    trainingProgramId: trainingSession.trainingProgramId || trainingProgramData.trainingProgramId,
    videoUrl: trainingSession.videoUrl || '',
    duration: 0, // Duration not stored in MongoDB, will need to be calculated or stored
    concepts: [], // Concepts not stored in MongoDB training program model, will need separate fetch
    uploadedAt: trainingSession.createdAt ? new Date(trainingSession.createdAt) : new Date(),
  }));
};

// Transform aggregated trainer training sessions response
export const transformTrainerTrainingSessions = (responseData: any): { trainingSessions: TrainingSession[], trainingPrograms: any[] } => {
  if (!responseData?.data) {
    return { trainingSessions: [], trainingPrograms: [] };
  }

  const allTrainingSessions = responseData.data.trainingSessions || [];
  const trainingPrograms = responseData.data.trainingPrograms || [];

  const transformedTrainingSessions: TrainingSession[] = allTrainingSessions.map((trainingSession: any) => ({
    id: trainingSession.trainingSessionId,
    title: trainingSession.trainingSessionTitle,
    trainingProgramId: trainingSession.trainingProgramId,
    videoUrl: trainingSession.videoUrl || '',
    duration: 0,
    concepts: [],
    uploadedAt: trainingSession.createdAt ? new Date(trainingSession.createdAt) : new Date(),
  }));

  return { trainingSessions: transformedTrainingSessions, trainingPrograms };
};

// Helper to merge real training sessions with mock data (for concepts, duration, etc.)
export const enrichTrainingSessionsWithMockData = (realTrainingSessions: TrainingSession[]): TrainingSession[] => {
  return realTrainingSessions.map(trainingSession => {
    // Try to find matching mock training session for concepts and duration
    const mockTrainingSession = mockTrainingSessions.find(m => m.id === trainingSession.id);
    if (mockTrainingSession) {
      return {
        ...trainingSession,
        duration: trainingSession.duration || mockTrainingSession.duration,
        concepts: trainingSession.concepts.length > 0 ? trainingSession.concepts : mockTrainingSession.concepts,
      };
    }
    return trainingSession;
  });
};

// Generate mock analytics events
const clusters: BehavioralCluster[] = ['high-replay', 'fast-watcher', 'note-taker', 'late-night-learner', 'steady-pacer'];

export const mockEmployees: User[] = Array.from({ length: 45 }, (_, i) => ({
  id: `employee-${i + 1}`,
  pseudonymId: generatePseudonymId(),
  role: 'employee' as const,
  trainingProgramIds: ['training-program-1'],
  cluster: clusters[Math.floor(Math.random() * clusters.length)],
  createdAt: new Date('2024-01-01'),
}));

// Generate realistic analytics events
export const generateMockEvents = (): AnalyticsEvent[] => {
  const events: AnalyticsEvent[] = [];
  const eventTypes: Array<'play' | 'pause' | 'replay' | 'seek' | 'drop-off' | 'speed-change'> = 
    ['play', 'pause', 'replay', 'seek', 'drop-off', 'speed-change'];

  // Concepts that are "confusing" - will have more replays and drop-offs
  const confusingConcepts = ['concept-3', 'concept-5']; // Gradient Descent & Backpropagation

  mockEmployees.forEach(employee => {
    mockConcepts.forEach(concept => {
      const isConfusing = confusingConcepts.includes(concept.id);
      const numEvents = isConfusing ? Math.floor(Math.random() * 8) + 5 : Math.floor(Math.random() * 4) + 1;

      for (let i = 0; i < numEvents; i++) {
        const eventType = isConfusing && Math.random() > 0.4 
          ? (Math.random() > 0.5 ? 'replay' : 'drop-off')
          : eventTypes[Math.floor(Math.random() * eventTypes.length)];

        events.push({
          id: `event-${events.length}`,
          userId: employee.id,
          trainingProgramId: 'training-program-1',
          trainingSessionId: concept.trainingSessionId,
          conceptId: concept.id,
          eventType,
          timestamp: concept.startTime + Math.random() * (concept.endTime - concept.startTime),
          createdAt: new Date(),
        });
      }
    });
  });

  return events;
};

export const mockEvents = generateMockEvents();

// Calculate concept insights
export const calculateConceptInsights = () => {
  const insights: Record<string, { replays: number; dropOffs: number; totalEvents: number }> = {};

  mockEvents.forEach(event => {
    if (!event.conceptId) return;
    
    if (!insights[event.conceptId]) {
      insights[event.conceptId] = { replays: 0, dropOffs: 0, totalEvents: 0 };
    }

    insights[event.conceptId].totalEvents++;
    if (event.eventType === 'replay') insights[event.conceptId].replays++;
    if (event.eventType === 'drop-off') insights[event.conceptId].dropOffs++;
  });

  return mockConcepts.map(concept => {
    const data = insights[concept.id] || { replays: 0, dropOffs: 0, totalEvents: 0 };
    const struggleScore = (data.replays * 2 + data.dropOffs * 3) / Math.max(data.totalEvents, 1);
    
    return {
      conceptId: concept.id,
      conceptName: concept.name,
      replayCount: data.replays,
      dropOffCount: data.dropOffs,
      avgWatchTime: (concept.endTime - concept.startTime) * 0.85,
      struggleScore: Math.min(struggleScore * 20, 100),
    };
  }).sort((a, b) => b.struggleScore - a.struggleScore);
};

// Calculate cluster insights
export const calculateClusterInsights = () => {
  const clusterData: Record<BehavioralCluster, { students: string[]; conceptStruggles: Record<string, number> }> = {
    'high-replay': { students: [], conceptStruggles: {} },
    'fast-watcher': { students: [], conceptStruggles: {} },
    'note-taker': { students: [], conceptStruggles: {} },
    'late-night-learner': { students: [], conceptStruggles: {} },
    'steady-pacer': { students: [], conceptStruggles: {} },
  };

  mockEmployees.forEach(employee => {
    if (employee.cluster) {
      clusterData[employee.cluster].students.push(employee.id);
    }
  });

  mockEvents.forEach(event => {
    const employee = mockEmployees.find(e => e.id === event.userId);
    if (employee?.cluster && event.conceptId && (event.eventType === 'replay' || event.eventType === 'drop-off')) {
      if (!clusterData[employee.cluster].conceptStruggles[event.conceptId]) {
        clusterData[employee.cluster].conceptStruggles[event.conceptId] = 0;
      }
      clusterData[employee.cluster].conceptStruggles[event.conceptId]++;
    }
  });

  return Object.entries(clusterData).map(([cluster, data]) => {
    const topStruggles = Object.entries(data.conceptStruggles)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([conceptId]) => mockConcepts.find(c => c.id === conceptId)?.name || conceptId);

    return {
      cluster: cluster as BehavioralCluster,
      employeeCount: data.students.length,
      strugglingConcepts: topStruggles,
      avgEngagement: Math.random() * 40 + 60,
    };
  });
};

// Backward compatibility aliases (deprecated - use new names)
export const mockCourses = mockTrainingPrograms;
export const mockLectures = mockTrainingSessions;
export const mockStudents = mockEmployees;
export const transformInstructorLectures = transformTrainerTrainingSessions;
export const enrichLecturesWithMockData = enrichTrainingSessionsWithMockData;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Sign up
export const signup = async (email: string, password: string, role: 'employee' | 'trainer') => {
  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, role }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to sign up');
    }

    return await response.json();
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

// Sign in
export const signin = async (email: string, password: string, role: 'employee' | 'trainer') => {
  try {
    const response = await fetch(`${API_URL}/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, role }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to sign in');
    }

    return await response.json();
  } catch (error) {
    console.error('Signin error:', error);
    throw error;
  }
};

// Track rewind event
export const trackRewindEvent = async (
  userId: string,
  pseudonymId: string,
  trainingSessionId: string,
  trainingSessionTitle: string,
  trainingProgramId: string,
  rewindEvent: {
    id: string;
    fromTime: number;
    toTime: number;
    rewindAmount: number;
    fromConceptId?: string;
    fromConceptName?: string;
    toConceptId?: string;
    toConceptName?: string;
    timestamp: number;
    createdAt: Date;
  }
) => {
  try {
    const response = await fetch(`${API_URL}/analytics/rewind`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        pseudonymId,
        trainingSessionId,
        trainingSessionTitle,
        trainingProgramId,
        rewindEvent,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to track rewind event');
    }

    return await response.json();
  } catch (error) {
    console.error('Error tracking rewind event:', error);
    throw error;
  }
};

// Track login/signup event
export const trackLoginEvent = async (
  userId: string,
  pseudonymId: string,
  role: 'employee' | 'trainer',
  action: 'signin' | 'signup'
) => {
  try {
    const response = await fetch(`${API_URL}/logins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        pseudonymId,
        role,
        action,
        // Note: IP address and user agent would typically be captured server-side
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to track login event');
    }

    return await response.json();
  } catch (error) {
    console.error('Error tracking login event:', error);
    throw error;
  }
};

// Get trainer training programs and training sessions
export const getTrainerTrainingSessions = async (trainerId: string) => {
  try {
    const response = await fetch(`${API_URL}/courses/trainer/${trainerId}/training-sessions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // No training programs found, return empty data
        return { success: true, data: { trainingSessions: [], trainingPrograms: [] } };
      }
      throw new Error('Failed to fetch trainer training sessions');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching trainer training sessions:', error);
    throw error;
  }
};

// Create a new training program
export const createTrainingProgram = async (trainingProgramId: string, trainingProgramName: string, trainerId: string) => {
  try {
    const response = await fetch(`${API_URL}/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trainingProgramId,
        trainingProgramName,
        trainerId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create training program');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating training program:', error);
    throw error;
  }
};

// Get all training programs for a trainer
export const getTrainerTrainingPrograms = async (trainerId: string) => {
  try {
    const response = await fetch(`${API_URL}/courses/trainer/${trainerId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { success: true, data: [] };
      }
      throw new Error('Failed to fetch training programs');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching training programs:', error);
    throw error;
  }
};

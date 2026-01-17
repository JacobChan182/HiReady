import { useAuth } from '@/contexts/AuthContext';
import Login from './Login';
import StudentDashboard from './StudentDashboard';
import InstructorDashboard from './InstructorDashboard';

const Index = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Login />;
  }

  if (user.role === 'trainer') {
    return <InstructorDashboard />;
  }

  return <StudentDashboard />;
};

export default Index;

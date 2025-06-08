import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Intro() {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-navigate to main page after 3 seconds
    const timer = setTimeout(() => {
      navigate('/');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="fixed inset-0 w-full h-full">
      <img
        src="/asbhive-logo.jpeg"
        alt="ASB Hive Intro"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Welcome to ASB Alumni Network
          </h1>
          <p className="text-xl md:text-2xl text-white/90">
            Connecting alumni, building futures
          </p>
        </div>
      </div>
    </div>
  );
} 
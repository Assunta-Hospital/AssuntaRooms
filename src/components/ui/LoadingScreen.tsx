import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  isOpen: boolean;
  message?: string;
}

export const LoadingScreen = ({
  isOpen,
  message = "Loading"
}: LoadingScreenProps) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setDots('');
      return;
    }

    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 300);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 transform transition-all duration-200 scale-100 hover:scale-[1.02]">
        <div className="flex items-center space-x-3">
          <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>

          <span className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            {message}
            <span className="inline-block min-w-[1.5rem]">
              {dots}
              <span className="invisible">.</span>
            </span>
          </span>
        </div>
      </div>
    </div>
  );

};

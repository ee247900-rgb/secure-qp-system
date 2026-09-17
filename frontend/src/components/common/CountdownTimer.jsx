import React, { useState, useEffect } from 'react';

const CountdownTimer = ({ targetTime }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetTime).getTime() - new Date().getTime();
      
      if (difference <= 0) {
        return { text: "00:00:00", urgent: false, ended: true };
      }

      const hours = Math.floor((difference / (1000 * 60 * 60)));
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      
      const formatted = [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0')
      ].join(':');

      return {
        text: formatted,
        urgent: difference < 5 * 60 * 1000 // Less than 5 minutes
      };
    };

    const update = () => {
      const { text, urgent, ended } = calculateTimeLeft();
      setTimeLeft(text);
      setIsUrgent(urgent);
      if (ended) clearInterval(timer);
    };

    update();
    const timer = setInterval(update, 1000);
    
    return () => clearInterval(timer);
  }, [targetTime]);

  return (
    <div className={`countdown ${isUrgent ? 'text-danger animate-pulse' : ''}`}>
      {timeLeft}
    </div>
  );
};

export default CountdownTimer;

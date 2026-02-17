
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

type PomodoroMode = 'work' | 'shortBreak' | 'longBreak';

const TIMER_SETTINGS = {
    work: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
};

export const usePomodoro = () => {
    const [mode, setMode] = useState<PomodoroMode>('work');
    const [timeLeft, setTimeLeft] = useState(TIMER_SETTINGS.work);
    const [isActive, setIsActive] = useState(false);

    // Ref to track end time for persistence logic
    const expectedEndTimeRef = useRef<number | null>(null);

    // Load state from local storage on mount
    useEffect(() => {
        const savedMode = localStorage.getItem('pomodoro_mode') as PomodoroMode | null;
        const savedTimeLeft = localStorage.getItem('pomodoro_timeLeft');
        const savedIsActive = localStorage.getItem('pomodoro_isActive') === 'true';
        const savedExpectedEndTime = localStorage.getItem('pomodoro_expectedEndTime');

        if (savedMode) setMode(savedMode);

        if (savedIsActive && savedExpectedEndTime) {
            // Timer was running, calculate remaining time
            const now = Date.now();
            const expected = parseInt(savedExpectedEndTime, 10);
            const remaining = Math.max(0, Math.floor((expected - now) / 1000));

            setTimeLeft(remaining);
            setIsActive(true); // Continue running
            expectedEndTimeRef.current = expected;

            if (remaining === 0) {
                // It finished while away
                setIsActive(false);
                handleTimerComplete();
            }
        } else if (savedTimeLeft) {
            // Timer was paused
            setTimeLeft(parseInt(savedTimeLeft, 10));
            setIsActive(false);
        }
    }, []);

    // Save state to local storage whenever it changes
    useEffect(() => {
        localStorage.setItem('pomodoro_mode', mode);
        localStorage.setItem('pomodoro_timeLeft', timeLeft.toString());
        localStorage.setItem('pomodoro_isActive', isActive.toString());

        if (isActive && expectedEndTimeRef.current) {
            localStorage.setItem('pomodoro_expectedEndTime', expectedEndTimeRef.current.toString());
        } else {
            localStorage.removeItem('pomodoro_expectedEndTime');
        }
    }, [mode, timeLeft, isActive]);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isActive && timeLeft > 0) {
            // If we don't have an expected end time, set it (start/resume)
            if (!expectedEndTimeRef.current) {
                expectedEndTimeRef.current = Date.now() + timeLeft * 1000;
            }

            interval = setInterval(() => {
                setTimeLeft((time) => {
                    // Sync with wall clock to prevent drift and handle background throttling
                    const now = Date.now();
                    if (expectedEndTimeRef.current) {
                        const remaining = Math.max(0, Math.floor((expectedEndTimeRef.current - now) / 1000));
                        if (remaining === 0) {
                            handleTimerComplete();
                            return 0;
                        }
                        return remaining;
                    }
                    return time - 1;
                });
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            expectedEndTimeRef.current = null;
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, timeLeft]); // Dependent on timeLeft to catch 0

    const handleTimerComplete = () => {
        setIsActive(false);
        expectedEndTimeRef.current = null;
        toast.success('Pomodoro complete!', {
            description: mode === 'work' ? 'Time for a break.' : 'Back to work!',
        });
        // Play sound? (Future)
    };

    const toggleTimer = () => {
        if (!isActive) {
            // Starting or Resuming
            // Determine expected end time based on current timeLeft
            expectedEndTimeRef.current = Date.now() + timeLeft * 1000;
            setIsActive(true);
        } else {
            // Pausing
            expectedEndTimeRef.current = null;
            setIsActive(false);
        }
    };

    const resetTimer = () => {
        setIsActive(false);
        expectedEndTimeRef.current = null;
        setTimeLeft(TIMER_SETTINGS[mode]);
    };

    const switchMode = (newMode: PomodoroMode) => {
        setMode(newMode);
        setIsActive(false);
        expectedEndTimeRef.current = null;
        setTimeLeft(TIMER_SETTINGS[newMode]);
    };

    return {
        mode,
        timeLeft,
        isActive,
        toggleTimer,
        resetTimer,
        switchMode,
    };
};

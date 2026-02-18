
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

const DEFAULT_DURATION_SECONDS = 10 * 60;
const SETTINGS_STORAGE_KEY = 'pomodoro_settings';
const MIN_DURATION_SECONDS = 60;
const MAX_DURATION_SECONDS = 24 * 60 * 60;

const getDurationSeconds = (value: unknown, fallback: number) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
    return Math.min(MAX_DURATION_SECONDS, Math.max(MIN_DURATION_SECONDS, Math.floor(value)));
};

const parseDuration = (rawSettings: string | null): number => {
    if (!rawSettings) return DEFAULT_DURATION_SECONDS;

    try {
        const parsed = JSON.parse(rawSettings) as unknown;

        if (typeof parsed === 'number') {
            return getDurationSeconds(parsed, DEFAULT_DURATION_SECONDS);
        }

        if (parsed && typeof parsed === 'object') {
            const legacy = parsed as Partial<Record<'break' | 'work', number>>;
            return getDurationSeconds(legacy.break ?? legacy.work, DEFAULT_DURATION_SECONDS);
        }
    } catch {
        return DEFAULT_DURATION_SECONDS;
    }

    return DEFAULT_DURATION_SECONDS;
};

export const usePomodoro = () => {
    const [durationSeconds, setDurationSeconds] = useState(DEFAULT_DURATION_SECONDS);
    const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATION_SECONDS);
    const [isActive, setIsActive] = useState(false);

    // Ref to track end time for persistence logic
    const expectedEndTimeRef = useRef<number | null>(null);

    // Load state from local storage on mount
    useEffect(() => {
        const savedDuration = parseDuration(localStorage.getItem(SETTINGS_STORAGE_KEY));
        setDurationSeconds(savedDuration);
        const savedTimeLeft = localStorage.getItem('pomodoro_timeLeft');
        const savedIsActive = localStorage.getItem('pomodoro_isActive') === 'true';
        const savedExpectedEndTime = localStorage.getItem('pomodoro_expectedEndTime');

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
            const parsedTimeLeft = parseInt(savedTimeLeft, 10);
            setTimeLeft(Number.isFinite(parsedTimeLeft) ? Math.max(0, parsedTimeLeft) : savedDuration);
            setIsActive(false);
        } else {
            setTimeLeft(savedDuration);
        }
    }, []);

    // Save preferred duration for future sessions
    useEffect(() => {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ break: durationSeconds }));
    }, [durationSeconds]);

    // Save state to local storage whenever it changes
    useEffect(() => {
        localStorage.setItem('pomodoro_timeLeft', timeLeft.toString());
        localStorage.setItem('pomodoro_isActive', isActive.toString());

        if (isActive && expectedEndTimeRef.current) {
            localStorage.setItem('pomodoro_expectedEndTime', expectedEndTimeRef.current.toString());
        } else {
            localStorage.removeItem('pomodoro_expectedEndTime');
        }
    }, [timeLeft, isActive]);

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
        toast.success('Break complete!', {
            description: 'Reset when you are ready for the next break.',
        });
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
        setTimeLeft(durationSeconds);
    };

    const setDuration = (nextDurationSeconds: number) => {
        const normalizedDuration = getDurationSeconds(nextDurationSeconds, durationSeconds);
        setDurationSeconds(normalizedDuration);
        setIsActive(false);
        expectedEndTimeRef.current = null;
        setTimeLeft(normalizedDuration);
    };

    return {
        timeLeft,
        durationSeconds,
        isActive,
        toggleTimer,
        resetTimer,
        setDuration,
    };
};

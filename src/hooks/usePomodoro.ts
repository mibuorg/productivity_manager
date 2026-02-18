
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

type PomodoroMode = 'work' | 'shortBreak' | 'longBreak';
type PomodoroSettings = Record<PomodoroMode, number>;

const DEFAULT_TIMER_SETTINGS: PomodoroSettings = {
    work: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
};

const SETTINGS_STORAGE_KEY = 'pomodoro_settings';
const MIN_DURATION_SECONDS = 60;
const MAX_DURATION_SECONDS = 24 * 60 * 60;

const getDurationSeconds = (value: unknown, fallback: number) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
    return Math.min(MAX_DURATION_SECONDS, Math.max(MIN_DURATION_SECONDS, Math.floor(value)));
};

const parseSettings = (rawSettings: string | null): PomodoroSettings => {
    if (!rawSettings) return DEFAULT_TIMER_SETTINGS;

    try {
        const parsed = JSON.parse(rawSettings) as Partial<Record<PomodoroMode, number>>;
        return {
            work: getDurationSeconds(parsed.work, DEFAULT_TIMER_SETTINGS.work),
            shortBreak: getDurationSeconds(parsed.shortBreak, DEFAULT_TIMER_SETTINGS.shortBreak),
            longBreak: getDurationSeconds(parsed.longBreak, DEFAULT_TIMER_SETTINGS.longBreak),
        };
    } catch {
        return DEFAULT_TIMER_SETTINGS;
    }
};

export const usePomodoro = () => {
    const [mode, setMode] = useState<PomodoroMode>('work');
    const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_TIMER_SETTINGS);
    const [timeLeft, setTimeLeft] = useState(DEFAULT_TIMER_SETTINGS.work);
    const [isActive, setIsActive] = useState(false);

    // Ref to track end time for persistence logic
    const expectedEndTimeRef = useRef<number | null>(null);

    // Load state from local storage on mount
    useEffect(() => {
        const savedSettings = parseSettings(localStorage.getItem(SETTINGS_STORAGE_KEY));
        setSettings(savedSettings);

        const savedMode = localStorage.getItem('pomodoro_mode') as PomodoroMode | null;
        const savedTimeLeft = localStorage.getItem('pomodoro_timeLeft');
        const savedIsActive = localStorage.getItem('pomodoro_isActive') === 'true';
        const savedExpectedEndTime = localStorage.getItem('pomodoro_expectedEndTime');

        const initialMode = savedMode ?? 'work';
        setMode(initialMode);

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
            setTimeLeft(Number.isFinite(parsedTimeLeft) ? Math.max(0, parsedTimeLeft) : savedSettings[initialMode]);
            setIsActive(false);
        } else {
            setTimeLeft(savedSettings[initialMode]);
        }
    }, []);

    // Save mode duration settings for future sessions
    useEffect(() => {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    }, [settings]);

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
        setTimeLeft(settings[mode]);
    };

    const switchMode = (newMode: PomodoroMode) => {
        setMode(newMode);
        setIsActive(false);
        expectedEndTimeRef.current = null;
        setTimeLeft(settings[newMode]);
    };

    const setModeDuration = (targetMode: PomodoroMode, durationSeconds: number) => {
        const normalizedDuration = getDurationSeconds(durationSeconds, settings[targetMode]);

        setSettings((previousSettings) => ({
            ...previousSettings,
            [targetMode]: normalizedDuration,
        }));

        if (targetMode === mode) {
            setIsActive(false);
            expectedEndTimeRef.current = null;
            setTimeLeft(normalizedDuration);
        }
    };

    return {
        mode,
        timeLeft,
        settings,
        isActive,
        toggleTimer,
        resetTimer,
        switchMode,
        setModeDuration,
    };
};

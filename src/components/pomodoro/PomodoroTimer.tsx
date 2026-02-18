
import { KeyboardEvent, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { usePomodoro } from '@/hooks/usePomodoro';

export const PomodoroTimer = () => {
    const { durationSeconds, timeLeft, isActive, toggleTimer, resetTimer, setDuration } = usePomodoro();
    const [isEditingDuration, setIsEditingDuration] = useState(false);
    const [durationInput, setDurationInput] = useState('');

    const activeModeMinutes = useMemo(() => Math.max(1, Math.round(durationSeconds / 60)), [durationSeconds]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Update document title with timer
    useEffect(() => {
        document.title = `${formatTime(timeLeft)} - Break | Ethan's Productivity Manager`;
        return () => {
            document.title = "Ethan's Productivity Manager";
        };
    }, [timeLeft]);

    const saveDuration = () => {
        const parsedMinutes = Number.parseInt(durationInput, 10);
        if (!Number.isFinite(parsedMinutes) || parsedMinutes < 1) {
            setDurationInput(activeModeMinutes.toString());
            setIsEditingDuration(false);
            return;
        }

        setDuration(parsedMinutes * 60);
        setIsEditingDuration(false);
    };

    const handleDurationKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            saveDuration();
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            setDurationInput(activeModeMinutes.toString());
            setIsEditingDuration(false);
        }
    };

    const startDurationEdit = () => {
        setDurationInput(activeModeMinutes.toString());
        setIsEditingDuration(true);
    };

    return (
        <Card className="w-full max-w-sm mx-auto shadow-lg border-2 border-primary/10">
            <CardHeader className="pb-2">
                <CardTitle className="w-full text-center">
                    <div
                        data-testid="pomodoro-break-header"
                        className="inline-flex items-center rounded-xl border border-border/70 bg-muted/40 px-4 py-1.5 text-sm font-semibold tracking-wide"
                    >
                        Break
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 p-6">
                <motion.div
                    className="w-full text-center"
                    animate={{ scale: isActive ? [1, 1.02, 1] : 1 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'easeInOut', repeatType: 'reverse' }}
                >
                    {!isEditingDuration && (
                        <button
                            type="button"
                            aria-label="Edit Break duration"
                            onClick={startDurationEdit}
                            className="text-7xl font-bold tracking-tighter tabular-nums leading-none hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md px-2 py-1"
                        >
                            {formatTime(timeLeft)}
                        </button>
                    )}

                    {isEditingDuration && (
                        <div className="mx-auto flex max-w-[12rem] items-center justify-center gap-2">
                            <label htmlFor="pomodoro-duration-input" className="sr-only">
                                Break minutes
                            </label>
                            <Input
                                id="pomodoro-duration-input"
                                aria-label="Break minutes"
                                value={durationInput}
                                onChange={(event) => setDurationInput(event.target.value)}
                                onBlur={saveDuration}
                                onKeyDown={handleDurationKeyDown}
                                className="h-14 text-center text-3xl font-semibold tabular-nums"
                                inputMode="numeric"
                                autoFocus
                            />
                            <span className="text-sm text-muted-foreground">min</span>
                        </div>
                    )}
                </motion.div>

                <div className="flex items-center gap-4">
                    <Button
                        size="icon"
                        className="h-12 w-12 rounded-full"
                        onClick={toggleTimer}
                    >
                        {isActive ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
                    </Button>
                    <Button
                        size="icon"
                        variant="outline"
                        className="h-12 w-12 rounded-full"
                        onClick={resetTimer}
                    >
                        <RotateCcw className="h-5 w-5" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

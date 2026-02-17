
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePomodoro } from '@/hooks/usePomodoro';

export const PomodoroTimer = () => {
    const { mode, timeLeft, isActive, toggleTimer, resetTimer, switchMode } = usePomodoro();

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Update document title with timer
    useEffect(() => {
        document.title = `${formatTime(timeLeft)} - ${mode === 'work' ? 'Focus' : 'Break'} | Ethan's Productivity Manager`;
        return () => {
            document.title = "Ethan's Productivity Manager";
        };
    }, [timeLeft, mode]);

    return (
        <Card className="w-full max-w-sm mx-auto shadow-lg border-2 border-primary/10">
            <CardHeader className="pb-2">
                <CardTitle className="text-center flex justify-center gap-2">
                    <Button
                        variant={mode === 'work' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => switchMode('work')}
                        className="rounded-full"
                    >
                        Focus
                    </Button>
                    <Button
                        variant={mode === 'shortBreak' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => switchMode('shortBreak')}
                        className="rounded-full"
                    >
                        Short Break
                    </Button>
                    <Button
                        variant={mode === 'longBreak' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => switchMode('longBreak')}
                        className="rounded-full"
                    >
                        Long Break
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 p-6">
                <motion.div
                    className="text-7xl font-bold tracking-tighter tabular-nums"
                    animate={{ scale: isActive ? [1, 1.02, 1] : 1 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'easeInOut', repeatType: 'reverse' }}
                >
                    {formatTime(timeLeft)}
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

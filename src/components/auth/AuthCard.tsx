import { useState } from 'react';
import { KeyRound, LogIn, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';

type AuthMode = 'signin' | 'signup';

interface AuthCardProps {
  onSuccess?: () => void;
}

export function AuthCard({ onSuccess }: AuthCardProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsSubmitting(true);
    try {
      if (mode === 'signin') {
        const { error } = await signIn(email.trim(), password);
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success('Signed in');
        onSuccess?.();
        return;
      }

      const { error, session } = await signUp(email.trim(), password);
      if (error) {
        toast.error(error.message);
        return;
      }

      if (session) {
        toast.success('Account created and signed in');
        onSuccess?.();
      } else {
        toast.success('Account created. Check your email to confirm sign-in.');
        setMode('signin');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-card/95 border-border shadow-2xl">
      <CardHeader>
        <CardTitle className="text-xl">Sign in</CardTitle>
        <CardDescription>Use your account to access your personal board data.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Button
            type="button"
            variant={mode === 'signin' ? 'default' : 'outline'}
            onClick={() => setMode('signin')}
            className="w-full"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Sign In
          </Button>
          <Button
            type="button"
            variant={mode === 'signup' ? 'default' : 'outline'}
            onClick={() => setMode('signup')}
            className="w-full"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Sign Up
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="auth-email">Email</Label>
            <Input
              id="auth-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="auth-password">Password</Label>
            <Input
              id="auth-password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            <KeyRound className="h-4 w-4 mr-2" />
            {isSubmitting
              ? 'Please wait...'
              : mode === 'signin'
                ? 'Continue to dashboard'
                : 'Create account'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

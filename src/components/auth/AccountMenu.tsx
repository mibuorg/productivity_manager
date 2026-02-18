import { useState } from 'react';
import { CircleUserRound, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AuthCard } from '@/components/auth/AuthCard';
import { useAuth } from '@/hooks/useAuth';

export function AccountMenu() {
  const { user, signOut } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Signed out');
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" aria-label="Account" className="gap-2">
            <CircleUserRound className="h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {user ? (
            <>
              <DropdownMenuLabel className="truncate">{user.email || 'Signed in user'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => void handleSignOut()}>
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem onClick={() => setAuthDialogOpen(true)}>
              Log in / Sign up
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
        <DialogContent className="border-border bg-background/95 p-0 max-w-md">
          <DialogHeader className="sr-only">
            <DialogTitle>Sign in</DialogTitle>
            <DialogDescription>Authenticate to access your personal task board.</DialogDescription>
          </DialogHeader>
          <AuthCard onSuccess={() => setAuthDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useAuth } from '@/contexts/AuthContext';
import { BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Login = () => {
  const auth = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 mb-6">
            <BarChart3 className="w-8 h-8 text-foreground" />
            <span className="text-2xl font-bold text-foreground tracking-tight" style={{ fontFamily: "'Newsreader', serif" }}>
              DevPulse
            </span>
          </div>
          <h1 className="text-xl font-semibold text-foreground" style={{ fontFamily: "'Newsreader', serif" }}>
            Sign in to your account
          </h1>
          <p className="text-sm text-muted-foreground">
            Connect your GitHub account to get started
          </p>
        </div>

        <Button
          onClick={() => auth.signinRedirect()}
          className="w-full gap-2 h-11 text-sm font-medium"
        >
          Sign In
        </Button>

        <p className="text-xs text-muted-foreground">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default Login;

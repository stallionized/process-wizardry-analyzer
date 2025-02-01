import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionContext } from '@supabase/auth-helpers-react';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Auth = () => {
  const navigate = useNavigate();
  const { session } = useSessionContext();
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (session) {
      navigate('/project');
    }
  }, [session, navigate]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/project');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Please sign in to your account
          </p>
        </div>

        {errorMessage && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
            {errorMessage}
          </div>
        )}

        <div className="bg-card text-card-foreground rounded-lg border shadow-sm p-6">
          <SupabaseAuth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'rgb(var(--primary))',
                    brandAccent: 'rgb(var(--primary))',
                  },
                },
              },
              style: {
                button: {
                  fontWeight: '500',
                  padding: '8px 16px',
                },
                anchor: {
                  color: 'rgb(var(--primary))',
                },
                container: {
                  gap: '16px',
                },
              },
            }}
            providers={[]}
            redirectTo={`${window.location.origin}/project`}
          />
        </div>
      </div>
    </div>
  );
};

export default Auth;
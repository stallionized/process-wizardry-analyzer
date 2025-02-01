import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useSessionContext } from '@supabase/auth-helpers-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const navigate = useNavigate();
  const { session } = useSessionContext();
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [errorHandled, setErrorHandled] = useState(false);

  // Redirect to projects if already authenticated
  useEffect(() => {
    if (session) {
      navigate('/projects');
    }
  }, [session, navigate]);

  useEffect(() => {
    const setupAuthListener = () => {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setErrorMessage("");
          navigate('/projects');
        }
      });

      return data.subscription;
    };

    const subscription = setupAuthListener();
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // If already authenticated, don't render anything as we're redirecting
  if (session) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="container max-w-md mx-auto py-12 px-4">
        <Link to="/" className="inline-block mb-8">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <img 
              src="/lovable-uploads/65f145b4-d285-4d16-992f-427268f4862c.png" 
              alt="ProcessAI Logo" 
              className="mx-auto h-[165px] w-auto mb-8"
            />
            <p className="text-sm text-muted-foreground">
              Sign in to start learning more about your business.
            </p>
          </div>

          {errorMessage && (
            <Alert variant="destructive" className="animate-in fade-in-50">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <div className="border rounded-lg p-6 bg-card">
            <SupabaseAuth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: '#10B981',
                      brandAccent: '#059669',
                    },
                  },
                },
                className: {
                  container: 'flex flex-col gap-4',
                  button: 'bg-primary text-white hover:bg-primary/90',
                  input: 'bg-background border-input',
                  label: 'text-foreground',
                },
              }}
              providers={[]}
              redirectTo={window.location.origin}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
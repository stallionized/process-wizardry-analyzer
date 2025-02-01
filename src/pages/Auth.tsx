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

  // Primary redirect based on session
  useEffect(() => {
    if (session) {
      navigate('/dashboard', { replace: true });
    }
  }, [session, navigate]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (event === 'SIGNED_IN' && currentSession) {
        setErrorMessage("");
        navigate('/dashboard', { replace: true });
      } else if (event === 'SIGNED_OUT') {
        if (errorHandled) return;
        
        const params = new URLSearchParams(window.location.search);
        const error = params.get('error');
        const errorDescription = params.get('error_description');
        
        if (!error && !errorDescription) {
          setErrorMessage("");
          return;
        }
        
        setErrorHandled(true);
        
        setTimeout(() => {
          switch (error) {
            case 'invalid_grant':
            case 'invalid_credentials':
              setErrorMessage('Invalid email or password. Please check your credentials and try again.');
              break;
            case 'refresh_token_not_found':
              setErrorMessage('Your session has expired. Please sign in again.');
              break;
            default:
              if (errorDescription) {
                setErrorMessage('An error occurred during sign in. Please try again.');
              }
              break;
          }
          
          setTimeout(() => {
            setErrorHandled(false);
          }, 2000);
        }, 1000);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, errorHandled]);

  return (
    <div className="container max-w-md mx-auto py-12">
      <Link to="/" className="inline-block mb-8">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
      </Link>

      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <img 
            src="/lovable-uploads/2874dd12-8a6e-4615-a3a8-0007e6b68381.png" 
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
            }}
            providers={[]}
            redirectTo={`${window.location.origin}/dashboard`}
          />
        </div>
      </div>
    </div>
  );
};

export default Auth;
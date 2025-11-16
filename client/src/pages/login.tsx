import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [isDevMode, setIsDevMode] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if we're in dev mode (handle both 200 and 401 responses)
    fetch('/api/auth/user')
      .then(async res => {
        // Parse JSON regardless of status code
        const data = await res.json();
        
        // Dev mode: devMode=true and no user
        if (data.devMode === true && data.user === null) {
          setIsDevMode(true);
        } else {
          // Production mode or already authenticated
          setIsDevMode(false);
        }
      })
      .catch(() => {
        // Network error - assume production mode
        setIsDevMode(false);
      });
  }, []);

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  const handleDevLogin = async () => {
    if (isLoggingIn) return;
    
    setIsLoggingIn(true);
    try {
      await apiRequest('POST', '/api/auth/dev-login');
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      window.location.href = '/';
    } catch (error) {
      setIsLoggingIn(false);
      console.error('Dev login error:', error);
      toast({
        title: "로그인 실패",
        description: "개발 모드 로그인에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Venture Square</CardTitle>
          <CardDescription className="text-lg">
            광고 관리 시스템
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDevMode ? (
            <div className="text-center space-y-4">
              <div className="text-sm text-muted-foreground">
                <p className="font-semibold text-foreground mb-2">개발 모드</p>
                <p>Google OAuth가 설정되지 않았습니다.</p>
                <p className="mt-1">자동 로그인으로 시스템을 테스트하세요.</p>
              </div>
              <Button
                onClick={handleDevLogin}
                disabled={isLoggingIn}
                className="w-full"
                size="lg"
                data-testid="button-dev-login"
              >
                {isLoggingIn ? "로그인 중..." : "개발 모드로 로그인"}
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center text-sm text-muted-foreground">
                벤처스퀘어 계정으로 로그인하세요
              </div>
              
              <Button
                onClick={handleGoogleLogin}
                className="w-full"
                size="lg"
                data-testid="button-google-login"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google로 로그인
              </Button>

              <div className="mt-6 text-center text-xs text-muted-foreground">
                <p>관리자 계정만 로그인할 수 있습니다.</p>
                <p className="mt-1">
                  mse@venturesquare.net 또는 rosie@venturesquare.net
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

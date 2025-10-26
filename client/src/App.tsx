import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { initGA } from "./lib/analytics";
import { useAnalytics } from "./hooks/use-analytics";
import { useAuth } from "./hooks/useAuth";
import { useToast } from "./hooks/use-toast";
import { Button } from "./components/ui/button";
import { LogOut } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "./lib/queryClient";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Advertisers from "@/pages/advertisers";
import AdvertiserDetail from "@/pages/advertiser-detail";
import Ads from "@/pages/ads";
import AdDetail from "@/pages/ad-detail";
import AdSlots from "@/pages/ad-slots-detailed";
import Inquiry from "@/pages/inquiry";
import Quotes from "@/pages/quotes";
import Materials from "@/pages/materials";
import Settings from "@/pages/settings";
import Analytics from "@/pages/analytics";
import Login from "@/pages/login";
import Verify from "@/pages/verify";

function PublicRouter() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/verify" component={Verify} />
      <Route path="/" component={Login} />
      <Route component={Login} />
    </Switch>
  );
}

function ProtectedRouter() {
  useAnalytics();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "로그아웃 완료",
        description: "성공적으로 로그아웃되었습니다.",
      });
      // Force reload to clear all state and redirect to login
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    },
  });

  return (
    <>
      <header className="flex items-center justify-between p-4 border-b bg-background">
        <SidebarTrigger data-testid="button-sidebar-toggle" />
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-6 bg-background">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/ads/:id" component={AdDetail} />
          <Route path="/ads" component={Ads} />
          <Route path="/advertisers/:id" component={AdvertiserDetail} />
          <Route path="/advertisers" component={Advertisers} />
          <Route path="/ad-slots" component={AdSlots} />
          <Route path="/quotes" component={Quotes} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/materials" component={Materials} />
          <Route path="/settings" component={Settings} />
          <Route path="/inquiry" component={Inquiry} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  useEffect(() => {
    if (!import.meta.env.VITE_GA_MEASUREMENT_ID) {
      console.warn('Google Analytics Measurement ID not configured');
    } else {
      initGA();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent style={style as React.CSSProperties} />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function AppContent({ style }: { style: React.CSSProperties }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  if (location === "/verify") {
    return <Verify />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PublicRouter />;
  }

  return (
    <SidebarProvider style={style}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <ProtectedRouter />
        </div>
      </div>
    </SidebarProvider>
  );
}

export default App;

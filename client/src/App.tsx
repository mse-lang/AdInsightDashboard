import { Switch, Route } from "wouter";
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
import { Button } from "./components/ui/button";
import { LogOut } from "lucide-react";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Advertisers from "@/pages/advertisers";
import AdvertisersAirtable from "@/pages/advertisers-airtable";
import AdvertiserDetail from "@/pages/advertiser-detail";
import Ads from "@/pages/ads";
import AdDetail from "@/pages/ad-detail";
import AdSlots from "@/pages/ad-slots-detailed";
import Inquiry from "@/pages/inquiry";
import Quotes from "@/pages/quotes";
import QuotesAirtable from "@/pages/quotes-airtable";
import Invoices from "@/pages/invoices";
import Campaigns from "@/pages/campaigns";
import Agencies from "@/pages/agencies";
import AdCalendar from "@/pages/calendar";
import Materials from "@/pages/materials";
import Settings from "@/pages/settings";
import Analytics from "@/pages/analytics";
import Inquiries from "@/pages/inquiries";
import Login from "@/pages/login";

function PublicRouter() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={Login} />
      <Route component={Login} />
    </Switch>
  );
}

function MainRouter() {
  useAnalytics();
  const { user, logout, isDevMode } = useAuth();

  return (
    <>
      <header className="flex items-center justify-between p-4 border-b bg-background">
        <SidebarTrigger data-testid="button-sidebar-toggle" />
        <div className="flex items-center gap-4">
          {isDevMode && (
            <div className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 px-2 py-1 rounded">
              Dev Mode
            </div>
          )}
          <span className="text-sm text-muted-foreground">
            {user?.name || user?.email || '벤처스퀘어 광고 관리'}
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={logout}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            로그아웃
          </Button>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-6 bg-background">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/ads/:id" component={AdDetail} />
          <Route path="/ads" component={Ads} />
          <Route path="/advertisers-airtable" component={AdvertisersAirtable} />
          <Route path="/advertisers/:id" component={AdvertiserDetail} />
          <Route path="/advertisers" component={Advertisers} />
          <Route path="/ad-slots" component={AdSlots} />
          <Route path="/quotes-airtable" component={QuotesAirtable} />
          <Route path="/quotes" component={Quotes} />
          <Route path="/invoices" component={Invoices} />
          <Route path="/campaigns" component={Campaigns} />
          <Route path="/agencies" component={Agencies} />
          <Route path="/calendar" component={AdCalendar} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/materials" component={Materials} />
          <Route path="/settings" component={Settings} />
          <Route path="/inquiries" component={Inquiries} />
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

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-lg font-semibold">Loading...</div>
          <div className="text-sm text-muted-foreground mt-2">잠시만 기다려주세요</div>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <PublicRouter />;
  }

  // Show main app if authenticated
  return (
    <SidebarProvider style={style}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <MainRouter />
        </div>
      </div>
    </SidebarProvider>
  );
}

export default App;

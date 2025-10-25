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
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Advertisers from "@/pages/advertisers";
import AdvertiserDetail from "@/pages/advertiser-detail";
import Ads from "@/pages/ads";
import AdSlots from "@/pages/ad-slots-detailed";
import Inquiry from "@/pages/inquiry";
import Quotes from "@/pages/quotes";
import Materials from "@/pages/materials";
import Settings from "@/pages/settings";
import Analytics from "@/pages/analytics";

function Router() {
  useAnalytics();
  
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/ads" component={Ads} />
      <Route path="/advertisers" component={Advertisers} />
      <Route path="/advertisers/:id" component={AdvertiserDetail} />
      <Route path="/ad-slots" component={AdSlots} />
      <Route path="/quotes" component={Quotes} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/materials" component={Materials} />
      <Route path="/settings" component={Settings} />
      <Route path="/inquiry" component={Inquiry} />
      <Route component={NotFound} />
    </Switch>
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
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <header className="flex items-center justify-between p-4 border-b bg-background">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">ad@venturesquare.net</span>
                </div>
              </header>
              <main className="flex-1 overflow-auto p-6 bg-background">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

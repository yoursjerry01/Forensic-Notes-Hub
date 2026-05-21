import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Switch, Route, useLocation } from "wouter";

import { Hero } from "./sections/Hero";
import { About } from "./sections/About";
import { Features } from "./sections/Features";
import { Problem } from "./sections/Problem";
import { Incentives } from "./sections/Incentives";
import { Footer } from "./sections/Footer";
import { Navbar } from "./components/Navbar";
import { SubmitSyllabus } from "./pages/SubmitSyllabus";
import { Admin } from "./pages/Admin";
import { trackPageView } from "./lib/analytics";

const queryClient = new QueryClient();

function PageTracker() {
  const [location] = useLocation();
  useEffect(() => {
    trackPageView(location);
  }, [location]);
  return null;
}

function Home() {
  return (
    <div className="min-h-screen w-full flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      <Navbar />
      <Hero />
      <About />
      <Features />
      <Problem />
      <Incentives />
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <PageTracker />
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/submit-syllabus" component={SubmitSyllabus} />
          <Route path="/admin" component={Admin} />
        </Switch>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

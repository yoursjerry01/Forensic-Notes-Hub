import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Switch, Route } from "wouter";

import { Hero } from "./sections/Hero";
import { About } from "./sections/About";
import { Features } from "./sections/Features";
import { Problem } from "./sections/Problem";
import { Incentives } from "./sections/Incentives";
import { Footer } from "./sections/Footer";
import { SubmitSyllabus } from "./pages/SubmitSyllabus";

const queryClient = new QueryClient();

function Home() {
  return (
    <div className="min-h-screen w-full flex flex-col font-sans selection:bg-teal-100 selection:text-teal-900">
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
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/submit-syllabus" component={SubmitSyllabus} />
        </Switch>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

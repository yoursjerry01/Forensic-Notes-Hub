import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Hero } from "./sections/Hero";
import { About } from "./sections/About";
import { Features } from "./sections/Features";
import { Problem } from "./sections/Problem";
import { Incentives } from "./sections/Incentives";
import { FinalCTA } from "./sections/FinalCTA";
import { Footer } from "./sections/Footer";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen w-full flex flex-col font-sans selection:bg-teal-100 selection:text-teal-900">
          <Hero />
          <About />
          <Features />
          <Problem />
          <Incentives />
          <FinalCTA />
          <Footer />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

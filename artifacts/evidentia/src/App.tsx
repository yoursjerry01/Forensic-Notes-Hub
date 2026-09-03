import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Switch, Route, useLocation, Redirect } from "wouter";

import { Hero } from "./sections/Hero";
import { About } from "./sections/About";
import { Features } from "./sections/Features";
import { Problem } from "./sections/Problem";
import { Incentives } from "./sections/Incentives";
import { Footer } from "./sections/Footer";
import { Navbar } from "./components/Navbar";
import { Testimonials } from "./sections/Testimonials";

import Orders from "./pages/Orders";
import Downloads from "./pages/Downloads";
import Settings from "./pages/Settings";
import { Checkout } from "./pages/Checkout";
import OrderDetails from "./pages/OrderDetails";

import { SubmitSyllabus } from "./pages/SubmitSyllabus";
import { Notes } from "./pages/Notes";
import { NoteDetails } from "./pages/NoteDetails";
import { Admin } from "./pages/Admin";
import { Cart } from "./pages/Cart";
import StudentDashboard from "./pages/StudentDashboard";

import { Auth } from "./pages/Auth";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { VerifyEmail } from "./pages/VerifyEmail";
import { AuthCallback } from "./pages/AuthCallback";

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
      <Testimonials />
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
          {/* Main website */}
          <Route path="/" component={Home} />
          <Route path="/notes" component={Notes} />
          <Route path="/note/:id" component={NoteDetails} />
          <Route path="/submit-syllabus" component={SubmitSyllabus} />
          <Route path="/admin" component={Admin} />
          <Route path="/cart" component={Cart} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/orders" component={Orders} />
          <Route path="/order/:id" component={OrderDetails} />
          <Route path="/downloads" component={Downloads} />
          <Route path="/dashboard" component={StudentDashboard} />
          <Route path="/settings" component={Settings} />
          {/* Authentication */}
          <Route path="/login">
            <Redirect to="/auth/login" />
          </Route>

          <Route path="/signup">
            <Redirect to="/auth/signup" />
          </Route>

          <Route path="/auth/login">
            <Auth mode="login" />
          </Route>

          <Route path="/auth/signup">
            <Auth mode="signup" />
          </Route>

          {/* Email verification */}
          <Route
            path="/auth/verify"
            component={VerifyEmail}
          />

          {/* Google OAuth callback */}
          <Route
            path="/auth/callback"
            component={AuthCallback}
          />

          {/* Password recovery */}
          <Route
            path="/auth/forgot-password"
            component={ForgotPassword}
          />

          <Route
            path="/auth/reset-password"
            component={ResetPassword}
          />
        </Switch>

        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
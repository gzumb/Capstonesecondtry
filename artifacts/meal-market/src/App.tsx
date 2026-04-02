import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider, ProtectedRoute } from "@/components/auth-context";

import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Listings from "@/pages/listings";
import NewListing from "@/pages/new-listing";
import ListingDetail from "@/pages/listing-detail";
import MyListings from "@/pages/my-listings";
import Messages from "@/pages/messages";
import ChatThread from "@/pages/chat-thread";
import Transactions from "@/pages/transactions";
import Profile from "@/pages/profile";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/listings" component={Listings} />
      <Route path="/listings/new">
        <ProtectedRoute><NewListing /></ProtectedRoute>
      </Route>
      <Route path="/listings/:id" component={ListingDetail} />
      <Route path="/my-listings">
        <ProtectedRoute><MyListings /></ProtectedRoute>
      </Route>
      <Route path="/messages">
        <ProtectedRoute><Messages /></ProtectedRoute>
      </Route>
      <Route path="/messages/:id">
        <ProtectedRoute><ChatThread /></ProtectedRoute>
      </Route>
      <Route path="/transactions">
        <ProtectedRoute><Transactions /></ProtectedRoute>
      </Route>
      <Route path="/profile/:id" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
            <Toaster />
          </AuthProvider>
        </WouterRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
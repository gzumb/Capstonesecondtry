import { Layout } from "@/components/layout";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, MessageSquare, Search, ShieldCheck, Wallet, Zap } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  
  const { data: listings, isLoading: isLoadingListings } = useQuery({
    queryKey: ["listings", search, sortBy],
    queryFn: async () => {
      let query = supabase
        .from("listings")
        .select("*")
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString());

      if (search) {
        query = query.ilike("description", `%${search}%`);
      }

      if (sortBy === "price_low") {
        query = query.order("price_per_point", { ascending: true });
      } else if (sortBy === "price_high") {
        query = query.order("price_per_point", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
  
  const { data: stats } = useQuery({
    queryKey: ["listing-stats"],
    queryFn: async () => {
      const { data: listings, error } = await supabase
        .from("listings")
        .select("points_amount, price_per_point, status");
      
      if (error) throw error;

      const activeListings = listings.filter(l => l.status === "active");
      const totalPoints = activeListings.reduce((sum, l) => sum + l.points_amount, 0);
      const avgPrice = activeListings.length > 0 
        ? activeListings.reduce((sum, l) => sum + Number(l.price_per_point), 0) / activeListings.length 
        : 0;

      return {
        totalActiveListings: activeListings.length,
        totalPointsAvailable: totalPoints,
        avgPricePerPoint: avgPrice,
        totalSchools: 1, // Static for now or fetch from profiles
      };
    },
  });

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground py-20 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80')] opacity-10 mix-blend-overlay bg-cover bg-center" />
        <div className="container mx-auto px-4 sm:px-8 relative z-10 text-center max-w-4xl">
          <Badge variant="outline" className="mb-6 border-accent/50 text-accent bg-accent/10 px-4 py-1.5 text-sm uppercase tracking-wide">
            The Campus Trading Post
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            Turn unused meal points into <span className="text-accent">cash</span>.
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
            Buy and sell cafeteria meal points with other students safely and securely. Stop wasting points at the end of the semester.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 bg-accent text-accent-foreground hover:bg-accent/90 font-bold border-none" asChild>
              <Link href="/listings">
                Browse Points <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-14 px-8 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 hover:text-white" asChild>
              <Link href="/listings/new">Sell My Points</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {stats && (
        <section className="border-b bg-muted/30">
          <div className="container mx-auto px-4 sm:px-8 py-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-border">
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-primary">{stats.totalActiveListings}</span>
                <span className="text-sm text-muted-foreground font-medium mt-1">Active Listings</span>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-primary">{stats.totalPointsAvailable.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground font-medium mt-1">Points Available</span>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-primary">${stats.avgPricePerPoint.toFixed(2)}</span>
                <span className="text-sm text-muted-foreground font-medium mt-1">Avg. Price / Point</span>
              </div>
              <div className="flex flex-col border-none">
                <span className="text-3xl font-bold text-primary">{stats.totalSchools}</span>
                <span className="text-sm text-muted-foreground font-medium mt-1">Schools Active</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">How Meal Market Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">A simple, transparent process for trading points on campus.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10 max-w-5xl mx-auto">
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">1. Find a Listing</h3>
              <p className="text-muted-foreground">Browse active listings from students at your school. Compare prices and point amounts to find what you need.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-2xl bg-accent/20 text-accent-foreground flex items-center justify-center mb-6">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">2. Contact Seller</h3>
              <p className="text-muted-foreground">Message the seller directly through our secure platform to arrange the transfer and payment details.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <Wallet className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">3. Trade & Confirm</h3>
              <p className="text-muted-foreground">Meet up or transfer online. Once complete, mark the transaction as finished to build your reputation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Listings */}
      <section className="py-20 bg-muted/20 border-t">
        <div className="container mx-auto px-4 sm:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-10 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Recent Listings</h2>
              <p className="text-muted-foreground">Fresh opportunities to buy points.</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/listings">View All Listings</Link>
            </Button>
          </div>
          
          {isLoadingListings ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-64 rounded-xl bg-muted animate-pulse"></div>
              ))}
            </div>
          ) : listings && listings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings.slice(0, 8).map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-background rounded-xl border border-dashed">
              <p className="text-muted-foreground">No active listings found.</p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}


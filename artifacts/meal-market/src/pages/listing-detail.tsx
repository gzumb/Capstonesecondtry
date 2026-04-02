import { Layout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { GraduationCap, MessageSquare, ArrowLeft, Clock } from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";

enum ListingStatus {
  active = "active",
  completed = "completed",
  cancelled = "cancelled",
}

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const listingId = parseInt(id, 10);
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", listingId],
    enabled: !isNaN(listingId),
    queryFn: async () => {
      const { data: listingData, error: listingError } = await supabase
        .from("listings")
        .select("*")
        .eq("id", listingId)
        .single();
      
      if (listingError) throw listingError;

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("name, school")
        .eq("id", listingData.seller_id)
        .single();

      if (userError) throw userError;

      return {
        ...listingData,
        sellerName: userData.name,
        sellerSchool: userData.school,
        totalPrice: Number(listingData.points_amount) * Number(listingData.price_per_point),
      };
    }
  });

  const startConversationMutation = useMutation({
    mutationFn: async ({ listingId, initialMessage }: { listingId: number, initialMessage: string }) => {
      if (!user) throw new Error("Not authenticated");

      const { data: conv, error: convError } = await supabase
        .from("conversations")
        .insert({
          listing_id: listingId,
          buyer_id: user.id,
          seller_id: listing?.seller_id,
        })
        .select()
        .single();
      
      if (convError) throw convError;

      const { error: msgError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conv.id,
          sender_id: user.id,
          content: initialMessage,
        });

      if (msgError) throw msgError;

      return conv;
    }
  });

  const handleContactSeller = () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to contact the seller.",
      });
      setLocation("/login");
      return;
    }

    if (user.id === listing?.seller_id) {
      toast({
        title: "Cannot contact yourself",
        description: "This is your own listing.",
        variant: "destructive",
      });
      return;
    }

    startConversationMutation.mutate(
      { listingId, initialMessage: `Hi, I'm interested in buying your ${listing?.points_amount} meal points.` },
      {
        onSuccess: (conversation) => {
          setLocation(`/messages/${conversation.id}`);
        },
        onError: (err: any) => {
          toast({
            title: "Error",
            description: err.message || "Failed to start conversation",
            variant: "destructive",
          });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="h-8 w-32 bg-muted rounded animate-pulse mb-8"></div>
          <div className="grid md:grid-cols-[1fr_350px] gap-8">
            <div className="space-y-6">
              <div className="h-64 bg-muted rounded-xl animate-pulse"></div>
              <div className="h-40 bg-muted rounded-xl animate-pulse"></div>
            </div>
            <div className="h-80 bg-muted rounded-xl animate-pulse"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!listing) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-32 text-center max-w-lg">
          <h2 className="text-3xl font-bold mb-4">Listing not found</h2>
          <p className="text-muted-foreground mb-8">This listing may have been removed or doesn't exist.</p>
          <Button asChild>
            <Link href="/listings">Browse other listings</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const isOwner = user?.id === listing.seller_id;

  return (
    <Layout>
      <div className="container mx-auto px-4 sm:px-8 py-12 max-w-5xl">
        <Button variant="ghost" className="mb-6 -ml-4 text-muted-foreground" asChild>
          <Link href="/listings">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to listings
          </Link>
        </Button>

        <div className="grid md:grid-cols-[1fr_350px] gap-8">
          <div className="space-y-8">
            <Card className="border-none shadow-md overflow-hidden">
              <div className="bg-primary/5 p-8 border-b">
                <div className="flex justify-between items-start mb-6">
                  <Badge variant={listing.status === ListingStatus.active ? "default" : "secondary"} className={listing.status === ListingStatus.active ? "bg-primary text-primary-foreground" : "text-sm"}>
                    {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                  </Badge>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Listed {new Date(listing.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                <h1 className="text-5xl font-extrabold text-foreground mb-2">{listing.points_amount} Points</h1>
                <p className="text-xl text-muted-foreground">Cafeteria Meal Points</p>
              </div>
              
              <CardContent className="p-8">
                <h3 className="text-lg font-bold mb-4">Description</h3>
                {listing.description ? (
                  <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
                    {listing.description}
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">No description provided.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>About the Seller</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                    {listing.sellerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <Link href={`/profile/${listing.sellerId}`} className="font-bold text-lg hover:text-primary transition-colors">
                      {listing.sellerName}
                    </Link>
                    <div className="flex items-center text-muted-foreground gap-1.5 mt-1">
                      <GraduationCap className="h-4 w-4" />
                      {listing.sellerSchool}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-2 border-primary/10 shadow-lg sticky top-24">
              <CardContent className="p-6">
                <div className="text-center mb-6 border-b pb-6">
                  <div className="text-4xl font-bold text-foreground mb-1">${listing.totalPrice.toFixed(2)}</div>
                  <div className="text-muted-foreground">${listing.pricePerPoint.toFixed(2)} per point</div>
                </div>
                
                {isOwner ? (
                  <div className="space-y-4">
                    <p className="text-sm text-center text-muted-foreground bg-muted p-3 rounded-lg">
                      This is your listing.
                    </p>
                    <Button variant="outline" className="w-full h-12" asChild>
                      <Link href="/my-listings">Manage in My Listings</Link>
                    </Button>
                  </div>
                ) : (
                  <Button 
                    className="w-full h-14 text-lg bg-accent text-accent-foreground hover:bg-accent/90 font-bold" 
                    onClick={handleContactSeller}
                    disabled={listing.status !== ListingStatus.active || startConversationMutation.isPending}
                  >
                    {startConversationMutation.isPending ? (
                      "Starting Conversation..."
                    ) : (
                      <>
                        <MessageSquare className="mr-2 h-5 w-5" />
                        Contact Seller
                      </>
                    )}
                  </Button>
                )}
                
                <div className="mt-6 text-xs text-center text-muted-foreground">
                  Secure messaging via Meal Market.<br />Never pay outside the platform.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
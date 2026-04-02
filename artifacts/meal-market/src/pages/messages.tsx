import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useGetConversations, getGetConversationsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { MessageSquare, Clock } from "lucide-react";
import { useAuth } from "@/components/auth-context";

export default function Messages() {
  const { user } = useAuth();
  
  const { data: conversations, isLoading } = useGetConversations({
    query: {
      queryKey: getGetConversationsQueryKey(),
      refetchInterval: 10000,
    }
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 sm:px-8 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold text-foreground mb-2">Messages</h1>
        <p className="text-muted-foreground mb-10">Manage your conversations with other students.</p>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-muted animate-pulse"></div>
            ))}
          </div>
        ) : conversations && conversations.length > 0 ? (
          <div className="bg-card rounded-xl border shadow-sm divide-y">
            {conversations.map((conv) => {
              const isBuyer = user?.id === conv.buyerId;
              const otherUser = isBuyer ? conv.sellerName : conv.buyerName;
              const otherUserId = isBuyer ? conv.sellerId : conv.buyerId;
              
              return (
                <Link key={conv.id} href={`/messages/${conv.id}`} className="block hover:bg-muted/50 transition-colors p-6">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {otherUser.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{otherUser}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <span className={isBuyer ? "text-blue-600" : "text-green-600"}>
                            {isBuyer ? "Buying" : "Selling"} {conv.listingPointsAmount} points
                          </span>
                          <span>•</span>
                          <span>${conv.listingTotalPrice.toFixed(2)}</span>
                        </p>
                      </div>
                    </div>
                    {conv.lastMessageAt && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(conv.lastMessageAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  
                  <div className="pl-13 mt-2">
                    <p className="text-sm text-foreground/80 line-clamp-1">
                      {conv.lastMessage || <span className="italic text-muted-foreground">No messages yet</span>}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/10 rounded-2xl border border-dashed">
            <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No messages</h3>
            <p className="text-muted-foreground mb-6">You don't have any active conversations.</p>
            <Button asChild>
              <Link href="/listings">Browse Listings</Link>
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}


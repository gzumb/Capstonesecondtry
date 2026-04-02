import { Layout } from "@/components/layout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDownRight, ArrowUpRight, ReceiptText } from "lucide-react";
import { Link } from "wouter";

export default function Transactions() {
  const { user } = useAuth();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .or(`buyer_id.eq.${user!.id},seller_id.eq.${user!.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data.map(tx => ({ ...tx, isBuyer: tx.buyer_id === user!.id }));
    },
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 sm:px-8 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold text-foreground mb-2">Transaction History</h1>
        <p className="text-muted-foreground mb-10">A record of all your completed meal point trades.</p>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-muted animate-pulse"></div>
            ))}
          </div>
        ) : transactions && transactions.length > 0 ? (
          <div className="space-y-4">
            {transactions.map((tx) => {
              const isBuyer = tx.isBuyer;
              
              return (
                <Card key={tx.id} className="overflow-hidden border-border">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6">
                      <div className="flex items-center gap-4 mb-4 sm:mb-0">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${
                          isBuyer ? "bg-accent/20 text-accent-foreground" : "bg-primary/10 text-primary"
                        }`}>
                          {isBuyer ? <ArrowDownRight className="h-6 w-6" /> : <ArrowUpRight className="h-6 w-6" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg">
                              {isBuyer ? "Bought Points" : "Sold Points"}
                            </h3>
                            <Badge variant="outline" className="bg-muted">
                              {tx.amount} pts
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {isBuyer ? "From" : "To"}: <Link href={`/profile/${isBuyer ? tx.seller_id : tx.buyer_id}`} className="font-medium text-foreground hover:text-primary transition-colors">User #{isBuyer ? tx.seller_id : tx.buyer_id}</Link>
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 border-t sm:border-t-0 pt-4 sm:pt-0">
                        <div className={`text-xl font-bold ${isBuyer ? "text-foreground" : "text-green-600"}`}>
                          {isBuyer ? "-" : "+"}${Number(tx.amount).toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/10 rounded-2xl border border-dashed">
            <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <ReceiptText className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No transactions yet</h3>
            <p className="text-muted-foreground">When you complete a trade, it will appear here.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
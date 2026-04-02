import { Layout } from "@/components/layout";
import { useGetUserProfile, getGetUserProfileQueryKey } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Calendar, LayoutList, ReceiptText } from "lucide-react";

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const userId = parseInt(id, 10);
  
  const { data: profile, isLoading } = useGetUserProfile(userId, {
    query: {
      enabled: !isNaN(userId),
      queryKey: getGetUserProfileQueryKey(userId),
    }
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 max-w-3xl">
          <div className="h-48 bg-muted rounded-xl animate-pulse"></div>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-32 text-center max-w-lg">
          <h2 className="text-3xl font-bold mb-4">Profile not found</h2>
          <p className="text-muted-foreground">This user doesn't exist.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 sm:px-8 py-12 max-w-3xl">
        <Card className="border-none shadow-md overflow-hidden bg-gradient-to-b from-primary/10 to-background">
          <CardContent className="p-8 sm:p-12">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 text-center sm:text-left">
              <div className="h-32 w-32 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-5xl shadow-lg ring-4 ring-background">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">{profile.name}</h1>
                
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 text-muted-foreground mb-8">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <span className="font-medium text-foreground">{profile.school}</span>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span>Joined {new Date(profile.createdAt).toLocaleDateString([], { month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t pt-8">
                  <div className="bg-card rounded-xl p-4 border text-center">
                    <div className="flex justify-center mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <LayoutList className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1">{profile.listingCount}</div>
                    <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Total Listings</div>
                  </div>
                  
                  <div className="bg-card rounded-xl p-4 border text-center">
                    <div className="flex justify-center mb-2">
                      <div className="p-2 bg-accent/20 rounded-lg text-accent-foreground">
                        <ReceiptText className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1">{profile.transactionCount}</div>
                    <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Transactions</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
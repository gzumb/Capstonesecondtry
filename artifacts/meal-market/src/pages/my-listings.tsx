import { Layout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetMyListings, useUpdateListing, useDeleteListing, ListingStatus, getGetMyListingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Plus, Settings, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function MyListings() {
  const { data: listings, isLoading } = useGetMyListings({
    query: {
      queryKey: getGetMyListingsQueryKey(),
    }
  });

  const updateListingMutation = useUpdateListing();
  const deleteListingMutation = useDeleteListing();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleStatusChange = (id: number, status: ListingStatus) => {
    updateListingMutation.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMyListingsQueryKey() });
          toast({
            title: "Status updated",
            description: `Listing marked as ${status}.`,
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to update status.",
            variant: "destructive",
          });
        }
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteListingMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMyListingsQueryKey() });
          toast({
            title: "Listing deleted",
            description: "The listing has been permanently removed.",
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to delete listing.",
            variant: "destructive",
          });
        }
      }
    );
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 sm:px-8 py-12 max-w-6xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Listings</h1>
            <p className="text-muted-foreground">Manage the meal points you're selling.</p>
          </div>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold" asChild>
            <Link href="/listings/new">
              <Plus className="mr-2 h-5 w-5" />
              Sell Points
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 rounded-xl bg-muted animate-pulse"></div>
            ))}
          </div>
        ) : listings && listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <Card key={listing.id} className="flex flex-col overflow-hidden border-border group">
                <CardHeader className="pb-3 border-b bg-muted/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-3xl font-bold text-primary mb-1">{listing.pointsAmount}</div>
                      <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Meal Points</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-foreground">${listing.totalPrice.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">${listing.pricePerPoint.toFixed(2)} / pt</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="py-4 flex-1">
                  <div className="flex justify-between items-center mb-3">
                    <Badge variant={listing.status === ListingStatus.active ? "default" : "secondary"} className={listing.status === ListingStatus.active ? "bg-primary text-primary-foreground" : ""}>
                      {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Listed {new Date(listing.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {listing.description && (
                    <p className="mt-4 text-sm text-foreground/80 line-clamp-2">
                      {listing.description}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="pt-4 pb-4 px-6 bg-muted/10 border-t flex gap-2">
                  <Select 
                    value={listing.status} 
                    onValueChange={(val) => handleStatusChange(listing.id, val as ListingStatus)}
                    disabled={updateListingMutation.isPending}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Update Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ListingStatus.active}>Active</SelectItem>
                      <SelectItem value={ListingStatus.sold}>Sold</SelectItem>
                      <SelectItem value={ListingStatus.cancelled}>Cancelled</SelectItem>
                    </SelectContent>
                  </Select>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive hover:text-destructive-foreground shrink-0 border-destructive/20">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Listing?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your listing for {listing.pointsAmount} points.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(listing.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-muted/10 rounded-2xl border border-dashed">
            <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No listings yet</h3>
            <p className="text-muted-foreground mb-6">You haven't created any meal point listings.</p>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold" asChild>
              <Link href="/listings/new">Sell Your Points</Link>
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
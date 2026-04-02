import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { GraduationCap } from "lucide-react";
import { useAuth } from "./auth-context";

enum ListingStatus {
  active = "active",
  completed = "completed",
  cancelled = "cancelled",
}

interface ListingCardProps {
  listing: any; // Using any for now to handle transformed Supabase data
  showActions?: boolean;
}

export function ListingCard({ listing, showActions = true }: ListingCardProps) {
  const { user } = useAuth();
  const isOwner = user?.id === listing.seller_id;

  return (
    <Card className="flex flex-col h-full overflow-hidden hover:shadow-md transition-shadow duration-200 border-border group">
      <CardHeader className="pb-3 border-b bg-muted/20">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-3xl font-bold text-primary mb-1">{listing.points_amount}</div>
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Meal Points</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-foreground">${listing.totalPrice?.toFixed(2) || (Number(listing.points_amount) * Number(listing.price_per_point)).toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">${Number(listing.price_per_point).toFixed(2)} / pt</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="py-4 flex-1">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant={listing.status === ListingStatus.active ? "default" : "secondary"} className={listing.status === ListingStatus.active ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}>
            {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Listed {new Date(listing.created_at).toLocaleDateString()}
          </span>
        </div>
        
        <div className="space-y-1">
          {listing.sellerName && (
            <Link href={`/profile/${listing.seller_id}`} className="text-sm font-semibold hover:text-primary transition-colors flex items-center gap-2">
              {listing.sellerName}
            </Link>
          )}
          {listing.sellerSchool && (
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <GraduationCap className="h-3 w-3" />
              {listing.sellerSchool}
            </div>
          )}
        </div>
        
        {listing.description && (
          <p className="mt-4 text-sm text-foreground/80 line-clamp-2">
            {listing.description}
          </p>
        )}
      </CardContent>
      {showActions && (
        <CardFooter className="pt-0 pb-4 px-6 mt-auto">
          {isOwner ? (
            <Button variant="outline" className="w-full" asChild>
              <Link href="/my-listings">Manage Listing</Link>
            </Button>
          ) : (
            <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold" asChild disabled={listing.status !== ListingStatus.active}>
              <Link href={`/listings/${listing.id}`}>
                View Details
              </Link>
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
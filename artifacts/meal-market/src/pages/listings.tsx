import { Layout } from "@/components/layout";
import { ListingCard } from "@/components/listing-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetListings, GetListingsSortBy, getGetListingsQueryKey } from "@workspace/api-client-react";
import { Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { useDebounce } from "@/hooks/use-debounce"; // We need to create this

export default function Listings() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [sortBy, setSortBy] = useState<GetListingsSortBy>("newest");
  
  const { data: listings, isLoading } = useGetListings({
    search: debouncedSearch || undefined,
    sortBy,
  }, {
    query: {
      queryKey: getGetListingsQueryKey({ search: debouncedSearch || undefined, sortBy })
    }
  });

  return (
    <Layout>
      <div className="bg-muted/20 border-b">
        <div className="container mx-auto px-4 sm:px-8 py-10">
          <h1 className="text-3xl font-bold mb-6">Browse Points</h1>
          
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search by school or name..." 
                className="pl-10 h-12 text-base bg-background"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              <SlidersHorizontal className="h-5 w-5 text-muted-foreground hidden md:block" />
              <Select value={sortBy} onValueChange={(val) => setSortBy(val as GetListingsSortBy)}>
                <SelectTrigger className="w-full md:w-48 h-12 bg-background">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price_asc">Lowest Price</SelectItem>
                  <SelectItem value="price_desc">Highest Price</SelectItem>
                  <SelectItem value="points_desc">Most Points</SelectItem>
                  <SelectItem value="points_asc">Least Points</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-8 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-64 rounded-xl bg-muted animate-pulse"></div>
            ))}
          </div>
        ) : listings && listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-muted/10 rounded-2xl border border-dashed">
            <h3 className="text-xl font-bold text-foreground mb-2">No listings found</h3>
            <p className="text-muted-foreground mb-6">Try adjusting your search or filters.</p>
            <Button variant="outline" onClick={() => { setSearch(""); setSortBy("newest"); }}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
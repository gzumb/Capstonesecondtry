import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useCreateListing, getGetListingsQueryKey, getGetMyListingsQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator } from "lucide-react";

const newListingSchema = z.object({
  pointsAmount: z.coerce.number().min(1, "Must be greater than 0"),
  pricePerPoint: z.coerce.number().min(0.01, "Must be greater than 0"),
  description: z.string().optional(),
});

type NewListingFormValues = z.infer<typeof newListingSchema>;

export default function NewListing() {
  const createListingMutation = useCreateListing();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<NewListingFormValues>({
    resolver: zodResolver(newListingSchema),
    defaultValues: {
      pointsAmount: 100,
      pricePerPoint: 0.50,
      description: "",
    },
  });

  const pointsAmount = form.watch("pointsAmount");
  const pricePerPoint = form.watch("pricePerPoint");
  const totalPrice = (pointsAmount || 0) * (pricePerPoint || 0);

  const onSubmit = (data: NewListingFormValues) => {
    createListingMutation.mutate(
      { data },
      {
        onSuccess: (res) => {
          queryClient.invalidateQueries({ queryKey: getGetListingsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetMyListingsQueryKey() });
          toast({
            title: "Listing created",
            description: "Your meal points are now listed for sale.",
          });
          setLocation("/my-listings");
        },
        onError: (err: any) => {
          toast({
            title: "Error",
            description: err.response?.data?.error || "Failed to create listing",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 sm:px-8 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Sell Meal Points</h1>
        <p className="text-muted-foreground mb-8">Create a new listing to sell your unused meal points.</p>

        <div className="grid md:grid-cols-[1fr_300px] gap-8">
          <Card>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="pointsAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Points Amount</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="100" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pricePerPoint"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price per Point ($)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.50" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="e.g., Willing to transfer via university portal immediately." 
                            className="resize-none h-32"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="pt-4 flex gap-4">
                    <Button type="button" variant="outline" className="w-full" onClick={() => setLocation("/my-listings")}>
                      Cancel
                    </Button>
                    <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold" disabled={createListingMutation.isPending}>
                      {createListingMutation.isPending ? "Creating..." : "Create Listing"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="bg-primary text-primary-foreground border-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Calculator className="h-5 w-5" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-primary-foreground/20 pb-2">
                    <span className="text-primary-foreground/80">Points:</span>
                    <span className="font-bold text-xl">{pointsAmount || 0}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-primary-foreground/20 pb-2">
                    <span className="text-primary-foreground/80">Price/Pt:</span>
                    <span className="font-bold text-xl">${Number(pricePerPoint || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-primary-foreground/90 font-bold">Total Payout:</span>
                    <span className="font-bold text-3xl text-accent">${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tips for Selling</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3">
                <p>• A fair price is usually around $0.40 - $0.60 per point.</p>
                <p>• Be responsive when buyers message you.</p>
                <p>• Only mark as sold after you've successfully transferred points and received payment.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
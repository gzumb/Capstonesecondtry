import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useParams, Link, useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, CheckCircle2, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";

export default function ChatThread() {
  const { id } = useParams<{ id: string }>();
  const conversationId = parseInt(id, 10);
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: conversation, isLoading: isConversationLoading } = useQuery({
    queryKey: ["conversation", conversationId],
    enabled: !isNaN(conversationId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: messages, isLoading } = useQuery({
    queryKey: ["messages", conversationId],
    enabled: !isNaN(conversationId),
    refetchInterval: 5000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageContent: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: messageContent,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["messages", conversationId] }),
    onError: () => toast({ title: "Error", description: "Failed to send message.", variant: "destructive" }),
  });

  const createTransactionMutation = useMutation({
    mutationFn: async () => {
      if (!conversation || !user) throw new Error("Not authenticated");
      const { error } = await supabase.from("transactions").insert({
        listing_id: conversation.listing_id,
        buyer_id: conversation.buyer_id,
        seller_id: conversation.seller_id,
        amount: 0, // Amount to be calculated based on listing
        status: "completed",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Transaction complete", description: "The transaction has been recorded successfully." });
      setLocation("/transactions");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to create transaction", variant: "destructive" });
    },
  });

  const isBuyer = user?.id === conversation?.buyer_id;
  const otherUser = isBuyer ? conversation?.seller_name : conversation?.buyer_name;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    const messageContent = content;
    setContent("");
    sendMessageMutation.mutate(messageContent, {
      onError: () => setContent(messageContent),
    });
  };

  const handleMarkComplete = () => createTransactionMutation.mutate();

  if (!conversation && !isConversationLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p>Conversation not found.</p>
          <Button className="mt-4" asChild><Link href="/messages">Back to Messages</Link></Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 sm:px-8 py-6 h-[calc(100vh-8rem)] flex flex-col max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="rounded-full">
              <Link href="/messages"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                {otherUser?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="font-bold text-lg leading-none">{otherUser}</h2>
                <Link href={`/listings/${conversation?.listing_id}`} className="text-xs text-primary hover:underline">
                  View Listing #{conversation?.listing_id}
                </Link>
              </div>
            </div>
          </div>
          
          {conversation && user?.id === conversation.seller_id && (
            <Button 
              variant="outline" 
              className="border-primary text-primary hover:bg-primary hover:text-white"
              onClick={handleMarkComplete}
              disabled={createTransactionMutation.isPending}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark as Sold
            </Button>
          )}
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden border-border bg-background">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : messages?.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 opacity-20 mb-4" />
                <p>Send a message to start the conversation.</p>
              </div>
            ) : (
              messages?.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div 
                      className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                        isMe 
                          ? "bg-primary text-primary-foreground rounded-br-sm" 
                          : "bg-muted text-foreground rounded-bl-sm"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/70 text-right" : "text-muted-foreground text-left"}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-muted/20 border-t">
            <form onSubmit={handleSend} className="flex gap-2">
              <Input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 h-12 bg-background rounded-full px-6"
                disabled={sendMessageMutation.isPending}
              />
              <Button 
                type="submit" 
                size="icon" 
                className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 shrink-0"
                disabled={!content.trim() || sendMessageMutation.isPending}
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
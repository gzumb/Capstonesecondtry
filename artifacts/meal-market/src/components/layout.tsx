import { Link, useLocation } from "wouter";
import { useAuth } from "./auth-context";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { LayoutDashboard, LogOut, MessageSquare, Plus, Receipt, User as UserIcon } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight hover:opacity-90 transition-opacity">
            <span className="text-white">Meal</span>
            <span className="text-accent">Market</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/listings" className="text-primary-foreground/90 hover:text-white transition-colors">
              Browse Listings
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Button variant="secondary" size="sm" className="hidden sm:flex bg-accent text-accent-foreground hover:bg-accent/90 border-none font-bold" asChild>
                  <Link href="/listings/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Sell Points
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 border-none">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary-foreground/20 text-white">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/my-listings" className="cursor-pointer w-full flex items-center">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>My Listings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/messages" className="cursor-pointer w-full flex items-center">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        <span>Messages</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/transactions" className="cursor-pointer w-full flex items-center">
                        <Receipt className="mr-2 h-4 w-4" />
                        <span>Transactions</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/profile/${user.id}`} className="cursor-pointer w-full flex items-center">
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-white border-none" asChild>
                  <Link href="/login">Log in</Link>
                </Button>
                <Button variant="secondary" className="bg-accent text-accent-foreground hover:bg-accent/90 border-none font-bold" asChild>
                  <Link href="/register">Sign up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="border-t bg-muted/40 py-8">
        <div className="container mx-auto px-4 sm:px-8 text-center text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-2">Meal Market &copy; {new Date().getFullYear()}</p>
          <p>The campus trading post for unused meal points.</p>
        </div>
      </footer>
    </div>
  );
}
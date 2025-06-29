import { WidgetProps } from "./widget-props";
import { useSymbol, useSymbolSwitcher } from "@/hooks/use-symbol.tsx";
import { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AvatarImage } from "@/components/ui/avatar.tsx";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import Zoom from "react-medium-image-zoom";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  ExternalLink,
  Heart,
  MessageCircle,
  Share,
} from "lucide-react";
import he from "he";
import { useDiscussionFeed } from "@/lib/api";
import { StockTwitFeed } from "@/lib/stock_twits.ts";

export function IdeasApp(_props: WidgetProps) {
  return <Ideas />;
}

export function Ideas() {
  const symbol = useSymbol();
  if (symbol === "NSE:NIFTY") {
    return <GlobalDiscussion />;
  }
  return symbol ? <SymbolDiscussion symbol={symbol} /> : <GlobalDiscussion />;
}

export function GlobalDiscussion() {
  type GlobalFeedType = "trending" | "popular" | "suggested";
  const [feed, setFeed] = useState<GlobalFeedType>("popular");
  const { data } = useDiscussionFeed({
    feed: feed,
    limit: 100,
  });

  const content = data?.pages?.[0]?.messages.map((m) => (
    <Message key={m.id} message={m} />
  ));

  return (
    <div className="max-w-2xl h-full flex flex-col mx-auto bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="p-4">
          <Tabs
            value={feed}
            onValueChange={(value) => setFeed(value as GlobalFeedType)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="trending" className="text-sm">
                Trending
              </TabsTrigger>
              <TabsTrigger value="popular" className="text-sm">
                Popular
              </TabsTrigger>
              <TabsTrigger value="suggested" className="text-sm">
                Suggested
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="space-y-0">{content || <MessageSkeleton />}</div>
      </div>
    </div>
  );
}

export function SymbolDiscussion({ symbol }: { symbol: string }) {
  type SymbolFeedType = "trending" | "popular";
  const [feed, setFeed] = useState<SymbolFeedType>("trending");
  const { data } = useDiscussionFeed({
    feed: "symbol",
    symbol,
    limit: 100,
    filter: feed,
  });

  const content = data?.pages?.[0]?.messages.map((m) => (
    <Message key={m.id} message={m} />
  ));

  return (
    <div className="max-w-2xl h-full flex flex-col mx-auto bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="p-4">
          <Tabs
            value={feed}
            onValueChange={(value) => setFeed(value as SymbolFeedType)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="trending" className="text-sm">
                Trending
              </TabsTrigger>
              <TabsTrigger value="popular" className="text-sm">
                Popular
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="space-y-0">{content || <MessageSkeleton />}</div>
      </div>
    </div>
  );
}

interface MessageCardProps {
  message: StockTwitFeed["messages"][0];
}

function Message({ message }: MessageCardProps) {
  const { body, created_at, user, symbols, links, likes, entities } = message;
  const switchSymbol = useSymbolSwitcher();

  // Decode HTML entities in the body
  const decodedBody = useMemo(() => {
    const line = body ? he.decode(body) : "";
    const parts = line.split(/(\$\w+\.\w+)|(\n)/g);

    return parts.map((part, index) => {
      if (!part) return null; // Ignore empty splits

      if (part.startsWith("$")) {
        const symbol = part.replace("$", "").split(".").reverse().join(":");
        return (
          <Button
            key={index}
            variant="link"
            className="h-auto p-0 mr-1 font-semibold text-blue-600 hover:text-blue-800 hover:underline"
            onClick={() => switchSymbol(symbol)}
          >
            {symbol}
          </Button>
        );
      }

      if (part === "\n") {
        return <br key={index} />; // Convert newlines to <br />
      }

      return <span key={index}>{part}</span>;
    });
  }, [body, switchSymbol]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60),
      );
      return `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  return (
    <article className="border-b border-border hover:bg-muted/50 transition-colors">
      <div className="p-4 space-y-3">
        {/* User Info */}
        <div className="flex items-start space-x-3">
          <Avatar className="w-10 h-10 flex-shrink-0">
            <AvatarImage
              src={user.avatar_url}
              alt={user.name}
              className="object-cover"
            />
            <AvatarFallback className="text-sm font-medium">
              {user.name?.charAt(0)?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="space-y-1">
              <div className="flex items-center">
                <span className="font-semibold text-foreground truncate">
                  {user.name}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>@{user.username}</span>
                <span>·</span>
                <span className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Message Content */}
        <div className="space-y-3">
          <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
            {decodedBody}
          </div>

          {/* Image */}
          {entities.chart && (
            <div className="rounded-lg overflow-hidden border bg-muted">
              <AspectRatio ratio={entities.chart.ratio ?? 16 / 9}>
                <Zoom>
                  <img
                    src={entities.chart.url}
                    alt="Chart"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                  />
                </Zoom>
              </AspectRatio>
            </div>
          )}

          {/* Tags */}
          {symbols && symbols.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {symbols.map((symbol) => (
                <Badge
                  key={symbol.id}
                  variant="secondary"
                  className="text-xs px-2 py-1 hover:bg-secondary/80 transition-colors cursor-pointer"
                  onClick={() => {
                    // Convert symbol format if needed
                    const convertedSymbol = symbol.symbol
                      ? symbol.symbol.split(".").reverse().join(":")
                      : symbol.title;
                    switchSymbol(convertedSymbol);
                  }}
                >
                  {symbol.title}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground hover:text-red-600 hover:bg-red-50"
            >
              <Heart className="w-4 h-4 mr-1" />
              <span className="text-xs">{likes?.total || 0}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              <span className="text-xs">Reply</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground hover:text-green-600 hover:bg-green-50"
            >
              <Share className="w-4 h-4 mr-1" />
              <span className="text-xs">Share</span>
            </Button>
          </div>

          {/* External Link */}
          {links?.[0]?.url && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground hover:text-foreground"
              onClick={() => window.open(links[0].url, "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              <span className="text-xs">{links[0].title || "Link"}</span>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

function MessageSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="border-b border-border p-4">
          <div className="flex items-start space-x-3">
            <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-8" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-32 w-full rounded-lg" />
              <div className="flex space-x-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

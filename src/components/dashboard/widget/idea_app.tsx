import { WidgetProps } from "./widget-props";
import { useSymbol, useSymbolSwitcher } from "@/hooks/use-symbol.tsx";
import { useMemo, useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AvatarImage } from "@/components/ui/avatar.tsx";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import Zoom from "react-medium-image-zoom";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Badge } from "@/components/ui/badge";
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
    <Tabs
      value={feed}
      onValueChange={(value) => setFeed(value as GlobalFeedType)}
      className="max-w-xl h-full flex flex-col px-2 mx-auto min-w-32"
    >
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="trending">Trending</TabsTrigger>
        <TabsTrigger value="popular">Popular</TabsTrigger>
        <TabsTrigger value="suggested">Suggested</TabsTrigger>
      </TabsList>
      <TabsContent value={"trending"} />
      <TabsContent value={"popular"} />
      <div className="flex-1 overflow-auto w-full">
        {/*trending Feed*/}
        <TabsContent value={"trending"}>
          {(feed === "trending" && content) || <MessageSkeleton />}
        </TabsContent>

        {/*popular Feed*/}
        <TabsContent value={"popular"}>
          {(feed === "popular" && content) || <MessageSkeleton />}
        </TabsContent>

        {/*suggested Feed*/}
        <TabsContent value={"suggested"}>
          {(feed === "suggested" && content) || <MessageSkeleton />}
        </TabsContent>
      </div>
    </Tabs>
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
    <Tabs
      value={feed}
      onValueChange={(value) => setFeed(value as SymbolFeedType)}
      className="max-w-xl h-full flex flex-col px-2 mx-auto"
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="trending">Trending</TabsTrigger>
        <TabsTrigger value="popular">Popular</TabsTrigger>
      </TabsList>
      <TabsContent value={"trending"} />
      <TabsContent value={"popular"} />
      <div className="flex-1 overflow-auto w-full">
        {/*trending Feed*/}
        <TabsContent value={"trending"}>
          {(feed === "trending" && content) || <MessageSkeleton />}
        </TabsContent>

        {/*popular Feed*/}
        <TabsContent value={"popular"}>
          {(feed === "popular" && content) || <MessageSkeleton />}
        </TabsContent>
      </div>
    </Tabs>
  );
}

interface MessageCardProps {
  message: StockTwitFeed["messages"][0];
}

export default function Message({ message }: MessageCardProps) {
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
          <span
            key={index}
            className="mr-1 cursor-pointer hover:underline animate-out transition font-bold"
            onClick={() => switchSymbol(symbol)}
          >
            {symbol}
          </span>
        );
      }

      if (part === "\n") {
        return <br key={index} />; // Convert newlines to <br />
      }

      return <span key={index}>{part}</span>;
    });
  }, [body, switchSymbol]);

  return (
    <Card className="w-full my-4">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src={user.avatar_url} alt={user.name} />
            <AvatarFallback>{user.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg font-semibold">{user.name}</CardTitle>
            <CardDescription className="text-sm text-gray-500">
              @{user.username} - {new Date(created_at).toLocaleString()}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-4 ">{decodedBody}</p>
        {entities.chart && (
          <AspectRatio ratio={entities.chart.ratio ?? 16 / 9}>
            <Zoom>
              <img
                src={entities.chart.url}
                alt="Chart"
                height={entities.chart.height ?? 768}
                width={entities.chart.width ?? 1028}
                className="rounded-md object-cover"
              />
            </Zoom>
          </AspectRatio>
        )}
        <div className="flex flex-wrap gap-2 my-4">
          {symbols?.map((symbol) => (
            <Badge key={symbol.id}>{symbol.title}</Badge>
          ))}
        </div>
        <div className="flex items-center space-x-4">
          <a
            href={links?.[0]?.url || "#"}
            target="_blank"
            className="text-blue-600"
          >
            {links?.[0]?.title || "Learn More"}
          </a>
          <span className="text-sm text-gray-500">{likes?.total} Likes</span>
        </div>
      </CardContent>
    </Card>
  );
}

function MessageSkeleton() {
  return Array.from({ length: 5 }).map((_, i) => (
    <Skeleton key={i} className="rounded w-full h-40 my-4" />
  ));
}

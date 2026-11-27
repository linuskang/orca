import { defaultShouldDehydrateQuery, QueryClient } from "@tanstack/react-query"
import superjson from "superjson"

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
      },
      dehydrate: {
        serializeData: superjson.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
        shouldRedactErrors: () => {
          // Next.js detects dynamic pages by catching the errors we throw, so
          // we must not redact them here. Next.js redacts with a better digest
          // of its own.
          return false
        },
      },
      hydrate: {
        deserializeData: superjson.deserialize,
      },
    },
  })
}

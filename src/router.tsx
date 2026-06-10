import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,   // 5 daqiqa — navigatsiyada re-fetch yo'q
        gcTime: 1000 * 60 * 10,     // 10 daqiqa — keshdan o'chirish
        retry: 1,                    // xato bo'lsa 1 marta qayta urinish
        refetchOnWindowFocus: false, // tab ga qaytganda re-fetch yo'q
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};

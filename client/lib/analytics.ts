import { AnalyticsBrowser } from "@segment/analytics-next";

export const analytics = AnalyticsBrowser.load(
  {
    writeKey: import.meta.env.VITE_SEGMENT_WRITE_KEY ?? "",
    cdnURL: "https://analytics.neon.tech",
  },
  {
    integrations: {
      "Segment.io": {
        apiHost: "track.neon.tech/v1",
      },
    },
  },
);

analytics.identify();
analytics.page();

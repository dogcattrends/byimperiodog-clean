import { getTrackingSettings, type TrackingConfig } from "@/lib/getTrackingSettings";

/**
 * Server-side helper to load the trackingConfig singleton used to drive tag injection.
 */
export async function getTrackingConfig(): Promise<TrackingConfig> {
  return getTrackingSettings();
}

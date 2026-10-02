export type AnalyticsEvent =
  | "landing_cta_clicked"
  | "create_started"
  | "photo_uploaded"
  | "design_generated"
  | "design_selected"
  | "studio_opened"
  | "charm_added"
  | "charm_moved"
  | "charm_deleted"
  | "ai_charm_created"
  | "material_changed"
  | "preview_clicked"
  | "make_mine_clicked"
  | "production_request_submitted"
  | "sell_design_clicked"
  | "creator_onboarding_started"
  | "creator_collection_created";

/**
 * Demo-mode analytics: logs to console only. Swap the console.info call for a
 * real provider (Segment, PostHog, GA) without touching any call site.
 */
export function trackEvent(event: AnalyticsEvent, properties?: Record<string, unknown>): void {
  console.info(`[vandida:analytics] ${event}`, properties ?? {});
}

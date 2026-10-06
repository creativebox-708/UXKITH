// Generated from the Supabase project ypwolsbxtikuhwetzmig.
// Regenerate with: npx supabase gen types typescript --project-id ypwolsbxtikuhwetzmig

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      blocks: {
        Row: { blocked: string; blocker: string; created_at: string };
        Insert: { blocked: string; blocker: string; created_at?: string };
        Update: { blocked?: string; blocker?: string; created_at?: string };
        Relationships: [];
      };
      dismissals: {
        Row: { created_at: string; dismissed_user: string; user_id: string };
        Insert: { created_at?: string; dismissed_user: string; user_id: string };
        Update: { created_at?: string; dismissed_user?: string; user_id?: string };
        Relationships: [];
      };
      interests: {
        Row: { created_at: string; from_user: string; to_user: string };
        Insert: { created_at?: string; from_user: string; to_user: string };
        Update: { created_at?: string; from_user?: string; to_user?: string };
        Relationships: [];
      };
      matches: {
        Row: {
          active: boolean;
          id: string;
          matched_at: string;
          user_a: string;
          user_b: string;
        };
        Insert: {
          active?: boolean;
          id?: string;
          matched_at?: string;
          user_a: string;
          user_b: string;
        };
        Update: {
          active?: boolean;
          id?: string;
          matched_at?: string;
          user_a?: string;
          user_b?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          match_id: string;
          read_at: string | null;
          sender: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          id?: string;
          match_id: string;
          read_at?: string | null;
          sender: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          match_id?: string;
          read_at?: string | null;
          sender?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          agreed_terms_at: string | null;
          avatar_url: string | null;
          city: string | null;
          company: string | null;
          created_at: string;
          full_name: string;
          has_invite: boolean;
          headline: string | null;
          here_at: string | null;
          hoping_to_get: string | null;
          id: string;
          is_here: boolean;
          linkedin_sub: string | null;
          linkedin_url: string | null;
          notifications_seen_at: string | null;
          onboarded_at: string | null;
          updated_at: string;
        };
        Insert: {
          agreed_terms_at?: string | null;
          avatar_url?: string | null;
          city?: string | null;
          company?: string | null;
          created_at?: string;
          full_name: string;
          has_invite?: boolean;
          headline?: string | null;
          here_at?: string | null;
          hoping_to_get?: string | null;
          id: string;
          is_here?: boolean;
          linkedin_sub?: string | null;
          linkedin_url?: string | null;
          notifications_seen_at?: string | null;
          onboarded_at?: string | null;
          updated_at?: string;
        };
        Update: {
          agreed_terms_at?: string | null;
          avatar_url?: string | null;
          city?: string | null;
          company?: string | null;
          created_at?: string;
          full_name?: string;
          has_invite?: boolean;
          headline?: string | null;
          here_at?: string | null;
          hoping_to_get?: string | null;
          id?: string;
          is_here?: boolean;
          linkedin_sub?: string | null;
          linkedin_url?: string | null;
          notifications_seen_at?: string | null;
          onboarded_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      quiz_scores: {
        Row: { correct: number; created_at: string; time_ms: number; user_id: string };
        Insert: { correct: number; created_at?: string; time_ms: number; user_id: string };
        Update: { correct?: number; created_at?: string; time_ms?: number; user_id?: string };
        Relationships: [];
      };
      reports: {
        Row: {
          created_at: string;
          id: string;
          match_id: string | null;
          reason: string | null;
          reported: string;
          reporter: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          match_id?: string | null;
          reason?: string | null;
          reported: string;
          reporter: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          match_id?: string | null;
          reason?: string | null;
          reported?: string;
          reporter?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      attendee_count: { Args: never; Returns: number };
      browse_profiles: {
        Args: {
          p_city?: string | null;
          p_company?: string | null;
          p_limit?: number;
          p_offset?: number;
          p_role?: string | null;
          p_search?: string | null;
        };
        Returns: Database["public"]["CompositeTypes"]["profile_card"][];
      };
      can_read_match: { Args: { m: string }; Returns: boolean };
      can_write_match: { Args: { m: string }; Returns: boolean };
      delete_my_account: { Args: never; Returns: undefined };
      filter_options: { Args: never; Returns: Json };
      inbound_count: { Args: never; Returns: number };
      interest_counts: {
        Args: { user_ids: string[] };
        Returns: { interest_count: number; user_id: string }[];
      };
      is_blocked_pair: { Args: { a: string; b: string }; Returns: boolean };
      match_partner: {
        Args: { p_match_id: string };
        Returns: Database["public"]["CompositeTypes"]["profile_card"][];
      };
      mark_notifications_seen: { Args: never; Returns: undefined };
      notifications: {
        Args: { p_limit?: number };
        Returns: Database["public"]["CompositeTypes"]["notification_item"][];
      };
      my_inbound: {
        Args: never;
        Returns: Database["public"]["CompositeTypes"]["profile_card"][];
      };
      my_outgoing: {
        Args: never;
        Returns: Database["public"]["CompositeTypes"]["profile_card"][];
      };
      outgoing_pending_count: { Args: never; Returns: number };
      suggested_profiles: {
        Args: { p_limit?: number };
        Returns: Database["public"]["CompositeTypes"]["profile_card"][];
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: {
      notification_item: {
        kind: string | null;
        actor_id: string | null;
        actor_name: string | null;
        actor_avatar: string | null;
        actor_headline: string | null;
        match_id: string | null;
        happened_at: string | null;
        is_new: boolean | null;
      };
      profile_card: {
        id: string | null;
        full_name: string | null;
        avatar_url: string | null;
        headline: string | null;
        company: string | null;
        city: string | null;
        linkedin_url: string | null;
        hoping_to_get: string | null;
        is_here: boolean | null;
        interest_count: number | null;
        i_am_interested: boolean | null;
        they_are_interested: boolean | null;
        match_id: string | null;
        match_active: boolean | null;
      };
    };
  };
};

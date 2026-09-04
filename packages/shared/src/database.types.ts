export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cards: {
        Row: {
          created_at: string
          deleted_at: string | null
          dex_no: string
          draw_weight: number
          grade: Database["public"]["Enums"]["card_grade"]
          id: string
          image_url: string | null
          is_season: boolean
          name: string
          type: Database["public"]["Enums"]["card_type"]
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          dex_no: string
          draw_weight?: number
          grade: Database["public"]["Enums"]["card_grade"]
          id?: string
          image_url?: string | null
          is_season?: boolean
          name: string
          type: Database["public"]["Enums"]["card_type"]
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          dex_no?: string
          draw_weight?: number
          grade?: Database["public"]["Enums"]["card_grade"]
          id?: string
          image_url?: string | null
          is_season?: boolean
          name?: string
          type?: Database["public"]["Enums"]["card_type"]
        }
        Relationships: []
      }
      crawl_runs: {
        Row: {
          error: string | null
          games_found: number
          games_settled: number
          id: string
          run_at: string
          success: boolean
          target_date: string
        }
        Insert: {
          error?: string | null
          games_found?: number
          games_settled?: number
          id?: string
          run_at?: string
          success: boolean
          target_date: string
        }
        Update: {
          error?: string | null
          games_found?: number
          games_settled?: number
          id?: string
          run_at?: string
          success?: boolean
          target_date?: string
        }
        Relationships: []
      }
      draws: {
        Row: {
          card_id: string
          cost: number
          created_at: string
          draw_type: Database["public"]["Enums"]["draw_type"]
          id: string
          is_duplicate: boolean
          refund_points: number
          user_id: string
        }
        Insert: {
          card_id: string
          cost: number
          created_at?: string
          draw_type: Database["public"]["Enums"]["draw_type"]
          id?: string
          is_duplicate: boolean
          refund_points?: number
          user_id: string
        }
        Update: {
          card_id?: string
          cost?: number
          created_at?: string
          draw_type?: Database["public"]["Enums"]["draw_type"]
          id?: string
          is_duplicate?: boolean
          refund_points?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "draws_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "card_spreads"
            referencedColumns: ["card_id"]
          },
          {
            foreignKeyName: "draws_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draws_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draws_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          away_score: number | null
          away_team_id: number
          cancelled: boolean
          external_id: string | null
          game_date: string
          home_score: number | null
          home_team_id: number
          id: string
          predict_close_at: string
          settled_at: string | null
          start_at: string
          status: Database["public"]["Enums"]["game_status"]
        }
        Insert: {
          away_score?: number | null
          away_team_id: number
          cancelled?: boolean
          external_id?: string | null
          game_date: string
          home_score?: number | null
          home_team_id: number
          id?: string
          predict_close_at: string
          settled_at?: string | null
          start_at: string
          status?: Database["public"]["Enums"]["game_status"]
        }
        Update: {
          away_score?: number | null
          away_team_id?: number
          cancelled?: boolean
          external_id?: string | null
          game_date?: string
          home_score?: number | null
          home_team_id?: number
          id?: string
          predict_close_at?: string
          settled_at?: string | null
          start_at?: string
          status?: Database["public"]["Enums"]["game_status"]
        }
        Relationships: [
          {
            foreignKeyName: "games_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      point_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          memo: string | null
          reason: Database["public"]["Enums"]["point_reason"]
          ref_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          memo?: string | null
          reason: Database["public"]["Enums"]["point_reason"]
          ref_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          memo?: string | null
          reason?: Database["public"]["Enums"]["point_reason"]
          ref_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "point_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      predictions: {
        Row: {
          created_at: string
          earned_points: number | null
          game_id: string
          id: string
          pick_away_score: number | null
          pick_home_score: number | null
          pick_winner: Database["public"]["Enums"]["prediction_pick"]
          result: Database["public"]["Enums"]["prediction_result"]
          user_id: string
        }
        Insert: {
          created_at?: string
          earned_points?: number | null
          game_id: string
          id?: string
          pick_away_score?: number | null
          pick_home_score?: number | null
          pick_winner: Database["public"]["Enums"]["prediction_pick"]
          result?: Database["public"]["Enums"]["prediction_result"]
          user_id: string
        }
        Update: {
          created_at?: string
          earned_points?: number | null
          game_id?: string
          id?: string
          pick_away_score?: number | null
          pick_home_score?: number | null
          pick_winner?: Database["public"]["Enums"]["prediction_pick"]
          result?: Database["public"]["Enums"]["prediction_result"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          color: string
          id: number
          logo_url: string | null
          name: string
          short_name: string
        }
        Insert: {
          color: string
          id?: never
          logo_url?: string | null
          name: string
          short_name: string
        }
        Update: {
          color?: string
          id?: never
          logo_url?: string | null
          name?: string
          short_name?: string
        }
        Relationships: []
      }
      user_cards: {
        Row: {
          acquired_at: string
          card_id: string
          count: number
          id: string
          user_id: string
        }
        Insert: {
          acquired_at?: string
          card_id: string
          count?: number
          id?: string
          user_id: string
        }
        Update: {
          acquired_at?: string
          card_id?: string
          count?: number
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_cards_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "card_spreads"
            referencedColumns: ["card_id"]
          },
          {
            foreignKeyName: "user_cards_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          favorite_team_id: number | null
          id: string
          nickname: string | null
          points: number
        }
        Insert: {
          created_at?: string
          favorite_team_id?: number | null
          id: string
          nickname?: string | null
          points?: number
        }
        Update: {
          created_at?: string
          favorite_team_id?: number | null
          id?: string
          nickname?: string | null
          points?: number
        }
        Relationships: [
          {
            foreignKeyName: "users_favorite_team_id_fkey"
            columns: ["favorite_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      card_spreads: {
        Row: {
          card_id: string | null
          dex_no: string | null
          grade: Database["public"]["Enums"]["card_grade"] | null
          issued_count: number | null
          name: string | null
          owner_count: number | null
        }
        Relationships: []
      }
      draw_grade_stats: {
        Row: {
          draw_count: number | null
          draw_type: Database["public"]["Enums"]["draw_type"] | null
          grade: Database["public"]["Enums"]["card_grade"] | null
        }
        Relationships: []
      }
      games_with_stats: {
        Row: {
          away_score: number | null
          away_team_id: number | null
          external_id: string | null
          game_date: string | null
          home_pick_count: number | null
          home_score: number | null
          home_team_id: number | null
          id: string | null
          predict_close_at: string | null
          prediction_count: number | null
          settled_at: string | null
          start_at: string | null
          status: Database["public"]["Enums"]["game_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "games_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      point_flow_daily: {
        Row: {
          flow_date: string | null
          issued: number | null
          spent: number | null
        }
        Relationships: []
      }
      user_summaries: {
        Row: {
          created_at: string | null
          favorite_team_id: number | null
          id: string | null
          nickname: string | null
          owned_card_kinds: number | null
          points: number | null
        }
        Relationships: [
          {
            foreignKeyName: "users_favorite_team_id_fkey"
            columns: ["favorite_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_cards_bulk: {
        Args: { items: Json }
        Returns: {
          dex_no: string
          id: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_nickname_available: { Args: { candidate: string }; Returns: boolean }
      settle_game: {
        Args: {
          final_away_score: number
          final_home_score: number
          target_game_id: string
        }
        Returns: {
          paid_points: number
          settled_predictions: number
        }[]
      }
    }
    Enums: {
      card_grade: "normal" | "rare" | "epic" | "legend" | "mythic"
      card_type: "player" | "mascot" | "item"
      draw_type: "normal" | "premium"
      game_status: "scheduled" | "closed" | "live" | "aggregating" | "settled"
      point_reason:
        | "signup"
        | "predict_win"
        | "predict_score"
        | "draw"
        | "duplicate_refund"
        | "sell"
        | "admin_adjust"
      prediction_pick: "home" | "away"
      prediction_result: "pending" | "win_hit" | "score_hit" | "miss" | "void"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      card_grade: ["normal", "rare", "epic", "legend", "mythic"],
      card_type: ["player", "mascot", "item"],
      draw_type: ["normal", "premium"],
      game_status: ["scheduled", "closed", "live", "aggregating", "settled"],
      point_reason: [
        "signup",
        "predict_win",
        "predict_score",
        "draw",
        "duplicate_refund",
        "sell",
        "admin_adjust",
      ],
      prediction_pick: ["home", "away"],
      prediction_result: ["pending", "win_hit", "score_hit", "miss", "void"],
    },
  },
} as const

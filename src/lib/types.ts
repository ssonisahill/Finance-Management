export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_preferences: {
        Row: {
          id: string
          user_id: string
          financial_month_start_day: number
          currency: string
          theme: 'light' | 'dark' | 'system'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          financial_month_start_day?: number
          currency?: string
          theme?: 'light' | 'dark' | 'system'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          financial_month_start_day?: number
          currency?: string
          theme?: 'light' | 'dark' | 'system'
          created_at?: string
          updated_at?: string
        }
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          icon: string
          color: string
          initial_balance: number
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          icon?: string
          color: string
          initial_balance?: number
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          icon?: string
          color?: string
          initial_balance?: number
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          icon: string
          color: string
          budget_limit: number | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          icon?: string
          color: string
          budget_limit?: number | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          icon?: string
          color?: string
          budget_limit?: number | null
          sort_order?: number
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          account_id: string
          type: 'income' | 'expense' | 'transfer'
          description: string
          amount: number
          category_id: string | null
          date: string
          linked_transfer_id: string | null
          is_recurring: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id: string
          type: 'income' | 'expense' | 'transfer'
          description: string
          amount: number
          category_id?: string | null
          date: string
          linked_transfer_id?: string | null
          is_recurring?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string
          type?: 'income' | 'expense' | 'transfer'
          description?: string
          amount?: number
          category_id?: string | null
          date?: string
          linked_transfer_id?: string | null
          is_recurring?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      savings_goals: {
        Row: {
          id: string
          user_id: string
          label: string
          target_amount: number
          period_start: string
          period_end: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          label: string
          target_amount: number
          period_start: string
          period_end: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          label?: string
          target_amount?: number
          period_start?: string
          period_end?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

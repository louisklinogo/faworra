export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

export type Database = {
	// Allows to automatically instantiate createClient with right options
	// instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
	__InternalSupabase: {
		PostgrestVersion: "14.5";
	};
	public: {
		Tables: {
			account: {
				Row: {
					access_token: string | null;
					access_token_expires_at: string | null;
					account_id: string;
					created_at: string;
					id: string;
					id_token: string | null;
					password: string | null;
					provider_id: string;
					refresh_token: string | null;
					refresh_token_expires_at: string | null;
					scope: string | null;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					access_token?: string | null;
					access_token_expires_at?: string | null;
					account_id: string;
					created_at?: string;
					id: string;
					id_token?: string | null;
					password?: string | null;
					provider_id: string;
					refresh_token?: string | null;
					refresh_token_expires_at?: string | null;
					scope?: string | null;
					updated_at: string;
					user_id: string;
				};
				Update: {
					access_token?: string | null;
					access_token_expires_at?: string | null;
					account_id?: string;
					created_at?: string;
					id?: string;
					id_token?: string | null;
					password?: string | null;
					provider_id?: string;
					refresh_token?: string | null;
					refresh_token_expires_at?: string | null;
					scope?: string | null;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "account_user_id_user_id_fk";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "user";
						referencedColumns: ["id"];
					},
				];
			};
			accounting_sync_records: {
				Row: {
					created_at: string;
					error_code: string | null;
					error_message: string | null;
					id: string;
					provider: Database["public"]["Enums"]["accounting_provider"];
					provider_entity_type: string | null;
					provider_tenant_id: string;
					provider_transaction_id: string | null;
					status: Database["public"]["Enums"]["accounting_sync_status"];
					sync_type: Database["public"]["Enums"]["accounting_sync_type"] | null;
					synced_at: string;
					synced_attachment_mapping: Json;
					team_id: string;
					transaction_id: string;
				};
				Insert: {
					created_at?: string;
					error_code?: string | null;
					error_message?: string | null;
					id?: string;
					provider: Database["public"]["Enums"]["accounting_provider"];
					provider_entity_type?: string | null;
					provider_tenant_id: string;
					provider_transaction_id?: string | null;
					status?: Database["public"]["Enums"]["accounting_sync_status"];
					sync_type?:
						| Database["public"]["Enums"]["accounting_sync_type"]
						| null;
					synced_at?: string;
					synced_attachment_mapping?: Json;
					team_id: string;
					transaction_id: string;
				};
				Update: {
					created_at?: string;
					error_code?: string | null;
					error_message?: string | null;
					id?: string;
					provider?: Database["public"]["Enums"]["accounting_provider"];
					provider_entity_type?: string | null;
					provider_tenant_id?: string;
					provider_transaction_id?: string | null;
					status?: Database["public"]["Enums"]["accounting_sync_status"];
					sync_type?:
						| Database["public"]["Enums"]["accounting_sync_type"]
						| null;
					synced_at?: string;
					synced_attachment_mapping?: Json;
					team_id?: string;
					transaction_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "accounting_sync_records_team_id_teams_id_fk";
						columns: ["team_id"];
						isOneToOne: false;
						referencedRelation: "teams";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "accounting_sync_records_transaction_id_transactions_id_fk";
						columns: ["transaction_id"];
						isOneToOne: false;
						referencedRelation: "transactions";
						referencedColumns: ["id"];
					},
				];
			};
			bank_accounts: {
				Row: {
					account_number: string | null;
					available_balance: number | null;
					balance: number | null;
					bank_connection_id: string | null;
					created_at: string;
					credit_limit: number | null;
					currency: string;
					enabled: boolean;
					external_id: string | null;
					id: string;
					last_synced_at: string | null;
					manual: boolean;
					name: string;
					sync_status:
						| Database["public"]["Enums"]["bank_account_sync_status"]
						| null;
					team_id: string;
					type: Database["public"]["Enums"]["bank_account_type"];
					updated_at: string;
				};
				Insert: {
					account_number?: string | null;
					available_balance?: number | null;
					balance?: number | null;
					bank_connection_id?: string | null;
					created_at?: string;
					credit_limit?: number | null;
					currency: string;
					enabled?: boolean;
					external_id?: string | null;
					id?: string;
					last_synced_at?: string | null;
					manual?: boolean;
					name: string;
					sync_status?:
						| Database["public"]["Enums"]["bank_account_sync_status"]
						| null;
					team_id: string;
					type?: Database["public"]["Enums"]["bank_account_type"];
					updated_at?: string;
				};
				Update: {
					account_number?: string | null;
					available_balance?: number | null;
					balance?: number | null;
					bank_connection_id?: string | null;
					created_at?: string;
					credit_limit?: number | null;
					currency?: string;
					enabled?: boolean;
					external_id?: string | null;
					id?: string;
					last_synced_at?: string | null;
					manual?: boolean;
					name?: string;
					sync_status?:
						| Database["public"]["Enums"]["bank_account_sync_status"]
						| null;
					team_id?: string;
					type?: Database["public"]["Enums"]["bank_account_type"];
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "bank_accounts_bank_connection_id_bank_connections_id_fk";
						columns: ["bank_connection_id"];
						isOneToOne: false;
						referencedRelation: "bank_connections";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "bank_accounts_team_id_teams_id_fk";
						columns: ["team_id"];
						isOneToOne: false;
						referencedRelation: "teams";
						referencedColumns: ["id"];
					},
				];
			};
			bank_connections: {
				Row: {
					created_at: string;
					detail_status:
						| Database["public"]["Enums"]["bank_connection_detail_status"]
						| null;
					enrollment_id: string | null;
					error_count: number | null;
					id: string;
					institution_name: string | null;
					last_synced_at: string | null;
					name: string;
					provider: string;
					status: Database["public"]["Enums"]["bank_connection_status"];
					team_id: string;
					updated_at: string;
				};
				Insert: {
					created_at?: string;
					detail_status?:
						| Database["public"]["Enums"]["bank_connection_detail_status"]
						| null;
					enrollment_id?: string | null;
					error_count?: number | null;
					id?: string;
					institution_name?: string | null;
					last_synced_at?: string | null;
					name: string;
					provider?: string;
					status?: Database["public"]["Enums"]["bank_connection_status"];
					team_id: string;
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					detail_status?:
						| Database["public"]["Enums"]["bank_connection_detail_status"]
						| null;
					enrollment_id?: string | null;
					error_count?: number | null;
					id?: string;
					institution_name?: string | null;
					last_synced_at?: string | null;
					name?: string;
					provider?: string;
					status?: Database["public"]["Enums"]["bank_connection_status"];
					team_id?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "bank_connections_team_id_teams_id_fk";
						columns: ["team_id"];
						isOneToOne: false;
						referencedRelation: "teams";
						referencedColumns: ["id"];
					},
				];
			};
			inbox: {
				Row: {
					amount: number | null;
					attachment_id: string | null;
					content_type: string | null;
					created_at: string;
					currency: string | null;
					date: string | null;
					display_name: string | null;
					file_name: string | null;
					file_path: string[] | null;
					id: string;
					sender_email: string | null;
					size: number | null;
					status: Database["public"]["Enums"]["inbox_status"] | null;
					team_id: string | null;
					transaction_id: string | null;
				};
				Insert: {
					amount?: number | null;
					attachment_id?: string | null;
					content_type?: string | null;
					created_at?: string;
					currency?: string | null;
					date?: string | null;
					display_name?: string | null;
					file_name?: string | null;
					file_path?: string[] | null;
					id?: string;
					sender_email?: string | null;
					size?: number | null;
					status?: Database["public"]["Enums"]["inbox_status"] | null;
					team_id?: string | null;
					transaction_id?: string | null;
				};
				Update: {
					amount?: number | null;
					attachment_id?: string | null;
					content_type?: string | null;
					created_at?: string;
					currency?: string | null;
					date?: string | null;
					display_name?: string | null;
					file_name?: string | null;
					file_path?: string[] | null;
					id?: string;
					sender_email?: string | null;
					size?: number | null;
					status?: Database["public"]["Enums"]["inbox_status"] | null;
					team_id?: string | null;
					transaction_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "inbox_team_id_teams_id_fk";
						columns: ["team_id"];
						isOneToOne: false;
						referencedRelation: "teams";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "inbox_transaction_id_transactions_id_fk";
						columns: ["transaction_id"];
						isOneToOne: false;
						referencedRelation: "transactions";
						referencedColumns: ["id"];
					},
				];
			};
			session: {
				Row: {
					created_at: string;
					expires_at: string;
					id: string;
					ip_address: string | null;
					token: string;
					updated_at: string;
					user_agent: string | null;
					user_id: string;
				};
				Insert: {
					created_at?: string;
					expires_at: string;
					id: string;
					ip_address?: string | null;
					token: string;
					updated_at: string;
					user_agent?: string | null;
					user_id: string;
				};
				Update: {
					created_at?: string;
					expires_at?: string;
					id?: string;
					ip_address?: string | null;
					token?: string;
					updated_at?: string;
					user_agent?: string | null;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "session_user_id_user_id_fk";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "user";
						referencedColumns: ["id"];
					},
				];
			};
			tags: {
				Row: {
					color: string | null;
					created_at: string;
					id: string;
					name: string;
					slug: string;
					team_id: string;
				};
				Insert: {
					color?: string | null;
					created_at?: string;
					id?: string;
					name: string;
					slug: string;
					team_id: string;
				};
				Update: {
					color?: string | null;
					created_at?: string;
					id?: string;
					name?: string;
					slug?: string;
					team_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "tags_team_id_teams_id_fk";
						columns: ["team_id"];
						isOneToOne: false;
						referencedRelation: "teams";
						referencedColumns: ["id"];
					},
				];
			};
			team_invites: {
				Row: {
					accepted_at: string | null;
					accepted_by_user_id: string | null;
					created_at: string;
					email: string;
					expires_at: string;
					id: string;
					invited_by_user_id: string;
					normalized_email: string;
					role: Database["public"]["Enums"]["team_role"];
					status: Database["public"]["Enums"]["team_invite_status"];
					team_id: string;
					token_hash: string;
					updated_at: string;
				};
				Insert: {
					accepted_at?: string | null;
					accepted_by_user_id?: string | null;
					created_at?: string;
					email: string;
					expires_at: string;
					id?: string;
					invited_by_user_id: string;
					normalized_email: string;
					role: Database["public"]["Enums"]["team_role"];
					status?: Database["public"]["Enums"]["team_invite_status"];
					team_id: string;
					token_hash: string;
					updated_at?: string;
				};
				Update: {
					accepted_at?: string | null;
					accepted_by_user_id?: string | null;
					created_at?: string;
					email?: string;
					expires_at?: string;
					id?: string;
					invited_by_user_id?: string;
					normalized_email?: string;
					role?: Database["public"]["Enums"]["team_role"];
					status?: Database["public"]["Enums"]["team_invite_status"];
					team_id?: string;
					token_hash?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "team_invites_accepted_by_user_id_user_id_fk";
						columns: ["accepted_by_user_id"];
						isOneToOne: false;
						referencedRelation: "user";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "team_invites_invited_by_user_id_user_id_fk";
						columns: ["invited_by_user_id"];
						isOneToOne: false;
						referencedRelation: "user";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "team_invites_team_id_teams_id_fk";
						columns: ["team_id"];
						isOneToOne: false;
						referencedRelation: "teams";
						referencedColumns: ["id"];
					},
				];
			};
			team_memberships: {
				Row: {
					created_at: string;
					id: string;
					role: Database["public"]["Enums"]["team_role"];
					team_id: string;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					created_at?: string;
					id?: string;
					role: Database["public"]["Enums"]["team_role"];
					team_id: string;
					updated_at?: string;
					user_id: string;
				};
				Update: {
					created_at?: string;
					id?: string;
					role?: Database["public"]["Enums"]["team_role"];
					team_id?: string;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "team_memberships_team_id_teams_id_fk";
						columns: ["team_id"];
						isOneToOne: false;
						referencedRelation: "teams";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "team_memberships_user_id_user_id_fk";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "user";
						referencedColumns: ["id"];
					},
				];
			};
			team_settings: {
				Row: {
					base_currency: string | null;
					country_code: string | null;
					created_at: string;
					fiscal_year_start_month: number | null;
					industry_config_version: string | null;
					industry_key: string | null;
					team_id: string;
					updated_at: string;
				};
				Insert: {
					base_currency?: string | null;
					country_code?: string | null;
					created_at?: string;
					fiscal_year_start_month?: number | null;
					industry_config_version?: string | null;
					industry_key?: string | null;
					team_id: string;
					updated_at?: string;
				};
				Update: {
					base_currency?: string | null;
					country_code?: string | null;
					created_at?: string;
					fiscal_year_start_month?: number | null;
					industry_config_version?: string | null;
					industry_key?: string | null;
					team_id?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "team_settings_team_id_teams_id_fk";
						columns: ["team_id"];
						isOneToOne: true;
						referencedRelation: "teams";
						referencedColumns: ["id"];
					},
				];
			};
			teams: {
				Row: {
					created_at: string;
					id: string;
					logo_url: string | null;
					name: string;
					updated_at: string;
				};
				Insert: {
					created_at?: string;
					id?: string;
					logo_url?: string | null;
					name: string;
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					id?: string;
					logo_url?: string | null;
					name?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			transaction_attachments: {
				Row: {
					created_at: string;
					filename: string;
					id: string;
					mime_type: string;
					path: string;
					size: number;
					team_id: string;
					transaction_id: string;
				};
				Insert: {
					created_at?: string;
					filename: string;
					id?: string;
					mime_type: string;
					path: string;
					size: number;
					team_id: string;
					transaction_id: string;
				};
				Update: {
					created_at?: string;
					filename?: string;
					id?: string;
					mime_type?: string;
					path?: string;
					size?: number;
					team_id?: string;
					transaction_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "transaction_attachments_team_id_teams_id_fk";
						columns: ["team_id"];
						isOneToOne: false;
						referencedRelation: "teams";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "transaction_attachments_transaction_id_transactions_id_fk";
						columns: ["transaction_id"];
						isOneToOne: false;
						referencedRelation: "transactions";
						referencedColumns: ["id"];
					},
				];
			};
			transaction_categories: {
				Row: {
					color: string | null;
					created_at: string | null;
					description: string | null;
					excluded: boolean | null;
					id: string;
					name: string;
					parent_id: string | null;
					slug: string;
					system: boolean | null;
					tax_rate: number | null;
					tax_reporting_code: string | null;
					tax_type: string | null;
					team_id: string;
				};
				Insert: {
					color?: string | null;
					created_at?: string | null;
					description?: string | null;
					excluded?: boolean | null;
					id?: string;
					name: string;
					parent_id?: string | null;
					slug: string;
					system?: boolean | null;
					tax_rate?: number | null;
					tax_reporting_code?: string | null;
					tax_type?: string | null;
					team_id: string;
				};
				Update: {
					color?: string | null;
					created_at?: string | null;
					description?: string | null;
					excluded?: boolean | null;
					id?: string;
					name?: string;
					parent_id?: string | null;
					slug?: string;
					system?: boolean | null;
					tax_rate?: number | null;
					tax_reporting_code?: string | null;
					tax_type?: string | null;
					team_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "transaction_categories_parent_id_fkey";
						columns: ["parent_id"];
						isOneToOne: false;
						referencedRelation: "transaction_categories";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "transaction_categories_team_id_fkey";
						columns: ["team_id"];
						isOneToOne: false;
						referencedRelation: "teams";
						referencedColumns: ["id"];
					},
				];
			};
			transaction_match_suggestions: {
				Row: {
					amount_score: number | null;
					confidence_score: number;
					created_at: string;
					currency_score: number | null;
					date_score: number | null;
					id: string;
					inbox_id: string;
					match_details: Json | null;
					match_type: string;
					name_score: number | null;
					status: string;
					team_id: string;
					transaction_id: string;
					updated_at: string;
					user_action_at: string | null;
					user_id: string | null;
				};
				Insert: {
					amount_score?: number | null;
					confidence_score: number;
					created_at?: string;
					currency_score?: number | null;
					date_score?: number | null;
					id?: string;
					inbox_id: string;
					match_details?: Json | null;
					match_type: string;
					name_score?: number | null;
					status?: string;
					team_id: string;
					transaction_id: string;
					updated_at?: string;
					user_action_at?: string | null;
					user_id?: string | null;
				};
				Update: {
					amount_score?: number | null;
					confidence_score?: number;
					created_at?: string;
					currency_score?: number | null;
					date_score?: number | null;
					id?: string;
					inbox_id?: string;
					match_details?: Json | null;
					match_type?: string;
					name_score?: number | null;
					status?: string;
					team_id?: string;
					transaction_id?: string;
					updated_at?: string;
					user_action_at?: string | null;
					user_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "transaction_match_suggestions_inbox_id_inbox_id_fk";
						columns: ["inbox_id"];
						isOneToOne: false;
						referencedRelation: "inbox";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "transaction_match_suggestions_team_id_teams_id_fk";
						columns: ["team_id"];
						isOneToOne: false;
						referencedRelation: "teams";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "transaction_match_suggestions_transaction_id_transactions_id_fk";
						columns: ["transaction_id"];
						isOneToOne: false;
						referencedRelation: "transactions";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "transaction_match_suggestions_user_id_user_id_fk";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "user";
						referencedColumns: ["id"];
					},
				];
			};
			transaction_tags: {
				Row: {
					created_at: string;
					id: string;
					tag_id: string;
					team_id: string;
					transaction_id: string;
				};
				Insert: {
					created_at?: string;
					id?: string;
					tag_id: string;
					team_id: string;
					transaction_id: string;
				};
				Update: {
					created_at?: string;
					id?: string;
					tag_id?: string;
					team_id?: string;
					transaction_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "transaction_tags_tag_id_tags_id_fk";
						columns: ["tag_id"];
						isOneToOne: false;
						referencedRelation: "tags";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "transaction_tags_team_id_teams_id_fk";
						columns: ["team_id"];
						isOneToOne: false;
						referencedRelation: "teams";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "transaction_tags_transaction_id_transactions_id_fk";
						columns: ["transaction_id"];
						isOneToOne: false;
						referencedRelation: "transactions";
						referencedColumns: ["id"];
					},
				];
			};
			transactions: {
				Row: {
					amount: number;
					assigned_id: string | null;
					balance: number | null;
					bank_account_id: string | null;
					base_amount: number | null;
					base_currency: string | null;
					category_slug: string | null;
					counterparty_name: string | null;
					created_at: string;
					currency: string;
					description: string | null;
					enrichment_completed: boolean | null;
					frequency:
						| Database["public"]["Enums"]["transaction_frequency"]
						| null;
					id: string;
					internal: boolean;
					internal_id: string;
					manual: boolean;
					merchant_name: string | null;
					method: Database["public"]["Enums"]["transaction_method"];
					name: string;
					note: string | null;
					notified: boolean;
					recurring: boolean | null;
					status: Database["public"]["Enums"]["transaction_status"];
					tax_amount: number | null;
					tax_rate: number | null;
					tax_type: string | null;
					team_id: string;
					transaction_date: string;
					updated_at: string;
				};
				Insert: {
					amount: number;
					assigned_id?: string | null;
					balance?: number | null;
					bank_account_id?: string | null;
					base_amount?: number | null;
					base_currency?: string | null;
					category_slug?: string | null;
					counterparty_name?: string | null;
					created_at?: string;
					currency: string;
					description?: string | null;
					enrichment_completed?: boolean | null;
					frequency?:
						| Database["public"]["Enums"]["transaction_frequency"]
						| null;
					id?: string;
					internal?: boolean;
					internal_id: string;
					manual?: boolean;
					merchant_name?: string | null;
					method?: Database["public"]["Enums"]["transaction_method"];
					name: string;
					note?: string | null;
					notified?: boolean;
					recurring?: boolean | null;
					status?: Database["public"]["Enums"]["transaction_status"];
					tax_amount?: number | null;
					tax_rate?: number | null;
					tax_type?: string | null;
					team_id: string;
					transaction_date: string;
					updated_at?: string;
				};
				Update: {
					amount?: number;
					assigned_id?: string | null;
					balance?: number | null;
					bank_account_id?: string | null;
					base_amount?: number | null;
					base_currency?: string | null;
					category_slug?: string | null;
					counterparty_name?: string | null;
					created_at?: string;
					currency?: string;
					description?: string | null;
					enrichment_completed?: boolean | null;
					frequency?:
						| Database["public"]["Enums"]["transaction_frequency"]
						| null;
					id?: string;
					internal?: boolean;
					internal_id?: string;
					manual?: boolean;
					merchant_name?: string | null;
					method?: Database["public"]["Enums"]["transaction_method"];
					name?: string;
					note?: string | null;
					notified?: boolean;
					recurring?: boolean | null;
					status?: Database["public"]["Enums"]["transaction_status"];
					tax_amount?: number | null;
					tax_rate?: number | null;
					tax_type?: string | null;
					team_id?: string;
					transaction_date?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "transactions_bank_account_id_bank_accounts_id_fk";
						columns: ["bank_account_id"];
						isOneToOne: false;
						referencedRelation: "bank_accounts";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "transactions_team_id_teams_id_fk";
						columns: ["team_id"];
						isOneToOne: false;
						referencedRelation: "teams";
						referencedColumns: ["id"];
					},
				];
			};
			user: {
				Row: {
					created_at: string;
					email: string;
					email_verified: boolean;
					id: string;
					image: string | null;
					name: string;
					updated_at: string;
				};
				Insert: {
					created_at?: string;
					email: string;
					email_verified?: boolean;
					id: string;
					image?: string | null;
					name: string;
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					email?: string;
					email_verified?: boolean;
					id?: string;
					image?: string | null;
					name?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			user_context: {
				Row: {
					active_membership_id: string | null;
					active_team_id: string | null;
					created_at: string;
					date_format: string | null;
					locale: string | null;
					time_format: number;
					timezone: string | null;
					timezone_auto_sync: boolean;
					updated_at: string;
					user_id: string;
					week_starts_on_monday: boolean;
				};
				Insert: {
					active_membership_id?: string | null;
					active_team_id?: string | null;
					created_at?: string;
					date_format?: string | null;
					locale?: string | null;
					time_format?: number;
					timezone?: string | null;
					timezone_auto_sync?: boolean;
					updated_at?: string;
					user_id: string;
					week_starts_on_monday?: boolean;
				};
				Update: {
					active_membership_id?: string | null;
					active_team_id?: string | null;
					created_at?: string;
					date_format?: string | null;
					locale?: string | null;
					time_format?: number;
					timezone?: string | null;
					timezone_auto_sync?: boolean;
					updated_at?: string;
					user_id?: string;
					week_starts_on_monday?: boolean;
				};
				Relationships: [
					{
						foreignKeyName: "user_context_active_membership_id_team_memberships_id_fk";
						columns: ["active_membership_id"];
						isOneToOne: false;
						referencedRelation: "team_memberships";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "user_context_active_team_id_teams_id_fk";
						columns: ["active_team_id"];
						isOneToOne: false;
						referencedRelation: "teams";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "user_context_user_id_user_id_fk";
						columns: ["user_id"];
						isOneToOne: true;
						referencedRelation: "user";
						referencedColumns: ["id"];
					},
				];
			};
			verification: {
				Row: {
					created_at: string;
					expires_at: string;
					id: string;
					identifier: string;
					updated_at: string;
					value: string;
				};
				Insert: {
					created_at?: string;
					expires_at: string;
					id: string;
					identifier: string;
					updated_at?: string;
					value: string;
				};
				Update: {
					created_at?: string;
					expires_at?: string;
					id?: string;
					identifier?: string;
					updated_at?: string;
					value?: string;
				};
				Relationships: [];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			[_ in never]: never;
		};
		Enums: {
			accounting_provider: "xero" | "quickbooks" | "fortnox";
			accounting_sync_status: "synced" | "failed" | "pending" | "partial";
			accounting_sync_type: "auto" | "manual";
			bank_account_sync_status: "pending" | "syncing" | "available" | "failed";
			bank_account_type: "bank" | "momo" | "cash" | "other";
			bank_connection_detail_status:
				| "linked"
				| "processing"
				| "available"
				| "partial"
				| "unavailable"
				| "expired"
				| "failed";
			bank_connection_status: "connected" | "disconnected" | "error";
			inbox_status: "processing" | "pending" | "archived" | "new" | "analyzing";
			team_invite_status: "pending" | "accepted" | "revoked" | "expired";
			team_role: "owner" | "admin" | "accountant" | "member";
			transaction_frequency:
				| "weekly"
				| "biweekly"
				| "monthly"
				| "semi_monthly"
				| "annually"
				| "irregular"
				| "unknown";
			transaction_method:
				| "payment"
				| "card_purchase"
				| "card_atm"
				| "transfer"
				| "other"
				| "unknown"
				| "ach"
				| "interest"
				| "deposit"
				| "wire"
				| "fee"
				| "momo"
				| "cash";
			transaction_status:
				| "posted"
				| "pending"
				| "excluded"
				| "completed"
				| "archived"
				| "exported";
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
	keyof Database,
	"public"
>];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
				DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
			DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
				DefaultSchema["Views"])
		? (DefaultSchema["Tables"] &
				DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema["Tables"]
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema["Tables"]
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	DefaultSchemaEnumNameOrOptions extends
		| keyof DefaultSchema["Enums"]
		| { schema: keyof DatabaseWithoutInternals },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
		: never = never,
> = DefaultSchemaEnumNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
		? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema["CompositeTypes"]
		| { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
		: never = never,
> = PublicCompositeTypeNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
		? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
		: never;

export const Constants = {
	public: {
		Enums: {
			accounting_provider: ["xero", "quickbooks", "fortnox"],
			accounting_sync_status: ["synced", "failed", "pending", "partial"],
			accounting_sync_type: ["auto", "manual"],
			bank_account_sync_status: ["pending", "syncing", "available", "failed"],
			bank_account_type: ["bank", "momo", "cash", "other"],
			bank_connection_detail_status: [
				"linked",
				"processing",
				"available",
				"partial",
				"unavailable",
				"expired",
				"failed",
			],
			bank_connection_status: ["connected", "disconnected", "error"],
			inbox_status: ["processing", "pending", "archived", "new", "analyzing"],
			team_invite_status: ["pending", "accepted", "revoked", "expired"],
			team_role: ["owner", "admin", "accountant", "member"],
			transaction_frequency: [
				"weekly",
				"biweekly",
				"monthly",
				"semi_monthly",
				"annually",
				"irregular",
				"unknown",
			],
			transaction_method: [
				"payment",
				"card_purchase",
				"card_atm",
				"transfer",
				"other",
				"unknown",
				"ach",
				"interest",
				"deposit",
				"wire",
				"fee",
				"momo",
				"cash",
			],
			transaction_status: [
				"posted",
				"pending",
				"excluded",
				"completed",
				"archived",
				"exported",
			],
		},
	},
} as const;

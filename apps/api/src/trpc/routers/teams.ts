import {
  acceptTeamInvite,
  createTeamInvites,
  declineTeamInvite,
  deleteTeamInvite,
  deleteTeamMember,
  getInvitesByEmail,
  getTeamInvites,
  getTeamMembers,
  leaveTeam,
  updateTeamMember,
} from "@Faworra/database/queries";
// Import Drizzle helpers from database schema to ensure single-module type identity
import { and, eq, teams, users, usersOnTeam } from "@Faworra/database/schema";
import { createClient } from "@supabase/supabase-js";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../init";

const NAME_MAX = 255;

export const teamsRouter = createTRPCRouter({
  // List teams for the authenticated user
  list: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({ id: teams.id, name: teams.name })
      .from(usersOnTeam)
      .leftJoin(teams, eq(usersOnTeam.teamId, teams.id))
      .where(eq(usersOnTeam.userId, ctx.userId!));
    return rows.filter((r) => r.id);
  }),

  // Get current team info for the user (id + baseCurrency)
  current: protectedProcedure.query(async ({ ctx }) => {
    const userRow = await ctx.db.query.users.findFirst({
      where: (u, { eq: eqFn }) => eqFn(u.id, ctx.userId!),
    });
    const teamId = userRow?.currentTeamId ?? null;
    if (!teamId) {
      return {
        teamId: null as string | null,
        baseCurrency: undefined as string | undefined,
        locale: ctx.locale ?? "en-US",
        timezone: "UTC",
        weekStartsOnMonday: false,
        timeFormat: 24,
      };
    }

    const [teamSettings] = await ctx.db
      .select({
        baseCurrency: teams.baseCurrency,
        locale: teams.locale,
        timezone: teams.timezone,
      })
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    return {
      teamId,
      baseCurrency: teamSettings?.baseCurrency,
      locale: teamSettings?.locale ?? ctx.locale ?? "en-US",
      timezone: teamSettings?.timezone ?? "UTC",
      weekStartsOnMonday: false,
      timeFormat: 24,
    };
  }),

  // Set current team id (only if user is a member)
  setCurrent: protectedProcedure
    .input(z.object({ teamId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const membership = await ctx.db
        .select({ teamId: usersOnTeam.teamId })
        .from(usersOnTeam)
        .where(and(eq(usersOnTeam.userId, ctx.userId!), eq(usersOnTeam.teamId, input.teamId)))
        .limit(1);
      if (!membership.length) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this team" });
      }
      await ctx.db
        .update(users)
        .set({ currentTeamId: input.teamId })
        .where(eq(users.id, ctx.userId!));
      return { success: true };
    }),

  // Get team members for assignee filtering
  members: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.teamId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No current team" });
    }
    return await getTeamMembers(ctx.db, { teamId: ctx.teamId });
  }),

  // Pending invites for current team
  teamInvites: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.teamId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No current team" });
    }
    return await getTeamInvites(ctx.db, ctx.teamId);
  }),

  // Invites for current user's email
  invitesByEmail: protectedProcedure.query(async ({ ctx }) => {
    const email = ctx.session?.email;
    if (!email) return [];
    return await getInvitesByEmail(ctx.db, email);
  }),

  // Invite members (owner/admin action)
  invite: protectedProcedure
    .input(
      z.array(
        z.object({
          email: z.string().email(),
          // Map Midday "member" to our closest role: "agent"
          role: z.enum(["owner", "agent"]),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.teamId) throw new TRPCError({ code: "BAD_REQUEST", message: "No current team" });

      // Ensure requester is a member (and ideally owner/admin)
      const me = await ctx.db
        .select({ role: usersOnTeam.role })
        .from(usersOnTeam)
        .where(and(eq(usersOnTeam.teamId, ctx.teamId), eq(usersOnTeam.userId, ctx.userId!)))
        .limit(1);
      const myRole = me[0]?.role as string | undefined;
      if (!myRole || (myRole !== "owner" && myRole !== "admin")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions" });
      }

      const data = await createTeamInvites(ctx.db, {
        teamId: ctx.teamId,
        invites: input.map((i) => ({ ...i, invitedBy: ctx.userId! })),
      });
      return { sent: data.results.length, skipped: data.skippedInvites.length, skippedInvites: data.skippedInvites };
    }),

  deleteInvite: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.teamId) throw new TRPCError({ code: "BAD_REQUEST", message: "No current team" });
      await deleteTeamInvite(ctx.db, { id: input.id, teamId: ctx.teamId });
      return { success: true };
    }),

  // Role update (owner only)
  updateMember: protectedProcedure
    .input(
      z.object({
        teamId: z.string().uuid(),
        userId: z.string().uuid(),
        role: z.enum(["owner", "admin", "agent", "viewer"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Only owners can update roles
      const me = await ctx.db
        .select({ role: usersOnTeam.role })
        .from(usersOnTeam)
        .where(and(eq(usersOnTeam.teamId, input.teamId), eq(usersOnTeam.userId, ctx.userId!)))
        .limit(1);
      if (me[0]?.role !== "owner") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only owners can change roles" });
      }
      await updateTeamMember(ctx.db, input);
      return { success: true };
    }),

  deleteMember: protectedProcedure
    .input(z.object({ teamId: z.string().uuid(), userId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Only owners can remove others
      const me = await ctx.db
        .select({ role: usersOnTeam.role })
        .from(usersOnTeam)
        .where(and(eq(usersOnTeam.teamId, input.teamId), eq(usersOnTeam.userId, ctx.userId!)))
        .limit(1);
      if (me[0]?.role !== "owner") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only owners can remove members" });
      }
      if (input.userId === ctx.userId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Use leave instead" });
      }
      await deleteTeamMember(ctx.db, input);
      return { success: true };
    }),

  leave: protectedProcedure
    .input(z.object({ teamId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Block if sole owner
      const owners = await ctx.db
        .select({ id: usersOnTeam.userId })
        .from(usersOnTeam)
        .where(and(eq(usersOnTeam.teamId, input.teamId), eq(usersOnTeam.role, "owner")));
      const isOwner = owners.some((o) => o.id === ctx.userId);
      if (isOwner && owners.length <= 1) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot leave as the sole owner" });
      }
      await leaveTeam(ctx.db, { teamId: input.teamId, userId: ctx.userId! });
      // Clear current team if leaving it
      const userRow = await ctx.db
        .select({ currentTeamId: users.currentTeamId })
        .from(users)
        .where(eq(users.id, ctx.userId!))
        .limit(1);
      if (userRow[0]?.currentTeamId === input.teamId) {
        await ctx.db.update(users).set({ currentTeamId: null }).where(eq(users.id, ctx.userId!));
      }
      return { success: true };
    }),

  acceptInvite: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const res = await acceptTeamInvite(ctx.db, { id: input.id, userId: ctx.userId! });
      // Set current team automatically for convenience
      await ctx.db.update(users).set({ currentTeamId: res.teamId }).where(eq(users.id, ctx.userId!));
      return res;
    }),

  declineInvite: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const email = ctx.session?.email;
      if (!email) throw new TRPCError({ code: "BAD_REQUEST", message: "Missing email" });
      await declineTeamInvite(ctx.db, { id: input.id, email });
      return { success: true };
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(NAME_MAX),
        baseCurrency: z.string().optional(),
        countryCode: z.string().optional(),
        locale: z
          .string()
          .regex(/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/)
          .optional(),
        switchTeam: z.boolean().optional().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // ctx.userId is guaranteed by protectedProcedure

      // Create admin Supabase client to bypass RLS
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        },
      );

      // Ensure a user profile row exists (FK required by users_on_team)
      {
        const { error: userUpsertErr } = await supabase
          .from("users")
          .upsert({ id: ctx.userId!, email: ctx.session?.email || null }, { onConflict: "id" });
        if (userUpsertErr) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create user profile",
          });
        }
      }

      // Create team
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .insert({
          name: input.name,
          base_currency: input.baseCurrency ?? undefined,
          country: input.countryCode ?? undefined,
          locale: input.locale ?? ctx.locale ?? undefined,
        })
        .select()
        .single();

      if (teamError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create team",
        });
      }

      // Add user to team as owner
      const { error: memberError } = await supabase.from("users_on_team").insert({
        user_id: ctx.userId,
        team_id: team.id,
        role: "owner",
      });

      if (memberError) {
        // Try to clean up the team
        await supabase.from("teams").delete().eq("id", team.id);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add user to team",
        });
      }

      // Update user's current_team_id
      if (input.switchTeam) {
        const { error: updateError } = await supabase
          .from("users")
          .update({ current_team_id: team.id })
          .eq("id", ctx.userId);

        if (updateError) {
          // Don't fail the request, user can select team manually
        }
      }

      return {
        success: true,
        team,
      };
    }),
});

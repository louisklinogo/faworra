import {
  getAverageOrderValue,
  getCompletedOrdersThisMonth,
  getHighestValueOrder,
  getInactiveClientsCount,
  getMostActiveClient,
  getNewClientsThisMonth,
  getPendingOrdersCount,
  getTopRevenueClient,
} from "@Faworra/database/queries";
import { createTRPCRouter, teamProcedure } from "../init";

export const analyticsRouter = createTRPCRouter({
  // Get most active client
  mostActiveClient: teamProcedure.query(
    async ({ ctx }) => await getMostActiveClient(ctx.db, ctx.teamId),
  ),

  // Get count of inactive clients
  inactiveClientsCount: teamProcedure.query(
    async ({ ctx }) => await getInactiveClientsCount(ctx.db, ctx.teamId),
  ),

  // Get top revenue client
  topRevenueClient: teamProcedure.query(
    async ({ ctx }) => await getTopRevenueClient(ctx.db, ctx.teamId),
  ),

  // Get new clients this month count
  newClientsThisMonth: teamProcedure.query(
    async ({ ctx }) => await getNewClientsThisMonth(ctx.db, ctx.teamId),
  ),

  // Get highest value order
  highestValueOrder: teamProcedure.query(
    async ({ ctx }) => await getHighestValueOrder(ctx.db, ctx.teamId),
  ),

  // Get completed orders in last 30 days
  completedOrdersThisMonth: teamProcedure.query(
    async ({ ctx }) => await getCompletedOrdersThisMonth(ctx.db, ctx.teamId),
  ),

  // Get count of pending orders
  pendingOrdersCount: teamProcedure.query(
    async ({ ctx }) => await getPendingOrdersCount(ctx.db, ctx.teamId),
  ),

  // Get average order value
  averageOrderValue: teamProcedure.query(
    async ({ ctx }) => await getAverageOrderValue(ctx.db, ctx.teamId),
  ),
});

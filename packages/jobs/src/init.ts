// Register tasks so Trigger.dev picks them up
import "./tasks/invoice/scheduler/invoice-scheduler";
import "./tasks/invoice/operations/check-status";
import "./tasks/invoice/scheduler/invoice-reminders-scheduler";
import "./tasks/invoice/operations/send-reminder";
import "./tasks/invoice/scheduler/invoice-scheduled-send";
import "./tasks/invoice/operations/send-invoice";
import "./tasks/fx/scheduler/fx-scheduler";
import "./tasks/fx/repair/recompute-base-amounts";

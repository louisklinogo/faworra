"use client";

import { Label } from "@Faworra/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateOrder, useUpdateOrder } from "@/hooks/use-order-mutations";
import { useClients } from "@/hooks/use-supabase-data";
import { useTeamCurrency } from "@/hooks/use-team-currency";
import type { OrderWithClient } from "@/lib/supabase-queries";
import { trpc } from "@/lib/trpc/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ComboboxDropdown, type ComboboxItem } from "@/components/ui/combobox-dropdown";
import { cn } from "@/lib/utils";

interface OrderItem {
  name: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
}

interface OrderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: OrderWithClient | null;
}

export function OrderSheet({ open, onOpenChange, order }: OrderSheetProps) {
  const { data: clients = [] } = useClients();
  const currency = useTeamCurrency();
  const createMutation = useCreateOrder();
  const updateMutation = useUpdateOrder();
  const { data: orderDetail } = trpc.orders.byId.useQuery(
    { id: order?.id || "" },
    {
      enabled: !!order?.id && open,
    },
  );

  const [formData, setFormData] = useState({
    client_id: order?.client_id || "",
    status: order?.status || "generated",
    notes: order?.notes || "",
    deposit_amount: order
      ? Number.parseFloat(
        String((order as any).deposit_amount || (order as any).depositAmount || "0"),
      )
      : 0,
    due_date: order
      ? (() => {
        const dateVal = (order as any).due_date || (order as any).dueDate;
        return dateVal ? String(dateVal).split("T")[0] : "";
      })()
      : "",
  });

  const [items, setItems] = useState<OrderItem[]>([
    { name: "", quantity: 1, unit_cost: 0, total_cost: 0 },
  ]);

  const isEdit = !!order;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Calculate totals
  const calculateItemTotal = (quantity: number, unitCost: number) => quantity * unitCost;

  const totalPrice = items.reduce((sum, item) => sum + item.total_cost, 0);
  const balanceAmount = totalPrice - formData.deposit_amount;

  // Handle item changes
  const updateItem = (index: number, field: keyof OrderItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-calculate total_cost when quantity or unit_cost changes
    if (field === "quantity" || field === "unit_cost") {
      newItems[index].total_cost = calculateItemTotal(
        newItems[index].quantity,
        newItems[index].unit_cost,
      );
    }

    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { name: "", quantity: 1, unit_cost: 0, total_cost: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate at least one item
    const validItems = items.filter((item) => item.name.trim() !== "");
    if (validItems.length === 0) {
      alert("Please add at least one item");
      return;
    }

    const orderData = {
      clientId: formData.client_id || null,
      orderNumber: isEdit ? order.order_number : undefined,
      status: String(formData.status || "generated"),
      items: validItems.map((it) => ({
        name: it.name,
        quantity: Number(it.quantity || 0),
        unit_cost: Number(it.unit_cost || 0),
        total_cost: Number(it.total_cost || 0),
      })),
      totalPrice: Number(totalPrice),
      depositAmount: Number(formData.deposit_amount),
      balanceAmount: Number(balanceAmount),
      notes: formData.notes || null,
      dueDate: formData.due_date || null,
    } as const;

    if (isEdit) {
      await (updateMutation as any).mutateAsync({ id: order.id, data: orderData });
    } else {
      await (createMutation as any).mutateAsync(orderData);
    }

    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      client_id: "",
      status: "Generated",
      notes: "",
      deposit_amount: 0,
      due_date: "",
    });
    setItems([{ name: "", quantity: 1, unit_cost: 0, total_cost: 0 }]);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  // Update form when order prop changes
  useEffect(() => {
    if (order && open) {
      setFormData({
        client_id: order.client_id || "",
        status: order.status || "generated",
        notes: order.notes || "",
        deposit_amount: Number.parseFloat(
          String((order as any).deposit_amount || (order as any).depositAmount || "0"),
        ),
        due_date: (() => {
          const dateVal = (order as any).due_date || (order as any).dueDate;
          return dateVal ? String(dateVal).split("T")[0] : "";
        })(),
      });
      // Load items from tRPC detail (order_items) when available; otherwise start with one blank
      const detailItems = (orderDetail as any)?.items as Array<any> | undefined;
      if (detailItems?.length) {
        setItems(
          detailItems.map((it) => ({
            name: it.name,
            quantity: Number(it.quantity || 0),
            unit_cost: Number.parseFloat(String(it.unitPrice || 0)),
            total_cost: Number.parseFloat(String(it.total || 0)),
          })),
        );
      } else {
        setItems([{ name: "", quantity: 1, unit_cost: 0, total_cost: 0 }]);
      }
    }
  }, [order, open, orderDetail]);

  return (
    <Sheet onOpenChange={handleOpenChange} open={open}>
      <SheetContent className="flex flex-col overflow-hidden p-0 sm:max-w-2xl">
        <SheetHeader className="flex-shrink-0 px-6 pt-6 pb-0">
          <SheetTitle>{isEdit ? "Edit Order" : "Create New Order"}</SheetTitle>
        </SheetHeader>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="scrollbar-hide flex-1 overflow-y-auto px-6 py-4">
            <Accordion className="space-y-0" defaultValue={["general", "items", "payment"]} type="multiple">
              {/* General Section */}
              <AccordionItem value="general">
                <AccordionTrigger>General</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label htmlFor="client_id">Client</Label>
                        <ComboboxDropdown
                          items={clients.map((c) => ({ id: c.id, label: c.name }))}
                          onSelect={(item) => setFormData({ ...formData, client_id: item?.id || "" })}
                          placeholder="Select client"
                          searchPlaceholder="Search clients..."
                          selectedItem={
                            formData.client_id
                              ? {
                                id: formData.client_id,
                                label: clients.find((c) => c.id === formData.client_id)?.name || "",
                              }
                              : undefined
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="status">
                          Status <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          onValueChange={(value) => setFormData({ ...formData, status: value })}
                          value={formData.status}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="generated">Generated</SelectItem>
                            <SelectItem value="in_progress">In progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Due Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button className="w-full justify-start" type="button" variant="outline">
                              {formData.due_date
                                ? new Date(formData.due_date).toLocaleDateString()
                                : "Select due date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent align="start" className="w-auto p-0">
                            <Calendar
                              initialFocus
                              mode="single"
                              onSelect={(date) => {
                                setFormData({
                                  ...formData,
                                  due_date:
                                    date && date instanceof Date ? date.toISOString().split("T")[0] : "",
                                });
                              }}
                              selected={formData.due_date ? new Date(formData.due_date) : undefined}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Items Section */}
              <AccordionItem value="items">
                <AccordionTrigger>Items</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {/* Header Row */}
                    <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground tracking-wider">
                      <div className="col-span-5 pl-1">ITEM</div>
                      <div className="col-span-2 text-center">QTY</div>
                      <div className="col-span-2 text-right">COST</div>
                      <div className="col-span-2 text-right">TOTAL</div>
                      <div className="col-span-1"></div>
                    </div>

                    {/* Items List */}
                    <div className="space-y-2">
                      {items.map((item, index) => (
                        <div key={`${index}`} className="group relative grid grid-cols-12 gap-2 items-start">
                          <div className="col-span-5">
                            <Input
                              className="h-9 border-transparent bg-muted/30 focus:bg-background focus:border-input px-2 transition-colors"
                              onChange={(e) => updateItem(index, "name", e.target.value)}
                              placeholder="Item name"
                              required
                              value={item.name}
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              className="h-9 border-transparent bg-muted/30 focus:bg-background focus:border-input px-2 text-center font-mono transition-colors"
                              min="1"
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "quantity",
                                  Number.parseInt(e.target.value, 10) || 1,
                                )
                              }
                              type="number"
                              value={item.quantity}
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              className="h-9 border-transparent bg-muted/30 focus:bg-background focus:border-input px-2 text-right font-mono transition-colors"
                              min="0"
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "unit_cost",
                                  Number.parseFloat(e.target.value) || 0,
                                )
                              }
                              step="0.01"
                              type="number"
                              value={item.unit_cost}
                            />
                          </div>
                          <div className="col-span-2">
                            <div className="flex h-9 items-center justify-end px-2 font-mono text-sm">
                              {item.total_cost.toFixed(2)}
                            </div>
                          </div>
                          <div className="col-span-1 flex justify-center">
                            {items.length > 1 && (
                              <Button
                                className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeItem(index)}
                                size="icon"
                                type="button"
                                variant="ghost"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Item Button */}
                    <Button
                      className="w-full border-dashed border-muted-foreground/20 hover:bg-muted/50 hover:border-muted-foreground/40 text-muted-foreground"
                      onClick={addItem}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add Item
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Payment Section */}
              <AccordionItem value="payment">
                <AccordionTrigger>Payment</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 p-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Price</span>
                      <span className="font-mono font-medium">
                        {currency} {totalPrice.toFixed(2)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 items-center">
                      <Label className="text-xs text-muted-foreground" htmlFor="deposit_amount">
                        Deposit Amount
                      </Label>
                      <Input
                        className="h-8 text-right font-mono"
                        id="deposit_amount"
                        max={totalPrice}
                        min="0"
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            deposit_amount: Number.parseFloat(e.target.value) || 0,
                          })
                        }
                        step="0.01"
                        type="number"
                        value={formData.deposit_amount}
                      />
                    </div>

                    <div className="flex justify-between border-t border-dashed pt-3 text-sm">
                      <span className="font-medium">Balance Due</span>
                      <span className="font-mono font-semibold text-primary">
                        {currency} {balanceAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Notes Section */}
              <AccordionItem value="notes">
                <AccordionTrigger>Notes</AccordionTrigger>
                <AccordionContent>
                  <Textarea
                    id="notes"
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any additional notes about this order..."
                    rows={4}
                    value={formData.notes}
                    className="resize-none"
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="flex flex-shrink-0 justify-end gap-4 border-t px-6 py-4 bg-background/50 backdrop-blur-sm">
            <Button
              disabled={isLoading}
              onClick={() => handleOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <SubmitButton isSubmitting={isLoading} type="submit">
              {isEdit ? "Update Order" : "Create Order"}
            </SubmitButton>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

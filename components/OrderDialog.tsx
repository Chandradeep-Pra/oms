// app/components/OrderDialog.tsx

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Plus, X } from "lucide-react";
import CustomerNameField from "./forms/Add-Order/CustomerName";
import WhatsAppNumberField from "./forms/Add-Order/WhatsappNumber";
import PickOrderField from "./forms/Add-Order/PickOrder";
import OrderStatus from "./forms/Add-Order/OrderStatus";
import OrderDate from "./forms/Add-Order/OrderDate";
import { AddOrderSchema } from "@/lib/validations";
import { z } from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { OrderItem, OrderType } from "@/types/orderType";
import { mockItemsData } from "@/data/item";
import { useOrderStore } from "@/hooks/useOrderStore";
import { useToast } from "@/hooks/use-toast";

type FormData = z.infer<typeof AddOrderSchema>;

const OrderDialog = () => {
  const [sendToWhatsapp, setSendToWhatsapp] = useState(false);
  const [whatsappNum, setWhatsappNum] = useState("");
  const [status, setStatus] = useState("pending");

  const methods = useForm<FormData>({
    resolver: zodResolver(AddOrderSchema),
    defaultValues: {
      customerName: "",
      items: [],
    },
  });

  const { addOrder } = useOrderStore(); // Access addOrder from store
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const onSubmit = async (data: FormData) => {
    console.log("Inside form submission");
    console.log(data);

    // Transform the items data into the required format
    const transformedItems: OrderItem[] = data.items.map((item) => {
      const productData = mockItemsData.find((product) => product.itemId === item.itemId);
      if (!productData) {
        return {
          itemId: item.itemId,
          quantity: item.quantity,
          price: 0,
          total: 0,
          sku: "Unknown",
          category: "Unknown",
          itemName: "unknown",
        };
      }

      return {
        itemId: productData.itemId,
        quantity: item.quantity,
        price: productData.price,
        total: productData.price * item.quantity,
        sku: productData.sku,
        category: productData.category,
        itemName: productData.name,
      };
    });

    // Create a new order object
    const newOrder: OrderType = {
      id: "Dy-001",
      orderDate: data.orderDate.toDateString(),
      status: 'processing',
      paymentStatus:'pending',
      totalAmount: 444, 
      items: transformedItems,
      customer: {
        name: data.customerName,
        whatsappNumber: whatsappNum,
        rewardPoint:0,
      },
      createdAt: data.orderDate.toISOString(),
      updatedAt: data.orderDate.toISOString(),
    };

    // Add the new order to the store
    const result = await addOrder(newOrder);

    if (result.success) {
      toast({
        title: "Order Added!",
        description: `The order has been placed for ${data.customerName} successfully.`,
      });

      // Handle WhatsApp sending logic if the checkbox is checked
      if (sendToWhatsapp) {
        const messageBody = [
          data.customerName,
          newOrder.id,
          data.orderDate.toDateString(),
          transformedItems.map((item) => `- ${item.quantity} × ${item.itemName}`).join(", "),
        ];

        console.log("Message body:", messageBody);

        // Check for missing details in messageBody
        if (messageBody.some((item) => !item)) {
          toast({
            title: "Error",
            description: "The message body is missing some details.",
            variant: "destructive",
          });
          return;
        }

        try {
          const whatsappResponse = await fetch("/api/order-received", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              phoneNumber: whatsappNum,
              messageBody,
            }),
          });

          const whatsappResult = await whatsappResponse.json();
          // console.log(whatsappResult);

          if (whatsappResult.success) {
            toast({
              title: "Message Sent!",
              description: `Order details sent to ${data.customerName} on WhatsApp.`,
            });
          } else {
            toast({
              title: "Failed to Send Message",
              description: whatsappResult.message || "Unknown error",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error sending WhatsApp message:", error);
          toast({
            title: "Error",
            description: "There was an error sending the message. Please try again.",
            variant: "destructive",
          });
        }
      }
    }

    handleDialogClose();
    setOpen(false);
    console.log(newOrder);
  };

  const handleDialogClose = () => {
    methods.reset();
  };

  const handleDialogOpen = () => {
    setOpen(true);
  };

  const handleSendToWhatsapp = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSendToWhatsapp(e.target.checked);
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button className="text-sm font-semibold text-light-primary border-2 border-light-primary hover:border-light-button-hover px-6 py-2 rounded-md ">
          <Plus className="text-xl mr-2" />
          Add Order
        </Button>
      </DialogTrigger>
      <DialogContent className="p-7 px-8 max-h-screen w-[90vw] sm:max-h[90vh] max-sm:w-full overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Add Order</DialogTitle>
          <DialogDescription>
            Fill the form to add a new order
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1 max-sm:gap-0">
              <CustomerNameField />
              <WhatsAppNumberField  setWhatsappNum={setWhatsappNum} />
            </div>
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1 max-sm:gap-0">
              <OrderStatus status={status} setStatus={setStatus} />
              <OrderDate />
            </div>
            <PickOrderField />

            <DialogFooter className="mt-11 mb-4 grid grid-cols-5 gap-2 h-14">
              <Button className="col-span-1 bg-red-300 hover:bg-red-600 h-full text-3xl" variant={'secondary'} onClick={handleDialogClose}>
                <X strokeWidth={3} fill="none" className=" h-14 w-14"/>
              </Button>

              <div className="rounded-md border-2 border-light-primary col-span-2 flex items-center justify-center">
                <div>
                  <input
                    type="checkbox"
                    checked={sendToWhatsapp}
                    onChange={handleSendToWhatsapp}
                    className="mr-2"
                  />
                  <span className="text-center">Send to WhatsApp</span>
                </div>
              </div>

              <Button type="submit" className="col-span-2 h-full bg-dark-primary text-xl text-white shadow-none">
                Add order
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDialog;

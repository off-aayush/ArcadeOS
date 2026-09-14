"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { NewStandaloneSaleDialog } from "./new-standalone-sale-dialog";

export function NewSaleButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-brand hover:bg-brand/80 text-white font-semibold"
      >
        <ShoppingCart className="h-4 w-4 mr-2" />
        New Inventory Sale
      </Button>
      
      {isOpen && (
        <NewStandaloneSaleDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

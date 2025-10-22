"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FaUser, FaChild, FaBaby, FaCar, FaDollarSign, FaPlus, FaEdit, FaEye } from "react-icons/fa";

export default function ActivityPricingTestPage() {
  const [selectedOption, setSelectedOption] = useState<"option1" | "option2" | "option3">("option1");
  const [viewMode, setViewMode] = useState<"operator" | "customer">("operator");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            Activity Pricing Flow - SME Alignment
          </h1>
          <p className="text-lg text-gray-600">
            Compare different approaches for tour operator pricing setup and customer booking experience
          </p>
          
          {/* View Mode Toggle */}
          <div className="flex justify-center gap-4 mt-6">
            <Button
              onClick={() => setViewMode("operator")}
              variant={viewMode === "operator" ? "default" : "outline"}
              className="gap-2"
            >
              <FaEdit /> Tour Operator View
            </Button>
            <Button
              onClick={() => setViewMode("customer")}
              variant={viewMode === "customer" ? "default" : "outline"}
              className="gap-2"
            >
              <FaEye /> Customer View
            </Button>
          </div>
        </div>

        {/* Option Selection */}
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle>Select Pricing Approach to Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => setSelectedOption("option1")}
                variant={selectedOption === "option1" ? "default" : "outline"}
                className="h-auto py-4 flex flex-col items-start gap-2"
              >
                <span className="font-bold">Option 1: Separate Dimensions</span>
                <span className="text-xs text-left">Variants + Transfer Options (Independent)</span>
              </Button>
              <Button
                onClick={() => setSelectedOption("option2")}
                variant={selectedOption === "option2" ? "default" : "outline"}
                className="h-auto py-4 flex flex-col items-start gap-2"
              >
                <span className="font-bold">Option 2: Embedded Transfer</span>
                <span className="text-xs text-left">Each Variant has Transfer Prices</span>
              </Button>
              <Button
                onClick={() => setSelectedOption("option3")}
                variant={selectedOption === "option3" ? "default" : "outline"}
                className="h-auto py-4 flex flex-col items-start gap-2"
              >
                <span className="font-bold">Option 3: Simplified Matrix</span>
                <span className="text-xs text-left">Tour Type × Transfer = Price</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Option 1 */}
        {selectedOption === "option1" && (
          <Option1View viewMode={viewMode} />
        )}

        {/* Option 2 */}
        {selectedOption === "option2" && (
          <Option2View viewMode={viewMode} />
        )}

        {/* Option 3 */}
        {selectedOption === "option3" && (
          <Option3View viewMode={viewMode} />
        )}

        {/* Comparison Summary */}
        <ComparisonTable />
      </div>
    </div>
  );
}

// ============================================================================
// OPTION 1: Separate Dimensions (Recommended)
// ============================================================================
function Option1View({ viewMode }: { viewMode: "operator" | "customer" }) {
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState("standard");
  const [selectedTransfer, setSelectedTransfer] = useState("ticket-only");

  // Operator Setup Data
  const basePrice = 1500;
  const childPricePercent = 50; // 50% of adult
  const infantPrice = 0; // Free

  const variants = [
    { id: "budget", name: "Budget", adjustment: 0, features: ["Basic experience", "Standard seating"] },
    { id: "standard", name: "Standard", adjustment: 300, features: ["Enhanced experience", "Priority seating"] },
    { id: "deluxe", name: "Deluxe", adjustment: 700, features: ["Premium experience", "VIP seating", "Welcome drink"] },
    { id: "premium", name: "Premium Indian Buffet", adjustment: 1000, features: ["All Deluxe features", "Premium buffet", "Photo package"] },
  ];

  const transferOptions = [
    { id: "ticket-only", name: "Ticket Only", cost: 0 },
    { id: "hotel-pickup", name: "Hotel Pickup", cost: 500 },
    { id: "private-transfer", name: "Private Transfer", cost: 1500 },
    { id: "airport-pickup", name: "Airport Pickup & Drop", cost: 2000 },
  ];

  // Calculate Price
  const selectedVariantData = variants.find(v => v.id === selectedVariant)!;
  const selectedTransferData = transferOptions.find(t => t.id === selectedTransfer)!;
  
  const adultPrice = basePrice + selectedVariantData.adjustment;
  const childPrice = (adultPrice * childPricePercent) / 100;
  const transferCost = selectedTransferData.cost;
  
  const totalPrice = (adultPrice * adults) + (childPrice * children) + (infantPrice * infants) + transferCost;

  if (viewMode === "operator") {
    return (
      <div className="space-y-6">
        <Card className="border-2 border-green-200">
          <CardHeader className="bg-green-50">
            <CardTitle className="flex items-center gap-2">
              <Badge className="bg-green-600">Option 1</Badge>
              Tour Operator Setup Interface
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Step 1: Base Pricing */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center">1</span>
                Base Pricing
              </h3>
              <div className="grid grid-cols-3 gap-4 ml-10">
                <div>
                  <label className="text-sm font-medium">Base Adult Price</label>
                  <Input value={`₹ ${basePrice}`} readOnly className="font-semibold" />
                </div>
                <div>
                  <label className="text-sm font-medium">Child Price</label>
                  <Input value={`${childPricePercent}% of Adult`} readOnly />
                </div>
                <div>
                  <label className="text-sm font-medium">Infant Price</label>
                  <Input value={infantPrice === 0 ? "Free" : `₹ ${infantPrice}`} readOnly />
                </div>
              </div>
            </div>

            {/* Step 2: Tour Variants */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center">2</span>
                Tour Options/Variants
              </h3>
              <div className="ml-10 space-y-3">
                {variants.map((variant) => (
                  <Card key={variant.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="font-semibold">{variant.name}</h4>
                            <Badge variant="outline">
                              {variant.adjustment > 0 ? `+₹${variant.adjustment}` : "Base Price"}
                            </Badge>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {variant.features.map((feature, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Final Adult Price</div>
                          <div className="text-xl font-bold text-green-600">
                            ₹ {(basePrice + variant.adjustment).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Step 3: Transfer Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center">3</span>
                Transfer Options (Add-ons)
              </h3>
              <div className="ml-10 grid grid-cols-2 gap-3">
                {transferOptions.map((transfer) => (
                  <Card key={transfer.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FaCar className="text-blue-600" />
                          <span className="font-medium">{transfer.name}</span>
                        </div>
                        <Badge className="bg-purple-600">
                          {transfer.cost === 0 ? "Free" : `+₹${transfer.cost}`}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Formula Display */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 ml-10">
              <h4 className="font-semibold mb-2">Pricing Formula:</h4>
              <code className="text-sm">
                Final Price = [(Base Price + Variant Adjustment) × Adults] + [(Child Price) × Children] + [(Infant Price) × Infants] + Transfer Cost
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Customer View
  return (
    <div className="space-y-6">
      <Card className="border-2 border-purple-200">
        <CardHeader className="bg-purple-50">
          <CardTitle className="flex items-center gap-2">
            <Badge className="bg-purple-600">Option 1</Badge>
            Customer Booking Interface
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4">Tour Option</th>
                <th className="text-left py-3 px-4">Transfer Option</th>
                <th className="text-center py-3 px-4">Adult</th>
                <th className="text-center py-3 px-4">Child</th>
                <th className="text-center py-3 px-4">Infant</th>
                <th className="text-right py-3 px-4">Total</th>
                <th className="text-center py-3 px-4">Book</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((variant) => (
                <tr key={variant.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-semibold">{variant.name}</div>
                      <div className="text-xs text-gray-500">{variant.features[0]}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <Select defaultValue="ticket-only">
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {transferOptions.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name} {t.cost > 0 && `(+₹${t.cost})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-4 px-4">
                    <Select defaultValue="2">
                      <SelectTrigger className="w-16">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 1, 2, 3, 4, 5].map((n) => (
                          <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-4 px-4">
                    <Select defaultValue="0">
                      <SelectTrigger className="w-16">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 1, 2, 3, 4, 5].map((n) => (
                          <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-4 px-4">
                    <Select defaultValue="0">
                      <SelectTrigger className="w-16">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 1, 2, 3, 4, 5].map((n) => (
                          <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="text-lg font-bold text-green-600">
                      ₹ {((basePrice + variant.adjustment) * 2).toLocaleString()}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <Button className="bg-orange-500 hover:bg-orange-600">
                      Book Now
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// OPTION 2: Embedded Transfer in Variants
// ============================================================================
function Option2View({ viewMode }: { viewMode: "operator" | "customer" }) {
  // Each variant has its own transfer pricing
  const variantsPricing = [
    {
      id: "budget",
      name: "Budget",
      transfers: [
        { type: "Ticket Only", adultPrice: 1500, childPrice: 750, infantPrice: 0 },
        { type: "Hotel Pickup", adultPrice: 2000, childPrice: 1000, infantPrice: 0 },
        { type: "Private Transfer", adultPrice: 3000, childPrice: 1500, infantPrice: 0 },
      ]
    },
    {
      id: "standard",
      name: "Standard",
      transfers: [
        { type: "Ticket Only", adultPrice: 1800, childPrice: 900, infantPrice: 0 },
        { type: "Hotel Pickup", adultPrice: 2300, childPrice: 1150, infantPrice: 0 },
        { type: "Private Transfer", adultPrice: 3300, childPrice: 1650, infantPrice: 0 },
      ]
    },
    {
      id: "deluxe",
      name: "Deluxe",
      transfers: [
        { type: "Ticket Only", adultPrice: 2200, childPrice: 1100, infantPrice: 0 },
        { type: "Hotel Pickup", adultPrice: 2700, childPrice: 1350, infantPrice: 0 },
        { type: "Private Transfer", adultPrice: 3700, childPrice: 1850, infantPrice: 0 },
      ]
    },
    {
      id: "premium",
      name: "Premium Indian Buffet",
      transfers: [
        { type: "Ticket Only", adultPrice: 2500, childPrice: 1250, infantPrice: 0 },
        { type: "Hotel Pickup", adultPrice: 3000, childPrice: 1500, infantPrice: 0 },
        { type: "Private Transfer", adultPrice: 4000, childPrice: 2000, infantPrice: 0 },
      ]
    },
  ];

  if (viewMode === "operator") {
    return (
      <div className="space-y-6">
        <Card className="border-2 border-orange-200">
          <CardHeader className="bg-orange-50">
            <CardTitle className="flex items-center gap-2">
              <Badge className="bg-orange-600">Option 2</Badge>
              Tour Operator Setup Interface
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <p className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded p-3">
              ⚠️ In this approach, you set specific prices for each combination of Tour Option + Transfer Type + Passenger Type
            </p>

            {variantsPricing.map((variant) => (
              <div key={variant.id} className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FaDollarSign className="text-green-600" />
                  {variant.name}
                </h3>
                <div className="ml-6">
                  <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-2 px-4 border-b">Transfer Type</th>
                        <th className="text-right py-2 px-4 border-b">Adult Price</th>
                        <th className="text-right py-2 px-4 border-b">Child Price</th>
                        <th className="text-right py-2 px-4 border-b">Infant Price</th>
                        <th className="text-center py-2 px-4 border-b">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variant.transfers.map((transfer, idx) => (
                        <tr key={idx} className="border-b last:border-b-0">
                          <td className="py-3 px-4">{transfer.type}</td>
                          <td className="py-3 px-4 text-right">
                            <Input value={`₹ ${transfer.adultPrice}`} className="w-32 ml-auto" />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Input value={`₹ ${transfer.childPrice}`} className="w-32 ml-auto" />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Input value={transfer.infantPrice === 0 ? "Free" : `₹ ${transfer.infantPrice}`} className="w-32 ml-auto" />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Button size="sm" variant="ghost"><FaEdit /></Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold mb-2">Total Configurations Needed:</h4>
              <p className="text-sm">4 Variants × 3 Transfer Types × 3 Passenger Types = <strong>36 price points to manage</strong></p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Customer View
  return (
    <div className="space-y-6">
      <Card className="border-2 border-purple-200">
        <CardHeader className="bg-purple-50">
          <CardTitle className="flex items-center gap-2">
            <Badge className="bg-purple-600">Option 2</Badge>
            Customer Booking Interface
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4">Tour Option</th>
                <th className="text-left py-3 px-4">Transfer Option</th>
                <th className="text-center py-3 px-4">Adult</th>
                <th className="text-center py-3 px-4">Child</th>
                <th className="text-center py-3 px-4">Infant</th>
                <th className="text-right py-3 px-4">Total</th>
                <th className="text-center py-3 px-4">Book</th>
              </tr>
            </thead>
            <tbody>
              {variantsPricing.map((variant) => (
                <tr key={variant.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="font-semibold">{variant.name}</div>
                  </td>
                  <td className="py-4 px-4">
                    <Select defaultValue="0">
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {variant.transfers.map((t, idx) => (
                          <SelectItem key={idx} value={idx.toString()}>
                            {t.type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-4 px-4">
                    <Select defaultValue="2">
                      <SelectTrigger className="w-16">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 1, 2, 3, 4, 5].map((n) => (
                          <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-4 px-4">
                    <Select defaultValue="0">
                      <SelectTrigger className="w-16">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 1, 2, 3, 4, 5].map((n) => (
                          <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-4 px-4">
                    <Select defaultValue="0">
                      <SelectTrigger className="w-16">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 1, 2, 3, 4, 5].map((n) => (
                          <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="text-lg font-bold text-green-600">
                      ₹ {(variant.transfers[0].adultPrice * 2).toLocaleString()}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <Button className="bg-orange-500 hover:bg-orange-600">
                      Book Now
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// OPTION 3: Simplified Pricing Matrix
// ============================================================================
function Option3View({ viewMode }: { viewMode: "operator" | "customer" }) {
  // Simple matrix: Tour Type + Transfer Type = Fixed Price (regardless of pax count, then multiply)
  const pricingMatrix = {
    budget: {
      ticketOnly: 1500,
      hotelPickup: 2000,
      privateTransfer: 3000,
    },
    standard: {
      ticketOnly: 1800,
      hotelPickup: 2300,
      privateTransfer: 3300,
    },
    deluxe: {
      ticketOnly: 2200,
      hotelPickup: 2700,
      privateTransfer: 3700,
    },
    premium: {
      ticketOnly: 2500,
      hotelPickup: 3000,
      privateTransfer: 4000,
    },
  };

  if (viewMode === "operator") {
    return (
      <div className="space-y-6">
        <Card className="border-2 border-indigo-200">
          <CardHeader className="bg-indigo-50">
            <CardTitle className="flex items-center gap-2">
              <Badge className="bg-indigo-600">Option 3</Badge>
              Tour Operator Setup Interface - Simplified Matrix
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <p className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded p-3">
              💡 Simplified approach: Set one price per combination, then multiply by passenger count with standard rules
            </p>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Pricing Matrix Setup</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full border-2 border-gray-300 rounded-lg overflow-hidden">
                  <thead className="bg-indigo-600 text-white">
                    <tr>
                      <th className="py-3 px-4 text-left">Tour Option</th>
                      <th className="py-3 px-4 text-center">Ticket Only</th>
                      <th className="py-3 px-4 text-center">Hotel Pickup</th>
                      <th className="py-3 px-4 text-center">Private Transfer</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b bg-white">
                      <td className="py-3 px-4 font-semibold">Budget</td>
                      <td className="py-3 px-4 text-center">
                        <Input value={`₹ ${pricingMatrix.budget.ticketOnly}`} className="w-28 mx-auto text-center" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Input value={`₹ ${pricingMatrix.budget.hotelPickup}`} className="w-28 mx-auto text-center" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Input value={`₹ ${pricingMatrix.budget.privateTransfer}`} className="w-28 mx-auto text-center" />
                      </td>
                    </tr>
                    <tr className="border-b bg-gray-50">
                      <td className="py-3 px-4 font-semibold">Standard</td>
                      <td className="py-3 px-4 text-center">
                        <Input value={`₹ ${pricingMatrix.standard.ticketOnly}`} className="w-28 mx-auto text-center" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Input value={`₹ ${pricingMatrix.standard.hotelPickup}`} className="w-28 mx-auto text-center" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Input value={`₹ ${pricingMatrix.standard.privateTransfer}`} className="w-28 mx-auto text-center" />
                      </td>
                    </tr>
                    <tr className="border-b bg-white">
                      <td className="py-3 px-4 font-semibold">Deluxe</td>
                      <td className="py-3 px-4 text-center">
                        <Input value={`₹ ${pricingMatrix.deluxe.ticketOnly}`} className="w-28 mx-auto text-center" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Input value={`₹ ${pricingMatrix.deluxe.hotelPickup}`} className="w-28 mx-auto text-center" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Input value={`₹ ${pricingMatrix.deluxe.privateTransfer}`} className="w-28 mx-auto text-center" />
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="py-3 px-4 font-semibold">Premium</td>
                      <td className="py-3 px-4 text-center">
                        <Input value={`₹ ${pricingMatrix.premium.ticketOnly}`} className="w-28 mx-auto text-center" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Input value={`₹ ${pricingMatrix.premium.hotelPickup}`} className="w-28 mx-auto text-center" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Input value={`₹ ${pricingMatrix.premium.privateTransfer}`} className="w-28 mx-auto text-center" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <Card className="bg-indigo-50 border-indigo-200">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Global Passenger Rules:</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">Child Price</label>
                      <Input value="50% of Adult" readOnly className="bg-white" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Infant Price</label>
                      <Input value="Free" readOnly className="bg-white" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Calculation</label>
                      <div className="text-xs mt-2 text-gray-600">
                        Price × (Adults + 0.5×Children)
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Advantages:</h4>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Only 12 price points to manage (4 tours × 3 transfers)</li>
                  <li>Simple grid layout - easy to understand</li>
                  <li>Quick to update prices</li>
                  <li>Passenger multipliers handled automatically</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Customer View
  return (
    <div className="space-y-6">
      <Card className="border-2 border-purple-200">
        <CardHeader className="bg-purple-50">
          <CardTitle className="flex items-center gap-2">
            <Badge className="bg-purple-600">Option 3</Badge>
            Customer Booking Interface
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4">Tour Option</th>
                <th className="text-left py-3 px-4">Transfer Option</th>
                <th className="text-center py-3 px-4">Adult</th>
                <th className="text-center py-3 px-4">Child</th>
                <th className="text-center py-3 px-4">Infant</th>
                <th className="text-right py-3 px-4">Total</th>
                <th className="text-center py-3 px-4">Book</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(pricingMatrix).map(([key, prices]) => (
                <tr key={key} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                  </td>
                  <td className="py-4 px-4">
                    <Select defaultValue="ticketOnly">
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ticketOnly">Ticket Only</SelectItem>
                        <SelectItem value="hotelPickup">Hotel Pickup (+₹{prices.hotelPickup - prices.ticketOnly})</SelectItem>
                        <SelectItem value="privateTransfer">Private Transfer (+₹{prices.privateTransfer - prices.ticketOnly})</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-4 px-4">
                    <Select defaultValue="2">
                      <SelectTrigger className="w-16">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 1, 2, 3, 4, 5].map((n) => (
                          <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-4 px-4">
                    <Select defaultValue="0">
                      <SelectTrigger className="w-16">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 1, 2, 3, 4, 5].map((n) => (
                          <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-4 px-4">
                    <Select defaultValue="0">
                      <SelectTrigger className="w-16">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 1, 2, 3, 4, 5].map((n) => (
                          <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="text-lg font-bold text-green-600">
                      ₹ {(prices.ticketOnly * 2).toLocaleString()}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <Button className="bg-orange-500 hover:bg-orange-600">
                      Book Now
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// COMPARISON TABLE
// ============================================================================
function ComparisonTable() {
  return (
    <Card className="border-2 border-gray-300">
      <CardHeader>
        <CardTitle>Comparison Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left">Criteria</th>
                <th className="py-3 px-4 text-center bg-green-50">Option 1: Separate</th>
                <th className="py-3 px-4 text-center bg-orange-50">Option 2: Embedded</th>
                <th className="py-3 px-4 text-center bg-indigo-50">Option 3: Matrix</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3 px-4 font-medium">Setup Complexity</td>
                <td className="py-3 px-4 text-center bg-green-50">⭐⭐⭐⭐ Easy</td>
                <td className="py-3 px-4 text-center bg-orange-50">⭐⭐ Complex</td>
                <td className="py-3 px-4 text-center bg-indigo-50">⭐⭐⭐⭐⭐ Very Easy</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4 font-medium">Data Points to Manage</td>
                <td className="py-3 px-4 text-center bg-green-50">Base + 4 Variants + 4 Transfers = <strong>9 points</strong></td>
                <td className="py-3 px-4 text-center bg-orange-50">4 × 3 × 3 = <strong>36 points</strong></td>
                <td className="py-3 px-4 text-center bg-indigo-50">4 × 3 = <strong>12 points</strong></td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4 font-medium">Flexibility</td>
                <td className="py-3 px-4 text-center bg-green-50">⭐⭐⭐ Good</td>
                <td className="py-3 px-4 text-center bg-orange-50">⭐⭐⭐⭐⭐ Maximum</td>
                <td className="py-3 px-4 text-center bg-indigo-50">⭐⭐⭐ Good</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4 font-medium">Ease of Updates</td>
                <td className="py-3 px-4 text-center bg-green-50">⭐⭐⭐⭐ Very Easy</td>
                <td className="py-3 px-4 text-center bg-orange-50">⭐⭐ Tedious</td>
                <td className="py-3 px-4 text-center bg-indigo-50">⭐⭐⭐⭐ Easy</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4 font-medium">Customer Experience</td>
                <td className="py-3 px-4 text-center bg-green-50">⭐⭐⭐⭐ Clear</td>
                <td className="py-3 px-4 text-center bg-orange-50">⭐⭐⭐⭐ Clear</td>
                <td className="py-3 px-4 text-center bg-indigo-50">⭐⭐⭐⭐ Clear</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4 font-medium">Scalability</td>
                <td className="py-3 px-4 text-center bg-green-50">⭐⭐⭐⭐⭐ Excellent</td>
                <td className="py-3 px-4 text-center bg-orange-50">⭐⭐ Poor</td>
                <td className="py-3 px-4 text-center bg-indigo-50">⭐⭐⭐⭐ Very Good</td>
              </tr>
              <tr className="border-b bg-yellow-50">
                <td className="py-3 px-4 font-bold">Recommended For</td>
                <td className="py-3 px-4 text-center text-sm">
                  Universal pricing logic with modular add-ons
                </td>
                <td className="py-3 px-4 text-center text-sm">
                  Highly customized pricing per variant
                </td>
                <td className="py-3 px-4 text-center text-sm">
                  Simple, fixed combinations
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <h4 className="font-bold mb-2">💡 Recommendation:</h4>
          <p className="text-sm">
            <strong>For most tour operators:</strong> <Badge className="bg-green-600">Option 1</Badge> or <Badge className="bg-indigo-600">Option 3</Badge> are recommended.
            <br />
            <strong>Option 1</strong> is best if you want to add/remove transfer options independently.
            <br />
            <strong>Option 3</strong> is best if you have fixed combinations and want maximum simplicity.
            <br />
            <strong>Option 2</strong> only if you need different transfer pricing per tour tier (rare use case).
          </p>
        </div>
      </CardContent>
    </Card>
  );
}


import { createFileRoute } from "@tanstack/react-router";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  ["How does an order move?", "Pending → Confirmed → Processing → Shipped → Delivered. The seller moves it forward and you see every step in your order history."],
  ["Can I cancel my order?", "Yes, while it is Pending or Confirmed. Once it is Processing, Shipped or Delivered it can no longer be cancelled."],
  ["What happens to stock when I cancel?", "The items go straight back to the seller's stock."],
  ["How do I become a seller?", "Choose “I want to sell” when creating your account. Your store is created instantly."],
  ["Which payment methods are accepted?", "Cash on delivery and card (demo)."],
];

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — bozor" },
      { name: "description", content: "Answers about orders, cancellation, payment and selling on bozor." },
      { property: "og:title", content: "FAQ — bozor" },
      { property: "og:description", content: "Answers about orders, cancellation, payment and selling on bozor." },
    ],
  }),
  component: () => (
    <div className="container-page max-w-2xl py-16">
      <h1 className="text-4xl font-extrabold">Frequently asked questions</h1>
      <Accordion type="single" collapsible className="mt-8">
        {faqs.map(([q, a]) => (
          <AccordionItem key={q} value={q}>
            <AccordionTrigger className="text-left">{q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  ),
});

import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact bozor support" },
      { name: "description", content: "Get in touch with the bozor team." },
      { property: "og:title", content: "Contact bozor support" },
      { property: "og:description", content: "Get in touch with the bozor team." },
    ],
  }),
  component: () => (
    <div className="container-page grid max-w-4xl gap-10 py-16 md:grid-cols-2">
      <div>
        <h1 className="text-4xl font-extrabold">Say hello.</h1>
        <p className="mt-4 text-muted-foreground">Questions about an order or selling? We usually reply within a day.</p>
        <p className="mt-6 text-sm">support@bozor.example<br />Tashkent, Uzbekistan</p>
      </div>
      <form className="space-y-3 rounded-2xl border bg-card p-6" onSubmit={(e) => { e.preventDefault(); e.currentTarget.reset(); toast.success("Message sent — we'll be in touch"); }}>
        <input required placeholder="Your name" className="h-11 w-full rounded-lg border bg-background px-3" />
        <input required type="email" placeholder="Email" className="h-11 w-full rounded-lg border bg-background px-3" />
        <textarea required placeholder="Message" rows={5} className="w-full rounded-lg border bg-background p-3" />
        <Button type="submit" className="w-full">Send</Button>
      </form>
    </div>
  ),
});

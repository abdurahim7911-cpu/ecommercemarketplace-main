import { createFileRoute } from "@tanstack/react-router";
import { OrderDetail } from "@/components/OrderDetail";

export const Route = createFileRoute("/_authenticated/orders/$id")({
  head: () => ({ meta: [{ title: "Order details — bozor" }, { name: "description", content: "Track your order status." }, { property: "og:title", content: "Order details — bozor" }, { property: "og:description", content: "Track your order." }] }),
  component: () => {
    const { id } = Route.useParams();
    return <div className="container-page max-w-3xl py-10"><OrderDetail id={id} /></div>;
  },
});

import { cva } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";

console.log("cva type:", typeof cva);
console.log("Slot type:", typeof Slot);

try {
    const variants = cva("base-class", {
        variants: {
            variant: {
                default: "default-class",
            },
        },
    });
    console.log("variants created successfully");
} catch (e) {
    console.error("Error using cva:", e);
}

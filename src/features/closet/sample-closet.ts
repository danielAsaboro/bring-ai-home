import type { Closet } from "./model";

// A fictional wardrobe. Every garment and image is invented for this course.
export function sampleCloset(): Closet {
  return {
    garments: [
      { id: "navy-blazer", name: "Navy blazer", category: "outerwear", colour: "navy", material: "wool", notes: "Slightly long in the sleeve.", state: "clean", image: "/garments/navy-blazer.png" },
      { id: "white-oxford", name: "White oxford shirt", category: "top", colour: "white", material: "cotton", notes: "", state: "clean", image: "/garments/white-oxford.png" },
      { id: "grey-tee", name: "Grey tee", category: "top", colour: "grey", material: "cotton", notes: "", state: "worn", image: "/garments/grey-tee.png" },
      { id: "striped-breton", name: "Striped breton", category: "top", colour: "white and navy", material: "cotton", notes: "", state: "clean", image: "/garments/striped-breton.png" },
      { id: "linen-shirt", name: "Linen shirt", category: "top", colour: "sand", material: "linen", notes: "Creases fast.", state: "washing", image: "/garments/linen-shirt.png" },
      { id: "dark-jeans", name: "Dark jeans", category: "bottom", colour: "indigo", material: "denim", notes: "", state: "clean", image: "/garments/dark-jeans.png" },
      { id: "olive-chinos", name: "Olive chinos", category: "bottom", colour: "olive", material: "cotton twill", notes: "", state: "clean", image: "/garments/olive-chinos.png" },
      { id: "black-dress", name: "Black dress", category: "dress", colour: "black", material: "crepe", notes: "", state: "repair", image: "/garments/black-dress.png" },
      { id: "yellow-raincoat", name: "Yellow raincoat", category: "outerwear", colour: "yellow", material: "waxed cotton", notes: "", state: "clean", image: "/garments/yellow-raincoat.png" },
      { id: "white-sneakers", name: "White sneakers", category: "shoes", colour: "white", material: "leather", notes: "", state: "clean", image: "/garments/white-sneakers.png" },
      { id: "brown-boots", name: "Brown boots", category: "shoes", colour: "brown", material: "suede", notes: "", state: "clean", image: "/garments/brown-boots.png" },
      { id: "red-scarf", name: "Red scarf", category: "accessory", colour: "red", material: "wool", notes: "", state: "clean", image: "/garments/red-scarf.png" },
    ],
    looks: [
      { id: "look-gallery-opening", title: "Gallery opening", occasion: "evening event, smart casual", garmentIds: ["navy-blazer", "white-oxford", "dark-jeans", "brown-boots"], createdAt: "2026-09-18T19:00:00.000Z" },
      { id: "look-rainy-commute", title: "Rainy commute", occasion: "work day in the rain", garmentIds: ["yellow-raincoat", "striped-breton", "olive-chinos", "brown-boots"], createdAt: "2026-09-12T08:00:00.000Z" },
      { id: "look-saturday-market", title: "Saturday market", occasion: "relaxed weekend errands", garmentIds: ["grey-tee", "dark-jeans", "white-sneakers"], createdAt: "2026-09-06T10:00:00.000Z" },
      { id: "look-winter-walk", title: "Winter walk", occasion: "cold outdoor walk", garmentIds: ["navy-blazer", "striped-breton", "olive-chinos", "red-scarf", "brown-boots"], createdAt: "2026-08-30T15:00:00.000Z" },
    ],
    trip: { name: "Lisbon weekend", limit: 6, garmentIds: ["white-oxford", "dark-jeans"] },
  };
}

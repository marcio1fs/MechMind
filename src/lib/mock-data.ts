export type StockItem = {
  id: string;
  code: string;
  name: string;
  category: string;
  quantity: number;
  min_quantity: number;
  cost_price: number;
  sale_price: number;
};

export const mockStockItems: StockItem[] = [
  { id: "ITEM-001", code: "HF-103", name: "FILTRO DE ÓLEO", category: "MOTOR", quantity: 25, min_quantity: 10, cost_price: 15.50, sale_price: 35.00 },
  { id: "ITEM-002", code: "PST-201", name: "PASTILHA DE FREIO DIANTEIRA", category: "FREIOS", quantity: 8, min_quantity: 10, cost_price: 80.00, sale_price: 150.00 },
  { id: "ITEM-003", code: "BLB-H4", name: "LÂMPADA H4", category: "ELÉTRICA", quantity: 0, min_quantity: 20, cost_price: 5.00, sale_price: 15.00 },
  { id: "ITEM-004", code: "AMRT-D01", name: "AMORTECEDOR DIANTEIRO", category: "SUSPENSÃO", quantity: 4, min_quantity: 4, cost_price: 250.00, sale_price: 450.00 },
  { id: "ITEM-005", code: "VLA-IR", name: "VELA DE IGNIÇÃO IRIDIUM", category: "MOTOR", quantity: 15, min_quantity: 16, cost_price: 45.00, sale_price: 90.00 },
];

export type Mechanic = {
  id: string;
  name: string;
  specialty: string;
};

export const mockMechanics: Mechanic[] = [
  { id: "MEC-001", name: "CARLOS ALBERTO", specialty: "MOTOR E INJEÇÃO" },
  { id: "MEC-002", name: "BRUNO FERNANDES", specialty: "SUSPENSÃO E FREIOS" },
  { id: "MEC-003", name: "RICARDO PEREIRA", specialty: "ELÉTRICA E AR CONDICIONADO" },
];

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

export const mockVehicleMakes: string[] = [
    "FIAT",
    "VOLKSWAGEN",
    "CHEVROLET",
    "FORD",
    "HYUNDAI",
    "TOYOTA",
    "HONDA",
    "RENAULT",
    "JEEP",
    "NISSAN",
    "PEUGEOT",
    "CITROËN",
    "MITSUBISHI",
    "BMW",
    "MERCEDES-BENZ",
    "AUDI",
];

export type FinancialTransaction = {
  id: string;
  description: string;
  category: string;
  type: "IN" | "OUT";
  value: number;
  date: string;
  reference_id?: string;
  reference_type?: "OS" | "STOCK" | "MANUAL";
}

export const mockFinancialTransactions: FinancialTransaction[] = [
    { id: "FIN-001", description: "PAGAMENTO OS-001", category: "ORDEM DE SERVIÇO", type: "IN", value: 125.50, date: "2024-07-20T14:00:00Z", reference_id: "ORD-001", reference_type: "OS" },
    { id: "FIN-002", description: "COMPRA DE PEÇAS - FORNECEDOR A", category: "COMPRA DE ESTOQUE", type: "OUT", value: 550.00, date: "2024-07-19T10:00:00Z", reference_type: "STOCK" },
    { id: "FIN-003", description: "SALÁRIO - CARLOS ALBERTO", category: "SALÁRIOS", type: "OUT", value: 2500.00, date: "2024-07-05T09:00:00Z", reference_type: "MANUAL" },
    { id: "FIN-004", description: "PAGAMENTO OS-004", category: "ORDEM DE SERVIÇO", type: "IN", value: 215.75, date: "2024-06-15T18:00:00Z", reference_id: "ORD-004", reference_type: "OS" },
    { id: "FIN-005", description: "CONTA DE LUZ", category: "DESPESAS FIXAS", type: "OUT", value: 350.20, date: "2024-07-10T11:00:00Z", reference_type: "MANUAL" },
    { id: "FIN-006", description: "VENDA BALCÃO - FILTRO DE AR", category: "VENDA BALCÃO", type: "IN", value: 80.00, date: "2024-07-21T16:00:00Z", reference_type: "MANUAL" },
    { id: "FIN-007", description: "ALUGUEL", category: "DESPESAS FIXAS", type: "OUT", value: 1500.00, date: "2024-06-05T09:00:00Z", reference_type: "MANUAL" },
    { id: "FIN-008", description: "VENDA BALCÃO - JOGO DE VELAS", category: "VENDA BALCÃO", type: "IN", value: 360.00, date: "2024-05-28T11:00:00Z", reference_type: "MANUAL" },

];

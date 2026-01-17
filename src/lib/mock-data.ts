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

export type Mechanic = {
  id: string;
  name: string;
  specialty: string;
};

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

export const mockOrders = [
  {
    id: "ORD-001",
    customer: "JOHN DOE",
    customerDocumentType: "CPF",
    customerCpf: "111.222.333-44",
    customerPhone: "5511999998888",
    vehicle: { make: "HONDA", model: "CIVIC", year: 2021, plate: "ABC1D23", color: "BRANCO" },
    mechanicId: "MEC-001",
    mechanicName: "CARLOS ALBERTO",
    startDate: new Date("2024-07-20T12:00:00Z"),
    status: "FINALIZADO",
    services: [
        { description: "TROCA DE ÓLEO E FILTRO", quantity: 1, unitPrice: 90.50 },
    ],
    parts: [{ itemId: 'ITEM-001', code: 'HF-103', name: 'FILTRO DE ÓLEO', quantity: 1, sale_price: 35.00 }],
    total: 125.5,
    symptoms: "LUZ DE MANUTENÇÃO ACESA.",
    diagnosis: "DIAGNÓSTICO: MANUTENção DE ROTINA NECESSÁRIA.\n\nCONFIANÇA: 95%\n\nAÇÕES RECOMENDADAS:\nREALIZAR TROCA DE ÓLEO E FILTRO. FAZER RODÍZIO DOS PNEUS E VERIFICAR A PRESSÃO.",
    paymentMethod: "CARTÃO DE CRÉDITO",
  },
  {
    id: "ORD-002",
    customer: "OFICINA DO ZÉ LTDA",
    customerDocumentType: "CNPJ",
    customerCnpj: "12.345.678/0001-99",
    customerPhone: "5521987654321",
    vehicle: { make: "FORD", model: "F-150", year: 2019, plate: "DEF4E56", color: "PRETO" },
    mechanicId: "MEC-002",
    mechanicName: "BRUNO FERNANDES",
    startDate: new Date("2024-07-21T12:00:00Z"),
    status: "EM ANDAMENTO",
    services: [{ description: "MÃO DE OBRA - TROCA DE PASTILHAS", quantity: 1, unitPrice: 50.00 }],
    parts: [{ itemId: 'ITEM-002', code: 'PST-201', name: 'PASTILHA DE FREIO DIANTEIRA', quantity: 2, sale_price: 150.00 }],
    total: 350.0,
    symptoms: "BARULHO DE RANGIDO AO FREAR.",
  },
  {
    id: "ORD-003",
    customer: "SAM WILSON",
    customerDocumentType: "CPF",
    customerCpf: "333.444.555-66",
    customerPhone: "5531912345678",
    vehicle: { make: "TOYOTA", model: "CAMRY", year: 2022, plate: "GHI7F89", color: "PRATA" },
    startDate: new Date("2024-07-22T12:00:00Z"),
    status: "PENDENTE",
    services: [{ description: "VERIFICAÇÃO DE DIAGNÓSTICO", quantity: 1, unitPrice: 75.00 }],
    parts: [],
    total: 75.0,
    symptoms: "MOTOR FALHANDO EM MARCHA LENTA.",
  },
  {
    id: "ORD-004",
    customer: "EMILY BROWN",
    customerDocumentType: "CPF",
    customerCpf: "444.555.666-77",
    customerPhone: "5541955554444",
    vehicle: { make: "BMW", model: "X5", year: 2020, plate: "JKL0G12", color: "AZUL" },
    mechanicId: "MEC-001",
    mechanicName: "CARLOS ALBERTO",
    startDate: new Date("2024-06-15T12:00:00Z"),
    status: "CONCLUÍDO",
    services: [
        { description: "INSPEÇÃO ANUAL", quantity: 1, unitPrice: 150.00 },
        { description: "SUBSTITUIÇÃO DO FILTRO DE AR", quantity: 1, unitPrice: 65.75 }
    ],
    parts: [],
    total: 215.75,
  },
];

export const formatCurrency = (amount: number, currency = "USD"): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export const calculateOrderTotal = (subtotal: number, taxes = 0, discount = 0): number => {
  return subtotal + taxes - discount
}

export const calculateTaxes = (subtotal: number, taxRate = 0.1): number => {
  return subtotal * taxRate
}

export const generateOrderId = (): string => {
  return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

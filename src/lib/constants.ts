export type SelectOption<T extends string> = {
  value: T
  label: string
}

export const FUEL_TYPES = [
  { value: 'diesel', label: 'Diesel' },
  { value: 'gasoline95', label: 'Gasoline 95' },
  { value: 'gasoline98', label: 'Gasoline 98' },
  { value: 'other', label: 'Other' },
] as const satisfies readonly SelectOption<string>[]

export type FuelType = (typeof FUEL_TYPES)[number]['value']

export const SERVICE_TYPES = [
  { value: 'engine-oil', label: 'Engine oil change' },

  { value: 'air-filter', label: 'Air filter' },
  { value: 'oil-filter', label: 'Oil filter' },
  { value: 'fuel-filter', label: 'Fuel filter' },
  { value: 'cabin-filter', label: 'Cabin filter' },

  { value: 'brake-pads-front', label: 'Brake pads (Front)' },
  { value: 'brake-pads-rear', label: 'Brake pads (Rear)' },
  { value: 'brake-discs-front', label: 'Brake discs (Front)' },
  { value: 'brake-discs-rear', label: 'Brake discs (Rear)' },

  { value: 'spark-plugs', label: 'Spark plugs' },
  { value: 'ac-refill', label: 'A/C refill' },

  { value: 'tire-change', label: 'Tire change' },
  { value: 'battery', label: 'Battery' },

  { value: 'repair', label: 'General repair' },
  { value: 'upgrade', label: 'Upgrade' },

  { value: 'other', label: 'Other' },
] as const

export type ServiceType = (typeof SERVICE_TYPES)[number]['value']

